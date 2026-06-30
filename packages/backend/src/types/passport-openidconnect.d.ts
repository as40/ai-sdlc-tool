declare module 'passport-openidconnect' {
  import type { Strategy as PassportStrategy } from 'passport';

  interface OidcStrategyOptions {
    issuer: string;
    authorizationURL: string;
    tokenURL: string;
    userInfoURL: string;
    clientID: string;
    clientSecret: string;
    callbackURL: string;
    scope?: string | string[];
  }

  interface OidcProfile {
    id: string;
    displayName?: string;
    emails?: Array<{ value: string }>;
    _json?: Record<string, unknown>;
  }

  type VerifyDoneCallback = (err: Error | null, user?: unknown) => void;

  type VerifyFunction = (issuer: string, profile: OidcProfile, done: VerifyDoneCallback) => void;

  class Strategy extends PassportStrategy {
    constructor(options: OidcStrategyOptions, verify: VerifyFunction);
    name: string;
  }

  export { Strategy, OidcStrategyOptions, OidcProfile, VerifyFunction };
}
