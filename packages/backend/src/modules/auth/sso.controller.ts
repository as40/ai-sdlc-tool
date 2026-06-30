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

function issueToken(email: string, role: string = 'DEVELOPER'): string {
  const secret = process.env['JWT_SECRET'];
  if (!secret) throw new Error('JWT_SECRET not configured');
  return jwt.sign({ sub: email, email, role }, secret, { expiresIn: '8h' });
}

function frontendUrl(): string {
  return process.env['CORS_ORIGIN'] ?? 'http://localhost:5173';
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
    res
      .status(404)
      .json({
        status: 404,
        title: 'Not Found',
        detail: 'OIDC config not found for this workspace.',
      });
    return;
  }

  const strategyName = `oidc-${workspaceId}`;
  passport.use(
    strategyName,
    createOidcStrategy(config as OidcConfig, (_issuer, profile, done) => {
      done(null, profile);
    }),
  );

  (req.session as Record<string, unknown>)['ssoWorkspaceId'] = workspaceId;

  passport.authenticate(strategyName, { session: false })(req, res, next);
}

export async function oidcCallbackController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const workspaceId = (req.session as Record<string, unknown>)['ssoWorkspaceId'] as
    string | undefined;
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

    try {
      const token = issueToken(email);
      res.redirect(`${frontendUrl()}?token=${token}`);
    } catch {
      next(new Error('Failed to issue token'));
    }
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
    res
      .status(404)
      .json({
        status: 404,
        title: 'Not Found',
        detail: 'SAML config not found for this workspace.',
      });
    return;
  }

  (req.session as Record<string, unknown>)['ssoWorkspaceId'] = workspaceId;

  const strategyName = `saml-${workspaceId}`;
  passport.use(
    strategyName,
    createSamlStrategy(config as SamlConfig, (profile, done) => {
      done(null, profile ?? undefined);
    }),
  );

  passport.authenticate(strategyName, { session: false })(req, res, next);
}

export async function samlCallbackController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const workspaceId = (req.session as Record<string, unknown>)['ssoWorkspaceId'] as
    string | undefined;
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
    createSamlStrategy(config as SamlConfig, (profile, done) => {
      done(null, profile ?? undefined);
    }),
  );

  passport.authenticate(strategyName, { session: false }, (err: unknown, profile: SamlProfile) => {
    if (err || !profile) {
      return res.redirect(`${frontendUrl()}/login?error=sso_failed`);
    }
    const email = extractEmailFromSamlProfile(profile);
    if (!email) return res.redirect(`${frontendUrl()}/login?error=no_email`);

    try {
      const token = issueToken(email);
      res.redirect(`${frontendUrl()}?token=${token}`);
    } catch {
      next(new Error('Failed to issue token'));
    }
  })(req, res, next);
}

// ── Admin config routes ────────────────────────────────────────────────────

export async function getSsoConfigController(req: Request, res: Response): Promise<void> {
  const workspaceId = req.query['workspaceId'] as string | undefined;
  const provider = req.query['provider'] as SsoProvider | undefined;

  if (!workspaceId || !provider) {
    res
      .status(400)
      .json({
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
    res
      .status(400)
      .json({
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
