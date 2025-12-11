/**
 * Stacks blockchain service for eBook Store
 * Handles wallet connection, contract interactions, and transactions
 */

import {
  AppConfig,
  UserSession,
  showConnect,
  openContractCall,
} from "@stacks/connect";
import {
  StacksMainnet,
  StacksTestnet,
  StacksDevnet,
} from "@stacks/network";
import {
  uintCV,
  stringUtf8CV,
  bufferCV,
  principalCV,
  cvToValue,
  callReadOnlyFunction,
  ClarityValue,
  cvToJSON,
} from "@stacks/transactions";

// Configuration
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "SP31G2FZ5JN87BATZMP4ZRYE5F7WZQDNEXJ7G7X97";
const CONTRACT_NAME = "ebook-store";

// Debug log
console.log("Contract Config:", { CONTRACT_ADDRESS, CONTRACT_NAME, NETWORK: process.env.NEXT_PUBLIC_NETWORK });

// App configuration for Leather/Hiro Wallet
const appConfig = new AppConfig(["store_write", "publish_data"]);
export const userSession = new UserSession({ appConfig });

// Get network based on environment
export const getNetwork = () => {
  const networkEnv = process.env.NEXT_PUBLIC_NETWORK || "mainnet";
  console.log("Using network:", networkEnv);
  switch (networkEnv) {
    case "mainnet":
      return new StacksMainnet();
    case "testnet":
      return new StacksTestnet();
    default:
      return new StacksDevnet();
  }
};

// ==============================================================================
// WALLET CONNECTION
// ==============================================================================

export const connectWallet = (onFinish?: (userData: any) => void) => {
  showConnect({
    appDetails: {
      name: "eBook Store",
      icon: "/favicon.ico",
    },
    redirectTo: "/",
    onFinish: () => {
      const userData = userSession.loadUserData();
      console.log("Wallet connected:", userData);
      onFinish?.(userData);
    },
    userSession,
  });
};

export const disconnectWallet = () => {
  userSession.signUserOut();
};

export const isSignedIn = () => {
  if (typeof window === "undefined") return false;
  return userSession.isUserSignedIn();
};

export const getUserAddress = (): string | null => {
  if (!isSignedIn()) return null;
  const userData = userSession.loadUserData();
  const network = process.env.NEXT_PUBLIC_NETWORK || "mainnet";
  const address = network === "mainnet"
    ? userData.profile.stxAddress.mainnet
    : userData.profile.stxAddress.testnet;
  console.log("User address:", address, "Network:", network);
  return address;
};

// ==============================================================================
// HELPER: Parse Clarity values safely
// ==============================================================================

/**
 * Recursively extract values from cvToJSON result
 */
const extractValue = (obj: any): any => {
  if (obj === null || obj === undefined) return null;
  
  // If it has a 'value' property, extract it
  if (typeof obj === 'object' && 'value' in obj) {
    const type = obj.type || '';
    
    // Handle optional types - unwrap the inner value
    if (type.startsWith('(optional')) {
      if (obj.value === null) return null;
      return extractValue(obj.value);
    }
    
    // Handle tuple - extract all fields
    if (type.startsWith('(tuple') || type === 'tuple') {
      const result: any = {};
      for (const [key, val] of Object.entries(obj.value as Record<string, any>)) {
        result[key] = extractValue(val);
      }
      return result;
    }
    
    // Handle list
    if (type === 'list' || type.startsWith('(list')) {
      if (Array.isArray(obj.value)) {
        return obj.value.map((item: any) => extractValue(item));
      }
    }
    
    // Handle primitives (uint, int, bool, principal, string, buff)
    if (type === 'uint' || type === 'int') {
      return parseInt(obj.value, 10);
    }
    if (type === 'bool') {
      return obj.value;
    }
    if (type === 'principal' || type.includes('string') || type.includes('buff')) {
      return obj.value;
    }
    
    // Default: return the value
    return obj.value;
  }
  
  // If it's an array, map over it
  if (Array.isArray(obj)) {
    return obj.map((item: any) => extractValue(item));
  }
  
  // Return as-is for primitives
  return obj;
};

/**
 * Parse a Clarity value from contract call
 */
const parseCV = (cv: ClarityValue): any => {
  try {
    const json = cvToJSON(cv);
    console.log("cvToJSON result:", JSON.stringify(json, null, 2));
    const extracted = extractValue(json);
    console.log("Extracted value:", extracted);
    return extracted;
  } catch (err) {
    console.error("Error parsing CV:", err);
    return cvToValue(cv);
  }
};

// ==============================================================================
// READ-ONLY CONTRACT CALLS
// ==============================================================================

export const getEbook = async (ebookId: number) => {
  try {
    const network = getNetwork();
    console.log(`Fetching ebook ${ebookId} from ${CONTRACT_ADDRESS}.${CONTRACT_NAME}`);
    const result = await callReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: "get-ebook",
      functionArgs: [uintCV(ebookId)],
      network,
      senderAddress: CONTRACT_ADDRESS,
    });
    const value = parseCV(result);
    console.log(`Ebook ${ebookId} parsed:`, value);
    return value;
  } catch (err) {
    console.error(`Error fetching ebook ${ebookId}:`, err);
    return null;
  }
};

export const getEbookCount = async (): Promise<number> => {
  try {
    const network = getNetwork();
    console.log(`Fetching ebook count from ${CONTRACT_ADDRESS}.${CONTRACT_NAME}`);
    const result = await callReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: "get-ebook-count",
      functionArgs: [],
      network,
      senderAddress: CONTRACT_ADDRESS,
    });
    const count = parseCV(result);
    console.log("Ebook count:", count);
    return typeof count === 'number' ? count : Number(count) || 0;
  } catch (err) {
    console.error("Error fetching ebook count:", err);
    return 0;
  }
};

export const hasAccess = async (buyerAddress: string, ebookId: number): Promise<boolean> => {
  try {
    const network = getNetwork();
    const result = await callReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: "has-access",
      functionArgs: [principalCV(buyerAddress), uintCV(ebookId)],
      network,
      senderAddress: CONTRACT_ADDRESS,
    });
    return parseCV(result) as boolean;
  } catch (err) {
    console.error("Error checking access:", err);
    return false;
  }
};

export const getAuthorEbooks = async (authorAddress: string): Promise<number[]> => {
  try {
    const network = getNetwork();
    console.log(`Fetching author ebooks for ${authorAddress}`);
    const result = await callReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: "get-author-ebooks",
      functionArgs: [principalCV(authorAddress)],
      network,
      senderAddress: CONTRACT_ADDRESS,
    });
    const ids = parseCV(result);
    console.log("Author ebook IDs (parsed):", ids);
    if (Array.isArray(ids)) {
      return ids.map(id => typeof id === 'number' ? id : Number(id)).filter(id => !isNaN(id));
    }
    return [];
  } catch (err) {
    console.error("Error fetching author ebooks:", err);
    return [];
  }
};

export const getBuyerEbooks = async (buyerAddress: string): Promise<number[]> => {
  try {
    const network = getNetwork();
    console.log(`Fetching buyer ebooks for ${buyerAddress}`);
    const result = await callReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: "get-buyer-ebooks",
      functionArgs: [principalCV(buyerAddress)],
      network,
      senderAddress: CONTRACT_ADDRESS,
    });
    const ids = parseCV(result);
    console.log("Buyer ebook IDs (parsed):", ids);
    if (Array.isArray(ids)) {
      return ids.map(id => typeof id === 'number' ? id : Number(id)).filter(id => !isNaN(id));
    }
    return [];
  } catch (err) {
    console.error("Error fetching buyer ebooks:", err);
    return [];
  }
};

export const isAuthor = async (ebookId: number, userAddress: string): Promise<boolean> => {
  try {
    const network = getNetwork();
    const result = await callReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: "is-author",
      functionArgs: [uintCV(ebookId), principalCV(userAddress)],
      network,
      senderAddress: CONTRACT_ADDRESS,
    });
    return parseCV(result) as boolean;
  } catch (err) {
    console.error("Error checking author:", err);
    return false;
  }
};

// ==============================================================================
// PUBLIC CONTRACT CALLS (TRANSACTIONS)
// ==============================================================================

export const registerEbook = async (
  title: string,
  description: string,
  contentHash: Uint8Array,
  price: number,
  onFinish?: (data: any) => void,
  onCancel?: () => void
) => {
  const network = getNetwork();
  console.log("Registering ebook:", { title, price, CONTRACT_ADDRESS, CONTRACT_NAME });
  
  await openContractCall({
    network,
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: "register-ebook",
    functionArgs: [
      stringUtf8CV(title),
      stringUtf8CV(description),
      bufferCV(contentHash),
      uintCV(price),
    ],
    postConditionMode: 0x01,
    onFinish: (data) => {
      console.log("Ebook registered:", data);
      onFinish?.(data);
    },
    onCancel: () => {
      console.log("Registration cancelled");
      onCancel?.();
    },
  });
};

export const buyEbook = async (
  ebookId: number,
  onFinish?: (data: any) => void,
  onCancel?: () => void
) => {
  const network = getNetwork();
  
  await openContractCall({
    network,
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: "buy-ebook",
    functionArgs: [uintCV(ebookId)],
    postConditionMode: 0x01,
    onFinish: (data) => {
      console.log("Ebook purchased:", data);
      onFinish?.(data);
    },
    onCancel: () => {
      console.log("Purchase cancelled");
      onCancel?.();
    },
  });
};

export const updatePrice = async (
  ebookId: number,
  newPrice: number,
  onFinish?: (data: any) => void,
  onCancel?: () => void
) => {
  const network = getNetwork();
  
  await openContractCall({
    network,
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: "update-price",
    functionArgs: [uintCV(ebookId), uintCV(newPrice)],
    postConditionMode: 0x01,
    onFinish: (data) => {
      console.log("Price updated:", data);
      onFinish?.(data);
    },
    onCancel: () => {
      console.log("Price update cancelled");
      onCancel?.();
    },
  });
};

export const deactivateEbook = async (
  ebookId: number,
  onFinish?: (data: any) => void,
  onCancel?: () => void
) => {
  const network = getNetwork();
  
  await openContractCall({
    network,
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: "deactivate-ebook",
    functionArgs: [uintCV(ebookId)],
    postConditionMode: 0x01,
    onFinish: (data) => {
      console.log("Ebook deactivated:", data);
      onFinish?.(data);
    },
    onCancel: () => {
      console.log("Deactivation cancelled");
      onCancel?.();
    },
  });
};

// ==============================================================================
// UTILITY FUNCTIONS
// ==============================================================================

export const stxToMicroStx = (stx: number): number => Math.floor(stx * 1_000_000);
export const microStxToStx = (microStx: number): number => microStx / 1_000_000;
export const formatStx = (microStx: number): string => `${microStxToStx(microStx).toFixed(6)} STX`;

// ==============================================================================
// EBOOK TYPE DEFINITION
// ==============================================================================

export interface Ebook {
  id: number;
  title: string;
  description: string;
  contentHash: string;
  price: number;
  author: string;
  createdAt: number;
  active: boolean;
}

/**
 * Fetch all ebooks (active only for homepage)
 */
export const getAllEbooks = async (): Promise<Ebook[]> => {
  try {
    const count = await getEbookCount();
    console.log(`Fetching all ${count} ebooks...`);
    const ebooks: Ebook[] = [];
    
    for (let i = 1; i <= count; i++) {
      const ebook = await getEbook(i);
      console.log(`Ebook ${i} raw:`, ebook);
      if (ebook && ebook.active) {
        ebooks.push({
          id: i,
          title: ebook.title || "",
          description: ebook.description || "",
          contentHash: ebook["content-hash"] || ebook.contentHash || "",
          price: Number(ebook.price) || 0,
          author: ebook.author || "",
          createdAt: Number(ebook["created-at"] || ebook.createdAt || 0),
          active: ebook.active,
        });
      }
    }
    
    console.log("All ebooks loaded:", ebooks);
    return ebooks;
  } catch (err) {
    console.error("Error fetching all ebooks:", err);
    return [];
  }
};
