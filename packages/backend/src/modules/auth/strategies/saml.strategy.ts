import { Strategy as SamlStrategy } from '@node-saml/passport-saml';
import type { Profile, VerifiedCallback } from '@node-saml/passport-saml';
import type { SamlConfig } from '../sso.service';

export type SamlVerifyFunction = (profile: Profile | null, done: VerifiedCallback) => void;

export function createSamlStrategy(config: SamlConfig, verify: SamlVerifyFunction): SamlStrategy {
  return new SamlStrategy(
    {
      entryPoint: config.entryPoint,
      idpCert: config.certificate,
      issuer: config.issuer,
      callbackUrl:
        process.env['SAML_CALLBACK_URL'] ?? 'http://localhost:3001/api/auth/saml/callback',
      wantAssertionsSigned: false,
    },
    verify,
    verify,
  );
}

export function extractEmailFromSamlProfile(profile: Profile): string | null {
  if (typeof profile.email === 'string') return profile.email;
  if (typeof profile.nameID === 'string' && profile.nameID.includes('@')) return profile.nameID;
  return null;
}
