/**
 * IPFS service for eBook Store
 * Handles file encryption, upload, and download from IPFS
 */

import crypto from "crypto";

// IPFS Gateway URL (can be configured)
const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://ipfs.io/ipfs";
const IPFS_UPLOAD_URL = process.env.NEXT_PUBLIC_IPFS_UPLOAD_URL || "https://api.pinata.cloud/pinning/pinFileToIPFS";
const PINATA_JWT = process.env.PINATA_JWT;

// Encryption settings
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Generate encryption key from wallet + ebook ID + server secret
 */
export const generateEncryptionKey = (
  walletAddress: string,
  ebookId: number,
  serverSecret: string
): Buffer => {
  const combined = `${walletAddress}:${ebookId}:${serverSecret}`;
  return crypto.createHash("sha256").update(combined).digest();
};

/**
 * Encrypt data using AES-256-GCM
 */
export const encryptData = (
  data: Buffer,
  key: Buffer
): { encrypted: Buffer; iv: Buffer; authTag: Buffer } => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  const encrypted = Buffer.concat([
    cipher.update(data),
    cipher.final(),
  ]);
  
  const authTag = cipher.getAuthTag();
  
  return { encrypted, iv, authTag };
};

/**
 * Decrypt data using AES-256-GCM
 */
export const decryptData = (
  encryptedData: Buffer,
  key: Buffer,
  iv: Buffer,
  authTag: Buffer
): Buffer => {
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  return Buffer.concat([
    decipher.update(encryptedData),
    decipher.final(),
  ]);
};

/**
 * Upload file to IPFS via Pinata
 */
export const uploadToIPFS = async (
  file: File | Buffer,
  filename: string
): Promise<string> => {
  if (!PINATA_JWT) {
    throw new Error("PINATA_JWT not configured");
  }
  
  const formData = new FormData();
  
  if (file instanceof Buffer) {
    formData.append("file", new Blob([file]), filename);
  } else {
    formData.append("file", file, filename);
  }
  
  const response = await fetch(IPFS_UPLOAD_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PINATA_JWT}`,
    },
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error(`IPFS upload failed: ${response.statusText}`);
  }
  
  const result = await response.json();
  return result.IpfsHash;
};

/**
 * Fetch file from IPFS gateway
 */
export const fetchFromIPFS = async (cid: string): Promise<ArrayBuffer> => {
  const response = await fetch(`${IPFS_GATEWAY}/${cid}`);
  
  if (!response.ok) {
    throw new Error(`IPFS fetch failed: ${response.statusText}`);
  }
  
  return response.arrayBuffer();
};

/**
 * Convert CID to 32-byte buffer for contract storage
 */
export const cidToBuffer = (cid: string): Uint8Array => {
  // Use SHA-256 hash of CID to get consistent 32 bytes
  const hash = crypto.createHash("sha256").update(cid).digest();
  return new Uint8Array(hash);
};

/**
 * Upload encrypted ebook to IPFS
 */
export const uploadEncryptedEbook = async (
  file: File,
  encryptionKey: Buffer
): Promise<{ cid: string; iv: string; authTag: string }> => {
  // Read file as buffer
  const arrayBuffer = await file.arrayBuffer();
  const fileBuffer = Buffer.from(arrayBuffer);
  
  // Encrypt the file
  const { encrypted, iv, authTag } = encryptData(fileBuffer, encryptionKey);
  
  // Combine iv + authTag + encrypted data for storage
  const combinedData = Buffer.concat([iv, authTag, encrypted]);
  
  // Upload to IPFS
  const cid = await uploadToIPFS(combinedData, `${file.name}.encrypted`);
  
  return {
    cid,
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex"),
  };
};

/**
 * Download and decrypt ebook from IPFS
 */
export const downloadDecryptedEbook = async (
  cid: string,
  encryptionKey: Buffer
): Promise<Buffer> => {
  // Fetch encrypted data from IPFS
  const data = await fetchFromIPFS(cid);
  const buffer = Buffer.from(data);
  
  // Extract iv, authTag, and encrypted content
  const iv = buffer.subarray(0, IV_LENGTH);
  const authTag = buffer.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = buffer.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  
  // Decrypt and return
  return decryptData(encrypted, encryptionKey, iv, authTag);
};
