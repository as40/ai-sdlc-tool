import type { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { ssoService } from './sso.service';
import type { OidcConfig, SamlConfig, SsoProvider } from './sso.service';
import { createOidcStrategy, extractEmailFromOidcProfile } from './strategies/oidc.strategy';
import { createSamlStrategy, extractEmailFromSamlProfile } from './strategies/saml.strategy';
import type { OidcProfile } from 'passport-openidconnect';
import type { Profile as SamlProfile } from '@node-saml/passport-saml';
import { jitProvisioningMiddleware, JitProvisioningError } from './jit-provisioning.middleware';
import type { UserRecord } from '../users/user.types';
import type { SsoProfile } from '../users/user.types';

const OidcConfigSchema = z.object({
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
  issuer: z.string().url(),
  authorizationUrl: z.string().url(),
  tokenUrl: z.string().url(),
  userInfoUrl: z.string().url(),
  redirectUri: z.string().url(),
});

const SamlConfigSchema = z.object({
  entryPoint: z.string().url(),
  certificate: z.string().min(1),
  issuer: z.string().min(1),
});

function signUserToken(user: UserRecord): string {
  const secret = process.env['JWT_SECRET'];
  if (!secret) throw new Error('JWT_SECRET not configured');
  return jwt.sign({ sub: user.id, email: user.email, role: user.accessLevel }, secret, {
    expiresIn: '8h',
  });
}

function extractDisplayNameFromOidcProfile(profile: OidcProfile): string {
  if (profile.displayName) return profile.displayName;
  const given =
    typeof profile._json?.['given_name'] === 'string' ? profile._json['given_name'] : '';
  const family =
    typeof profile._json?.['family_name'] === 'string' ? profile._json['family_name'] : '';
  const full = [given, family].filter(Boolean).join(' ');
  return full || 'Unknown';
}

function extractDisplayNameFromSamlProfile(profile: SamlProfile): string {
  if (typeof profile.displayName === 'string' && profile.displayName) return profile.displayName;
  return 'Unknown';
}

function frontendUrl(): string {
  return process.env['FRONTEND_URL'] ?? process.env['CORS_ORIGIN'] ?? 'http://localhost:5173';
}

function session(req: Request): Record<string, unknown> {
  return req.session as unknown as Record<string, unknown>;
}

// ── OIDC flow ──────────────────────────────────────────────────────────────

export async function oidcInitiateController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const workspaceId = req.query['workspaceId'] as string | undefined;
  if (!workspaceId) {
    res.status(400).json({ status: 400, title: 'Bad Request', detail: 'workspaceId is required.' });
    return;
  }

  const config = await ssoService.getConfig(workspaceId, 'oidc').catch(() => null);
  if (!config) {
    res.status(404).json({
      status: 404,
      title: 'Not Found',
      detail: 'OIDC config not found for this workspace.',
    });
    return;
  }

  session(req)['ssoWorkspaceId'] = workspaceId;

  const strategyName = `oidc-${workspaceId}`;
  passport.use(
    strategyName,
    createOidcStrategy(config as OidcConfig, (_issuer, profile, done) => {
      done(null, profile);
    }),
  );

  passport.authenticate(strategyName, { session: false })(req, res, next);
}

export async function oidcCallbackController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const workspaceId = session(req)['ssoWorkspaceId'] as string | undefined;
  if (!workspaceId) {
    res.redirect(`${frontendUrl()}/login?error=missing_workspace`);
    return;
  }

  const config = await ssoService.getConfig(workspaceId, 'oidc').catch(() => null);
  if (!config) {
    res.redirect(`${frontendUrl()}/login?error=no_oidc_config`);
    return;
  }

  const strategyName = `oidc-${workspaceId}`;
  passport.use(
    strategyName,
    createOidcStrategy(config as OidcConfig, (_issuer, profile, done) => {
      done(null, profile);
    }),
  );

  passport.authenticate(strategyName, { session: false }, (err: unknown, profile: OidcProfile) => {
    if (err || !profile) {
      return res.redirect(`${frontendUrl()}/login?error=sso_failed`);
    }
    const email = extractEmailFromOidcProfile(profile);
    if (!email) return res.redirect(`${frontendUrl()}/login?error=no_email`);

    const ssoProfile: SsoProfile = {
      email,
      displayName: extractDisplayNameFromOidcProfile(profile),
      providerId: profile.id,
    };

    void jitProvisioningMiddleware(ssoProfile, (provisionErr, user) => {
      if (provisionErr instanceof JitProvisioningError && provisionErr.statusCode === 403) {
        return res.redirect(`${frontendUrl()}/login?error=account_disabled`);
      }
      if (provisionErr || !user) {
        return next(provisionErr ?? new Error('Provisioning failed'));
      }
      try {
        const token = signUserToken(user);
        res.redirect(`${frontendUrl()}?token=${token}`);
      } catch {
        next(new Error('Failed to issue token'));
      }
    });
  })(req, res, next);
}

// ── SAML flow ──────────────────────────────────────────────────────────────

export async function samlInitiateController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const workspaceId = req.query['workspaceId'] as string | undefined;
  if (!workspaceId) {
    res.status(400).json({ status: 400, title: 'Bad Request', detail: 'workspaceId is required.' });
    return;
  }

  const config = await ssoService.getConfig(workspaceId, 'saml').catch(() => null);
  if (!config) {
    res.status(404).json({
      status: 404,
      title: 'Not Found',
      detail: 'SAML config not found for this workspace.',
    });
    return;
  }

  session(req)['ssoWorkspaceId'] = workspaceId;

  const strategyName = `saml-${workspaceId}`;
  passport.use(
    strategyName,
    // cast needed: @node-saml/passport-saml ships Express 4 types; project uses Express 5
    createSamlStrategy(config as SamlConfig, (profile, done) => {
      done(null, profile ?? undefined);
    }) as unknown as passport.Strategy,
  );

  passport.authenticate(strategyName, { session: false })(req, res, next);
}

export async function samlCallbackController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const workspaceId = session(req)['ssoWorkspaceId'] as string | undefined;
  if (!workspaceId) {
    res.redirect(`${frontendUrl()}/login?error=missing_workspace`);
    return;
  }

  const config = await ssoService.getConfig(workspaceId, 'saml').catch(() => null);
  if (!config) {
    res.redirect(`${frontendUrl()}/login?error=no_saml_config`);
    return;
  }

  const strategyName = `saml-${workspaceId}`;
  passport.use(
    strategyName,
    // cast needed: @node-saml/passport-saml ships Express 4 types; project uses Express 5
    createSamlStrategy(config as SamlConfig, (profile, done) => {
      done(null, profile ?? undefined);
    }) as unknown as passport.Strategy,
  );

  passport.authenticate(strategyName, { session: false }, (err: unknown, profile: SamlProfile) => {
    if (err || !profile) {
      return res.redirect(`${frontendUrl()}/login?error=sso_failed`);
    }
    const email = extractEmailFromSamlProfile(profile);
    if (!email) return res.redirect(`${frontendUrl()}/login?error=no_email`);

    const ssoProfile: SsoProfile = {
      email,
      displayName: extractDisplayNameFromSamlProfile(profile),
      providerId: profile.nameID ?? email,
    };

    void jitProvisioningMiddleware(ssoProfile, (provisionErr, user) => {
      if (provisionErr instanceof JitProvisioningError && provisionErr.statusCode === 403) {
        return res.redirect(`${frontendUrl()}/login?error=account_disabled`);
      }
      if (provisionErr || !user) {
        return next(provisionErr ?? new Error('Provisioning failed'));
      }
      try {
        const token = signUserToken(user);
        res.redirect(`${frontendUrl()}?token=${token}`);
      } catch {
        next(new Error('Failed to issue token'));
      }
    });
  })(req, res, next);
}

// ── Admin config routes ────────────────────────────────────────────────────

export async function getSsoConfigController(req: Request, res: Response): Promise<void> {
  const workspaceId = req.query['workspaceId'] as string | undefined;
  const provider = req.query['provider'] as SsoProvider | undefined;

  if (!workspaceId || !provider) {
    res.status(400).json({
      status: 400,
      title: 'Bad Request',
      detail: 'workspaceId and provider are required.',
    });
    return;
  }

  const config = await ssoService.getConfig(workspaceId, provider);
  if (!config) {
    res.status(404).json({ status: 404, title: 'Not Found', detail: 'No SSO config found.' });
    return;
  }

  res.status(200).json({ provider, config });
}

export async function saveSsoConfigController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const workspaceId = req.query['workspaceId'] as string | undefined;
  const provider = req.body?.provider as SsoProvider | undefined;

  if (!workspaceId || !provider) {
    res.status(400).json({
      status: 400,
      title: 'Bad Request',
      detail: 'workspaceId and provider are required.',
    });
    return;
  }

  const schema = provider === 'oidc' ? OidcConfigSchema : SamlConfigSchema;
  const parsed = schema.safeParse(req.body?.config);
  if (!parsed.success) {
    res.status(400).json({
      status: 400,
      title: 'Validation Error',
      detail: parsed.error.errors[0]?.message ?? 'Invalid config',
    });
    return;
  }

  try {
    await ssoService.saveConfig(workspaceId, provider, parsed.data as OidcConfig | SamlConfig);
    res.status(200).json({ message: 'SSO configuration saved.' });
  } catch (err) {
    next(err);
  }
}
