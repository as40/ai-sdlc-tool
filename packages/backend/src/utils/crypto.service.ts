import crypto from 'node:crypto';
import { CryptoError } from './errors';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const KEY_BYTE_LENGTH = 32;
const KEY_HEX_LENGTH = KEY_BYTE_LENGTH * 2;

export class CryptoService {
  private getKey(): Buffer {
    const hexKey = process.env.ENCRYPTION_KEY;
    if (!hexKey) {
      throw new CryptoError('ENCRYPTION_KEY environment variable is not set');
    }
    if (hexKey.length !== KEY_HEX_LENGTH || !/^[0-9a-fA-F]+$/.test(hexKey)) {
      throw new CryptoError(`ENCRYPTION_KEY must be exactly ${KEY_HEX_LENGTH} hex characters (${KEY_BYTE_LENGTH} bytes)`);
    }
    return Buffer.from(hexKey, 'hex');
  }

  encrypt(plaintext: string): string {
    if (plaintext.length === 0) {
      throw new CryptoError('Cannot encrypt an empty string');
    }
    const key = this.getKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv) as crypto.CipherGCM;
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return Buffer.concat([iv, authTag, encrypted]).toString('base64');
  }

  decrypt(ciphertext: string): string {
    const key = this.getKey();
    const combined = Buffer.from(ciphertext, 'base64');
    if (combined.length < IV_LENGTH + AUTH_TAG_LENGTH + 1) {
      throw new CryptoError('Malformed ciphertext: data is too short');
    }
    const iv = combined.subarray(0, IV_LENGTH);
    const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
    try {
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv) as crypto.DecipherGCM;
      decipher.setAuthTag(authTag);
      return decipher.update(encrypted).toString('utf8') + decipher.final('utf8');
    } catch {
      throw new CryptoError('Decryption failed: ciphertext has been tampered with or key is wrong');
    }
  }
}

export const cryptoService = new CryptoService();
