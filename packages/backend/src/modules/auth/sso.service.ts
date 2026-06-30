import { and, eq } from 'drizzle-orm';
import { db } from '../../db';
import { ssoConfigurations } from '../../db/schema';
import { cryptoService } from '../../utils/crypto.service';

export type SsoProvider = 'oidc' | 'saml';

export interface OidcConfig {
  clientId: string;
  clientSecret: string;
  issuer: string;
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  redirectUri: string;
}

export interface SamlConfig {
  entryPoint: string;
  certificate: string;
  issuer: string;
}

export type SsoConfig = OidcConfig | SamlConfig;

export class SsoService {
  async saveConfig(workspaceId: string, provider: SsoProvider, config: SsoConfig): Promise<void> {
    const configEncrypted = cryptoService.encrypt(JSON.stringify(config));

    await db
      .delete(ssoConfigurations)
      .where(
        and(
          eq(ssoConfigurations.workspaceId, workspaceId),
          eq(ssoConfigurations.provider, provider),
        ),
      );

    await db.insert(ssoConfigurations).values({ workspaceId, provider, configEncrypted });
  }

  async getConfig(workspaceId: string, provider: SsoProvider): Promise<SsoConfig | null> {
    const [row] = await db
      .select()
      .from(ssoConfigurations)
      .where(
        and(
          eq(ssoConfigurations.workspaceId, workspaceId),
          eq(ssoConfigurations.provider, provider),
        ),
      )
      .limit(1);

    if (!row) return null;

    return JSON.parse(cryptoService.decrypt(row.configEncrypted)) as SsoConfig;
  }
}

export const ssoService = new SsoService();
