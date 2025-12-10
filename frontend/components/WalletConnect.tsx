/**
 * Wallet connection component for Hiro Wallet
 */

import { useState, useEffect } from "react";
import {
  connectWallet,
  disconnectWallet,
  isSignedIn,
  getUserAddress,
  userSession,
} from "../services/stacks";

interface WalletConnectProps {
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
}

export default function WalletConnect({
  onConnect,
  onDisconnect,
}: WalletConnectProps) {
  const [address, setAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if already signed in
    if (userSession.isSignedIn()) {
      const addr = getUserAddress();
      setAddress(addr);
      onConnect?.(addr!);
    }
    setIsLoading(false);
  }, []);

  const handleConnect = () => {
    connectWallet((userData) => {
      const addr = getUserAddress();
      setAddress(addr);
      onConnect?.(addr!);
    });
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setAddress(null);
    onDisconnect?.();
    // Reload to clear state
    window.location.reload();
  };

  // Truncate address for display
  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isLoading) {
    return (
      <div className="animate-pulse bg-white/10 rounded-lg px-6 py-3 w-40 h-12" />
    );
  }

  if (address) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-white/5 rounded-lg px-4 py-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm text-white/80">{truncateAddress(address)}</span>
        </div>
        <button
          onClick={handleDisconnect}
          className="text-sm text-white/60 hover:text-white transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button onClick={handleConnect} className="btn-primary">
      Connect Wallet
    </button>
  );
}
