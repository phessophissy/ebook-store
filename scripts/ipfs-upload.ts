/**
 * IPFS Upload Script for eBook Store
 * 
 * This script handles:
 * 1. Encrypting ebook files using AES-256-GCM
 * 2. Uploading encrypted files to IPFS via Pinata
 * 3. Returning the CID and encryption metadata
 * 
 * Usage:
 *   npx ts-node scripts/ipfs-upload.ts <file-path> [--encrypt]
 * 
 * Environment variables:
 *   PINATA_JWT - Your Pinata JWT token
 *   SERVER_SECRET - Secret key for encryption key derivation
 */

import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

// Configuration
const PINATA_API_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS";
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

// Load environment variables
const PINATA_JWT = process.env.PINATA_JWT;
const SERVER_SECRET = process.env.SERVER_SECRET || "default-secret-change-in-production";

interface UploadResult {
  success: boolean;
  cid?: string;
  contentHash?: string;
  encrypted?: boolean;
  iv?: string;
  authTag?: string;
  error?: string;
}

/**
 * Generate encryption key from components
 */
function generateEncryptionKey(walletAddress: string, serverSecret: string): Buffer {
  const combined = `${walletAddress}:${serverSecret}`;
  return crypto.createHash("sha256").update(combined).digest();
}

/**
 * Encrypt file data using AES-256-GCM
 */
function encryptFile(data: Buffer, key: Buffer): { encrypted: Buffer; iv: Buffer; authTag: Buffer } {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  const encrypted = Buffer.concat([
    cipher.update(data),
    cipher.final(),
  ]);
  
  const authTag = cipher.getAuthTag();
  
  return { encrypted, iv, authTag };
}

/**
 * Calculate SHA-256 hash of CID for contract storage
 */
function cidToContentHash(cid: string): string {
  return crypto.createHash("sha256").update(cid).digest("hex");
}

/**
 * Upload file to IPFS via Pinata
 */
async function uploadToPinata(fileBuffer: Buffer, filename: string): Promise<string> {
  if (!PINATA_JWT) {
    throw new Error("PINATA_JWT environment variable is required");
  }

  const formData = new FormData();
  formData.append("file", new Blob([fileBuffer]), filename);
  
  // Add metadata
  formData.append("pinataMetadata", JSON.stringify({
    name: filename,
    keyvalues: {
      app: "ebook-store",
      uploadedAt: new Date().toISOString(),
    },
  }));

  const response = await fetch(PINATA_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PINATA_JWT}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Pinata upload failed: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  return result.IpfsHash;
}

/**
 * Main upload function
 */
async function uploadEbook(
  filePath: string,
  options: { encrypt?: boolean; walletAddress?: string } = {}
): Promise<UploadResult> {
  try {
    // Validate file exists
    if (!fs.existsSync(filePath)) {
      return { success: false, error: `File not found: ${filePath}` };
    }

    // Read file
    const fileBuffer = fs.readFileSync(filePath);
    const filename = path.basename(filePath);
    
    let uploadBuffer = fileBuffer;
    let iv: string | undefined;
    let authTag: string | undefined;

    // Encrypt if requested
    if (options.encrypt) {
      const walletAddress = options.walletAddress || "default-wallet";
      const key = generateEncryptionKey(walletAddress, SERVER_SECRET);
      
      console.log("🔐 Encrypting file...");
      const encrypted = encryptFile(fileBuffer, key);
      
      // Combine iv + authTag + encrypted data
      uploadBuffer = Buffer.concat([
        encrypted.iv,
        encrypted.authTag,
        encrypted.encrypted,
      ]);
      
      iv = encrypted.iv.toString("hex");
      authTag = encrypted.authTag.toString("hex");
      
      console.log(`   IV: ${iv}`);
      console.log(`   Auth Tag: ${authTag}`);
    }

    // Upload to IPFS
    console.log("📤 Uploading to IPFS...");
    const cid = await uploadToPinata(uploadBuffer, options.encrypt ? `${filename}.encrypted` : filename);
    
    // Calculate content hash for contract
    const contentHash = cidToContentHash(cid);

    console.log("\n✅ Upload successful!");
    console.log(`   CID: ${cid}`);
    console.log(`   Content Hash (for contract): 0x${contentHash}`);
    console.log(`   IPFS Gateway URL: https://ipfs.io/ipfs/${cid}`);

    return {
      success: true,
      cid,
      contentHash,
      encrypted: options.encrypt,
      iv,
      authTag,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: errorMessage };
  }
}

/**
 * Decrypt downloaded file
 */
function decryptFile(
  encryptedBuffer: Buffer,
  walletAddress: string,
  serverSecret: string = SERVER_SECRET
): Buffer {
  const key = generateEncryptionKey(walletAddress, serverSecret);
  
  // Extract iv, authTag, and encrypted content
  const iv = encryptedBuffer.subarray(0, IV_LENGTH);
  const authTag = encryptedBuffer.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = encryptedBuffer.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);
}

// CLI execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║           eBook Store - IPFS Upload Script                      ║
╠════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  Usage:                                                          ║
║    npx ts-node scripts/ipfs-upload.ts <file> [options]          ║
║                                                                  ║
║  Options:                                                        ║
║    --encrypt           Encrypt the file before upload            ║
║    --wallet <address>  Wallet address for encryption key         ║
║                                                                  ║
║  Environment:                                                    ║
║    PINATA_JWT          Your Pinata JWT token (required)          ║
║    SERVER_SECRET       Secret for encryption key derivation      ║
║                                                                  ║
║  Examples:                                                       ║
║    npx ts-node scripts/ipfs-upload.ts mybook.pdf                 ║
║    npx ts-node scripts/ipfs-upload.ts mybook.pdf --encrypt       ║
║                                                                  ║
╚════════════════════════════════════════════════════════════════╝
    `);
    process.exit(0);
  }

  const filePath = args[0];
  const encrypt = args.includes("--encrypt");
  const walletIndex = args.indexOf("--wallet");
  const walletAddress = walletIndex !== -1 ? args[walletIndex + 1] : undefined;

  console.log(`\n📚 eBook Store - IPFS Upload\n`);
  console.log(`   File: ${filePath}`);
  console.log(`   Encrypted: ${encrypt ? "Yes" : "No"}`);
  if (walletAddress) {
    console.log(`   Wallet: ${walletAddress}`);
  }
  console.log("");

  const result = await uploadEbook(filePath, { encrypt, walletAddress });

  if (!result.success) {
    console.error(`\n❌ Error: ${result.error}`);
    process.exit(1);
  }

  // Output JSON for programmatic use
  console.log("\n📋 JSON Output:");
  console.log(JSON.stringify(result, null, 2));
}

// Run if executed directly
main().catch(console.error);

// Export for use as module
export { uploadEbook, decryptFile, cidToContentHash, generateEncryptionKey };
