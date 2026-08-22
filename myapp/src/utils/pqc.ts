import { ml_kem768 } from '@noble/post-quantum/ml-kem.js';
import { sha3_512 } from '@noble/hashes/sha3.js';
import { bytesToHex, hexToBytes, utf8ToBytes } from '@noble/hashes/utils.js';

export const DEFAULT_ADMIN_PASS = 'kelo_artisan_2026';

/**
 * Derives a Post-Quantum resistant hash of a password using NIST SHA3-512 + Salt
 */
export function derivePostQuantumHash(password: string, salt: string = 'kelo_pqc_artisan_2026'): string {
  const combined = `${salt}:${password}:${salt}`;
  const firstPass = sha3_512(utf8ToBytes(combined));
  const secondPass = sha3_512(utf8ToBytes(`${bytesToHex(firstPass)}:${salt}`));
  return bytesToHex(secondPass);
}

/**
 * Encapsulates a shared secret using server's ML-KEM-768 public key (NIST FIPS 203)
 */
export function encapsulateWithServerKey(serverPublicKeyHex: string): {
  cipherTextHex: string;
  sharedSecretHex: string;
} {
  const publicKeyBytes = hexToBytes(serverPublicKeyHex);
  const { cipherText, sharedSecret } = ml_kem768.encapsulate(publicKeyBytes);
  return {
    cipherTextHex: bytesToHex(cipherText),
    sharedSecretHex: bytesToHex(sharedSecret),
  };
}

/**
 * Creates a client-side PQC session token for offline / fallback mode
 */
export function createPqcSessionToken(password: string): string {
  const hash = derivePostQuantumHash(password);
  const payload = {
    timestamp: Date.now(),
    pqcHash: hash,
    algorithm: 'ML-KEM-768 + SHA3-512',
  };
  return btoa(JSON.stringify(payload));
}
