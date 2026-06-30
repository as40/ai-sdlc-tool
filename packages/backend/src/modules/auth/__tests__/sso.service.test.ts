import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SsoService } from '../sso.service';

const VALID_ENC_KEY = 'a'.repeat(64);

const mocks = vi.hoisted(() => {
  const mockDelete = vi.fn();
  const mockInsert = vi.fn();
  const mockSelect = vi.fn();
  const mockWhere = vi.fn();
  const mockFrom = vi.fn();
  const mockLimit = vi.fn();
  const mockValues = vi.fn();
  const mockDeleteWhere = vi.fn();
  return {
    mockDelete,
    mockInsert,
    mockSelect,
    mockWhere,
    mockFrom,
    mockLimit,
    mockValues,
    mockDeleteWhere,
  };
});

vi.mock('../../../db', () => ({
  db: {
    delete: mocks.mockDelete,
    insert: mocks.mockInsert,
    select: mocks.mockSelect,
  },
}));

const OIDC_CONFIG = {
  clientId: 'test-client-id',
  clientSecret: 'test-client-secret',
  issuer: 'https://idp.example.com',
  authorizationUrl: 'https://idp.example.com/oauth2/authorize',
  tokenUrl: 'https://idp.example.com/oauth2/token',
  userInfoUrl: 'https://idp.example.com/oauth2/userinfo',
  redirectUri: 'https://app.example.com/api/auth/oidc/callback',
};

describe('SsoService', () => {
  let service: SsoService;
  let savedKey: string | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    savedKey = process.env['ENCRYPTION_KEY'];
    process.env['ENCRYPTION_KEY'] = VALID_ENC_KEY;
    service = new SsoService();

    // delete chain
    mocks.mockDelete.mockReturnValue({ where: mocks.mockDeleteWhere });
    mocks.mockDeleteWhere.mockResolvedValue(undefined);

    // insert chain
    mocks.mockInsert.mockReturnValue({ values: mocks.mockValues });
    mocks.mockValues.mockResolvedValue(undefined);

    // select chain
    mocks.mockSelect.mockReturnValue({ from: mocks.mockFrom });
    mocks.mockFrom.mockReturnValue({ where: mocks.mockWhere });
    mocks.mockWhere.mockReturnValue({ limit: mocks.mockLimit });
    mocks.mockLimit.mockResolvedValue([]);
  });

  afterEach(() => {
    if (savedKey === undefined) delete process.env['ENCRYPTION_KEY'];
    else process.env['ENCRYPTION_KEY'] = savedKey;
  });

  describe('saveConfig', () => {
    it('encrypts the config before inserting into the database', async () => {
      await service.saveConfig('workspace-1', 'oidc', OIDC_CONFIG);

      expect(mocks.mockInsert).toHaveBeenCalledOnce();
      const insertedValues = mocks.mockValues.mock.calls[0]?.[0] as { configEncrypted: string };

      // The encrypted value must NOT be the raw JSON
      expect(insertedValues.configEncrypted).not.toBe(JSON.stringify(OIDC_CONFIG));
      // And it must be a non-empty string (base64 ciphertext)
      expect(insertedValues.configEncrypted.length).toBeGreaterThan(0);
    });

    it('deletes any existing config for the same workspace+provider before inserting', async () => {
      await service.saveConfig('workspace-1', 'oidc', OIDC_CONFIG);

      expect(mocks.mockDelete).toHaveBeenCalledOnce();
      expect(mocks.mockDeleteWhere).toHaveBeenCalledOnce();
      expect(mocks.mockInsert).toHaveBeenCalledOnce();
    });

    it('stores workspaceId and provider on the inserted row', async () => {
      await service.saveConfig('workspace-abc', 'saml', {
        entryPoint: 'https://idp.example.com/saml',
        certificate: 'CERT',
        issuer: 'my-app',
      });

      const insertedValues = mocks.mockValues.mock.calls[0]?.[0] as {
        workspaceId: string;
        provider: string;
      };
      expect(insertedValues.workspaceId).toBe('workspace-abc');
      expect(insertedValues.provider).toBe('saml');
    });
  });

  describe('getConfig', () => {
    it('returns null when no row is found', async () => {
      mocks.mockLimit.mockResolvedValue([]);
      const result = await service.getConfig('workspace-1', 'oidc');
      expect(result).toBeNull();
    });

    it('decrypts the config and returns the original object', async () => {
      // First, save so we have a real encrypted value to decrypt
      await service.saveConfig('workspace-1', 'oidc', OIDC_CONFIG);
      const encryptedValue = (mocks.mockValues.mock.calls[0]?.[0] as { configEncrypted: string })
        .configEncrypted;

      // Now simulate getConfig returning that encrypted row
      mocks.mockLimit.mockResolvedValue([
        { configEncrypted: encryptedValue, workspaceId: 'workspace-1', provider: 'oidc' },
      ]);
      vi.clearAllMocks();
      mocks.mockSelect.mockReturnValue({ from: mocks.mockFrom });
      mocks.mockFrom.mockReturnValue({ where: mocks.mockWhere });
      mocks.mockWhere.mockReturnValue({ limit: mocks.mockLimit });
      mocks.mockLimit.mockResolvedValue([{ configEncrypted: encryptedValue }]);

      const result = await service.getConfig('workspace-1', 'oidc');
      expect(result).toEqual(OIDC_CONFIG);
    });
  });
});
