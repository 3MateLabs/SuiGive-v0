"use client";

import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { Button } from "./ui/button";
import { useState, useEffect } from "react";

interface WalletConnectButtonProps {
  onConnect?: () => void;
  className?: string;
}

export function WalletConnectButton({ onConnect, className = "" }: WalletConnectButtonProps) {
  const currentAccount = useCurrentAccount();
  const [isConnected, setIsConnected] = useState(false);

  // Check if wallet is connected
  useEffect(() => {
    if (currentAccount) {
      setIsConnected(true);
      onConnect?.();
    } else {
      setIsConnected(false);
    }
  }, [currentAccount, onConnect]);

  return (
    <div className={className}>
      {isConnected ? (
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full">
            Wallet Connected
          </div>
          <ConnectButton />
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm text-red-500 mb-1">
            Please connect your wallet to continue
          </p>
          <ConnectButton />
        </div>
      )}
    </div>
  );
}
