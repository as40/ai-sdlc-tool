import { Strategy as OidcStrategy } from 'passport-openidconnect';
import type { OidcConfig } from '../sso.service';
import type { OidcProfile, VerifyFunction } from 'passport-openidconnect';

export function createOidcStrategy(config: OidcConfig, verify: VerifyFunction): OidcStrategy {
  return new OidcStrategy(
    {
      issuer: config.issuer,
      authorizationURL: config.authorizationUrl,
      tokenURL: config.tokenUrl,
      userInfoURL: config.userInfoUrl,
      clientID: config.clientId,
      clientSecret: config.clientSecret,
      callbackURL: config.redirectUri,
      scope: ['openid', 'email', 'profile'],
    },
    verify,
  );
}

export function extractEmailFromOidcProfile(profile: OidcProfile): string | null {
  if (profile.emails?.[0]?.value) return profile.emails[0].value;
  const jsonEmail = profile._json?.['email'];
  return typeof jsonEmail === 'string' ? jsonEmail : null;
}
