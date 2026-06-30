import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CryptoService } from '../crypto.service';
import { CryptoError } from '../errors';

const VALID_KEY = 'a'.repeat(64);

describe('CryptoService', () => {
  let service: CryptoService;
  let savedKey: string | undefined;

  beforeEach(() => {
    savedKey = process.env.ENCRYPTION_KEY;
    process.env.ENCRYPTION_KEY = VALID_KEY;
    service = new CryptoService();
  });

  afterEach(() => {
    if (savedKey === undefined) {
      delete process.env.ENCRYPTION_KEY;
    } else {
      process.env.ENCRYPTION_KEY = savedKey;
    }
  });

  describe('encrypt', () => {
    it('should return a non-empty base64 string', () => {
      const result = service.encrypt('hello');
      expect(result.length).toBeGreaterThan(0);
      expect(Buffer.from(result, 'base64').toString('base64')).toBe(result);
    });

    it('should produce different ciphertexts for the same plaintext (unique IV)', () => {
      const c1 = service.encrypt('hello');
      const c2 = service.encrypt('hello');
      expect(c1).not.toBe(c2);
    });

    it('should throw CryptoError when ENCRYPTION_KEY is missing', () => {
      delete process.env.ENCRYPTION_KEY;
      expect(() => service.encrypt('hello')).toThrow(CryptoError);
    });

    it('should throw CryptoError when ENCRYPTION_KEY is malformed (wrong length)', () => {
      process.env.ENCRYPTION_KEY = 'abc123';
      expect(() => service.encrypt('hello')).toThrow(CryptoError);
    });

    it('should throw CryptoError when ENCRYPTION_KEY contains non-hex characters', () => {
      process.env.ENCRYPTION_KEY = 'z'.repeat(64);
      expect(() => service.encrypt('hello')).toThrow(CryptoError);
    });

    it('should throw CryptoError for empty string', () => {
      expect(() => service.encrypt('')).toThrow(CryptoError);
    });
  });

  describe('decrypt', () => {
    it('should return the original plaintext after encrypt → decrypt round-trip', () => {
      const plaintext = 'Hello, World!';
      expect(service.decrypt(service.encrypt(plaintext))).toBe(plaintext);
    });

    it('should handle unicode strings', () => {
      const unicode = '日本語テスト 中文 العربية 🎉';
      expect(service.decrypt(service.encrypt(unicode))).toBe(unicode);
    });

    it('should handle very long strings (>64KB)', () => {
      const longString = 'x'.repeat(70_000);
      expect(service.decrypt(service.encrypt(longString))).toBe(longString);
    });

    it('should throw CryptoError if ciphertext is tampered with (body flipped)', () => {
      const buf = Buffer.from(service.encrypt('secret'), 'base64');
      buf[buf.length - 1] ^= 0xff;
      expect(() => service.decrypt(buf.toString('base64'))).toThrow(CryptoError);
    });

    it('should throw CryptoError if auth tag is invalid', () => {
      const buf = Buffer.from(service.encrypt('secret'), 'base64');
      buf[16] ^= 0xff;
      expect(() => service.decrypt(buf.toString('base64'))).toThrow(CryptoError);
    });

    it('should throw CryptoError for malformed input (too short)', () => {
      expect(() => service.decrypt('dG9vc2hvcnQ=')).toThrow(CryptoError);
    });

    it('should throw CryptoError when ENCRYPTION_KEY is missing during decrypt', () => {
      const ciphertext = service.encrypt('secret');
      delete process.env.ENCRYPTION_KEY;
      expect(() => service.decrypt(ciphertext)).toThrow(CryptoError);
    });
  });
});
