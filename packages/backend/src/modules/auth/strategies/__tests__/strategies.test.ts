import { describe, it, expect, vi } from 'vitest';
import { extractEmailFromOidcProfile } from '../oidc.strategy';
import { extractEmailFromSamlProfile } from '../saml.strategy';
import type { OidcProfile } from 'passport-openidconnect';
import type { Profile as SamlProfile } from '@node-saml/passport-saml';

const { mockOidcConstructor, mockSamlConstructor } = vi.hoisted(() => ({
  mockOidcConstructor: vi.fn().mockReturnValue({ name: 'openidconnect' }),
  mockSamlConstructor: vi.fn().mockReturnValue({ name: 'saml' }),
}));

vi.mock('passport-openidconnect', () => ({ Strategy: mockOidcConstructor }));
vi.mock('@node-saml/passport-saml', () => ({ Strategy: mockSamlConstructor }));

describe('OIDC strategy helpers', () => {
  describe('extractEmailFromOidcProfile', () => {
    it('extracts email from profile.emails array', () => {
      const profile: OidcProfile = { id: '1', emails: [{ value: 'user@example.com' }] };
      expect(extractEmailFromOidcProfile(profile)).toBe('user@example.com');
    });

    it('extracts email from profile._json.email when emails array is absent', () => {
      const profile: OidcProfile = { id: '1', _json: { email: 'json-user@example.com' } };
      expect(extractEmailFromOidcProfile(profile)).toBe('json-user@example.com');
    });

    it('returns null when neither source has an email', () => {
      const profile: OidcProfile = { id: '1', emails: [], _json: {} };
      expect(extractEmailFromOidcProfile(profile)).toBeNull();
    });

    it('returns null when _json.email is not a string', () => {
      const profile: OidcProfile = { id: '1', _json: { email: 42 } };
      expect(extractEmailFromOidcProfile(profile)).toBeNull();
    });

    it('returns null for an empty profile', () => {
      const profile: OidcProfile = { id: '1' };
      expect(extractEmailFromOidcProfile(profile)).toBeNull();
    });
  });

  describe('createOidcStrategy', () => {
    it('instantiates OidcStrategy with mapped config fields', async () => {
      const { createOidcStrategy } = await import('../oidc.strategy');
      const config = {
        clientId: 'cid',
        clientSecret: 'cs',
        issuer: 'https://idp.example.com',
        authorizationUrl: 'https://idp.example.com/auth',
        tokenUrl: 'https://idp.example.com/token',
        userInfoUrl: 'https://idp.example.com/userinfo',
        redirectUri: 'https://app.example.com/callback',
      };
      const verify = vi.fn();
      createOidcStrategy(config, verify);
      expect(mockOidcConstructor).toHaveBeenCalledWith(
        expect.objectContaining({
          clientID: 'cid',
          clientSecret: 'cs',
          issuer: 'https://idp.example.com',
        }),
        verify,
      );
    });
  });
});

describe('SAML strategy helpers', () => {
  describe('extractEmailFromSamlProfile', () => {
    it('extracts email from profile.email', () => {
      const profile = { email: 'saml@example.com', nameID: 'some-id' } as unknown as SamlProfile;
      expect(extractEmailFromSamlProfile(profile)).toBe('saml@example.com');
    });

    it('extracts email from nameID when it contains @', () => {
      const profile = { nameID: 'user@example.com' } as unknown as SamlProfile;
      expect(extractEmailFromSamlProfile(profile)).toBe('user@example.com');
    });

    it('returns null when nameID does not contain @', () => {
      const profile = { nameID: 'some-opaque-id' } as unknown as SamlProfile;
      expect(extractEmailFromSamlProfile(profile)).toBeNull();
    });

    it('returns null when profile has no email or nameID', () => {
      const profile = {} as unknown as SamlProfile;
      expect(extractEmailFromSamlProfile(profile)).toBeNull();
    });
  });

  describe('createSamlStrategy', () => {
    it('instantiates SamlStrategy with correct config and two verify callbacks', async () => {
      const { createSamlStrategy } = await import('../saml.strategy');
      const config = {
        entryPoint: 'https://idp.example.com/saml',
        certificate: 'CERT-PEM',
        issuer: 'my-app',
      };
      const verify = vi.fn();
      createSamlStrategy(config, verify);
      expect(mockSamlConstructor).toHaveBeenCalledWith(
        expect.objectContaining({ entryPoint: config.entryPoint, issuer: config.issuer }),
        verify,
        verify,
      );
    });
  });
});
