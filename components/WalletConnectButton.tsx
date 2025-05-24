"use client";

import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { Button } from "./ui/button";
import { useState, useEffect } from "react";
import { Wallet } from "lucide-react";

interface WalletConnectButtonProps {
  onConnect?: () => void;
  className?: string;
  variant?: "default" | "compact" | "navbar" | "donation";
  showMessage?: boolean;
}

export function WalletConnectButton({ 
  onConnect, 
  className = "", 
  variant = "default",
  showMessage = true
}: WalletConnectButtonProps) {
  const currentAccount = useCurrentAccount();
  const [isConnected, setIsConnected] = useState(false);

  // Check if wallet is connected with debounce to prevent rapid state changes
  useEffect(() => {
    let isMounted = true;
    
    const updateConnectionState = () => {
      if (!isMounted) return;
      
      if (currentAccount) {
        setIsConnected(true);
        onConnect?.();
      } else {
        setIsConnected(false);
      }
    };
    
    // Small delay to ensure stable connection state
    const timeoutId = setTimeout(updateConnectionState, 100);
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [currentAccount, onConnect]);

  // Compact variant for navbar
  if (variant === "navbar") {
    return (
      <div className={`${className}`}>
          <ConnectButton className="text-sm" />
      </div>
    );
  }
  
  // Compact variant for small spaces
  if (variant === "compact") {
    return (
      <div className={`${className}`}>
        {isConnected ? (
          <div className="flex items-center gap-2">
            <div className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
              Connected
            </div>
            <ConnectButton />
          </div>
        ) : (
          <ConnectButton />
        )}
      </div>
    );
  }
  
  // Donation page variant with prominent styling
  if (variant === "donation") {
    return (
      <div className={`${className} w-full`}>
        {isConnected ? (
          <div className="flex items-center justify-center gap-2 bg-green-50 p-2 rounded-lg">
            <div className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full flex items-center">
              <Wallet className="h-4 w-4 mr-1" />
              Wallet Connected
            </div>
            <ConnectButton />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
            {showMessage && (
              <p className="text-sm text-gray-700 mb-1">
                Please connect your wallet to donate
              </p>
            )}
            <ConnectButton connectText="Connect Wallet to Donate" />
          </div>
        )}
      </div>
    );
  }

  // Default variant
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
          {showMessage && (
            <p className="text-sm text-red-500 mb-1">
              Please connect your wallet to continue
            </p>
          )}
          <ConnectButton />
        </div>
      )}
    </div>
  );
}
