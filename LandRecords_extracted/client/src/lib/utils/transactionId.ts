import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a transaction ID with format: hist-XXXXXXXX
 * Takes first 8 characters of UUID (without dashes) for 12 total length
 * @returns Transaction ID like "hist-a1b2c3d4"
 */
export function generateTransactionId(): string {
  const uuid = uuidv4().replace(/-/g, ''); // Remove dashes
  const shortId = uuid.substring(0, 8); // Take first 8 characters
  return `hist-${shortId}`;
}

/**
 * Validate transaction ID format
 * @param txId Transaction ID to validate
 * @returns true if valid format
 */
export function isValidTransactionId(txId: string): boolean {
  return /^hist-[a-f0-9]{8}$/.test(txId);
}
