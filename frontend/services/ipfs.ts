/**
 * IPFS service for eBook Store
 * Handles file upload and download from IPFS (Pinata)
 */

// IPFS Gateway URL (can be configured)
const IPFS_GATEWAY = process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://gateway.pinata.cloud/ipfs";
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;

/**
 * Upload file to IPFS via Pinata
 */
export const uploadToIPFS = async (
  file: File,
  filename: string
): Promise<string> => {
  if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
    throw new Error("Pinata credentials not configured");
  }
  
  const formData = new FormData();
  formData.append("file", file, filename);
  
  const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: {
      "pinata_api_key": PINATA_API_KEY,
      "pinata_secret_api_key": PINATA_SECRET_KEY,
    },
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`IPFS upload failed: ${error}`);
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
 * Convert CID to 32-byte hash for contract storage
 * Uses Web Crypto API for browser compatibility
 */
export const cidToBuffer = async (cid: string): Promise<Uint8Array> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(cid);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(hashBuffer);
};

/**
 * Get IPFS URL for a CID
 */
export const getIPFSUrl = (cid: string): string => {
  return `${IPFS_GATEWAY}/${cid}`;
};
