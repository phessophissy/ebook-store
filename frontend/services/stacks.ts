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
  fetchCallReadOnlyFunction,
  ClarityValue,
} from "@stacks/transactions";

// Configuration
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
const CONTRACT_NAME = "ebook-store";

// App configuration for Hiro Wallet
const appConfig = new AppConfig(["store_write", "publish_data"]);
export const userSession = new UserSession({ appConfig });

// Get network based on environment
export const getNetwork = () => {
  const networkEnv = process.env.NEXT_PUBLIC_NETWORK || "devnet";
  switch (networkEnv) {
    case "mainnet":
      return new StacksMainnet();
    case "testnet":
      return new StacksTestnet();
    default:
      return new StacksDevnet();
  }
};

// ============================================================
// WALLET CONNECTION
// ============================================================

/**
 * Connect to Hiro Wallet
 */
export const connectWallet = (onFinish?: (userData: any) => void) => {
  showConnect({
    appDetails: {
      name: "eBook Store",
      icon: "/favicon.ico",
    },
    redirectTo: "/",
    onFinish: () => {
      const userData = userSession.loadUserData();
      onFinish?.(userData);
    },
    userSession,
  });
};

/**
 * Disconnect wallet
 */
export const disconnectWallet = () => {
  userSession.signUserOut();
};

/**
 * Check if user is signed in
 */
export const isSignedIn = () => {
  return userSession.isUserSignedIn();
};

/**
 * Get current user's STX address
 */
export const getUserAddress = (): string | null => {
  if (!isSignedIn()) return null;
  const userData = userSession.loadUserData();
  const network = process.env.NEXT_PUBLIC_NETWORK || "devnet";
  return network === "mainnet"
    ? userData.profile.stxAddress.mainnet
    : userData.profile.stxAddress.testnet;
};

// ============================================================
// READ-ONLY CONTRACT CALLS
// ============================================================

/**
 * Fetch ebook details by ID
 */
export const getEbook = async (ebookId: number) => {
  const network = getNetwork();
  const result = await fetchCallReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: "get-ebook",
    functionArgs: [uintCV(ebookId)],
    network,
    senderAddress: CONTRACT_ADDRESS,
  });
  return cvToValue(result);
};

/**
 * Get total number of ebooks
 */
export const getEbookCount = async (): Promise<number> => {
  const network = getNetwork();
  const result = await fetchCallReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: "get-ebook-count",
    functionArgs: [],
    network,
    senderAddress: CONTRACT_ADDRESS,
  });
  return Number(cvToValue(result));
};

/**
 * Check if user has access to an ebook
 */
export const hasAccess = async (
  buyerAddress: string,
  ebookId: number
): Promise<boolean> => {
  const network = getNetwork();
  const result = await fetchCallReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: "has-access",
    functionArgs: [principalCV(buyerAddress), uintCV(ebookId)],
    network,
    senderAddress: CONTRACT_ADDRESS,
  });
  return cvToValue(result) as boolean;
};

/**
 * Get all ebooks by an author
 */
export const getAuthorEbooks = async (authorAddress: string) => {
  const network = getNetwork();
  const result = await fetchCallReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: "get-author-ebooks",
    functionArgs: [principalCV(authorAddress)],
    network,
    senderAddress: CONTRACT_ADDRESS,
  });
  return cvToValue(result) as number[];
};

/**
 * Get all ebooks owned by a buyer
 */
export const getBuyerEbooks = async (buyerAddress: string) => {
  const network = getNetwork();
  const result = await fetchCallReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: "get-buyer-ebooks",
    functionArgs: [principalCV(buyerAddress)],
    network,
    senderAddress: CONTRACT_ADDRESS,
  });
  return cvToValue(result) as number[];
};

/**
 * Check if user is the author of an ebook
 */
export const isAuthor = async (
  ebookId: number,
  userAddress: string
): Promise<boolean> => {
  const network = getNetwork();
  const result = await fetchCallReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: "is-author",
    functionArgs: [uintCV(ebookId), principalCV(userAddress)],
    network,
    senderAddress: CONTRACT_ADDRESS,
  });
  return cvToValue(result) as boolean;
};

// ============================================================
// PUBLIC CONTRACT CALLS (TRANSACTIONS)
// ============================================================

/**
 * Register a new ebook
 */
export const registerEbook = async (
  title: string,
  description: string,
  contentHash: Uint8Array,
  price: number,
  onFinish?: (data: any) => void,
  onCancel?: () => void
) => {
  const network = getNetwork();
  
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
    postConditionMode: 0x01, // Allow
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

/**
 * Purchase an ebook
 */
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
    postConditionMode: 0x01, // Allow
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

/**
 * Update ebook price (author only)
 */
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

/**
 * Deactivate an ebook (author only)
 */
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

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Convert STX to microSTX
 */
export const stxToMicroStx = (stx: number): number => {
  return Math.floor(stx * 1_000_000);
};

/**
 * Convert microSTX to STX
 */
export const microStxToStx = (microStx: number): number => {
  return microStx / 1_000_000;
};

/**
 * Format STX amount for display
 */
export const formatStx = (microStx: number): string => {
  return `${microStxToStx(microStx).toFixed(6)} STX`;
};

// ============================================================
// EBOOK TYPE DEFINITION
// ============================================================

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
 * Fetch all active ebooks
 */
export const getAllEbooks = async (): Promise<Ebook[]> => {
  const count = await getEbookCount();
  const ebooks: Ebook[] = [];
  
  for (let i = 1; i <= count; i++) {
    const ebook = await getEbook(i);
    if (ebook && ebook.active) {
      ebooks.push({
        id: i,
        title: ebook.title,
        description: ebook.description,
        contentHash: ebook["content-hash"],
        price: Number(ebook.price),
        author: ebook.author,
        createdAt: Number(ebook["created-at"]),
        active: ebook.active,
      });
    }
  }
  
  return ebooks;
};
