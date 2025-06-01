"use client";

import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { Button } from "./ui/button";
import { useState, useEffect } from "react";
import { Wallet } from "lucide-react";

// Custom wrapper for ConnectButton that prevents loading profile images and applies custom styling
function CustomConnectButton(props: React.ComponentProps<typeof ConnectButton>) {
  const currentAccount = useCurrentAccount();
  const isConnected = !!currentAccount;
  
  // Override the CSS to prevent profile images from loading and apply custom styling
  return (
    <div className="custom-connect-button">
      <style jsx global>{`
        /* Prevent Twitter profile images from loading */
        .custom-connect-button img[src*="pbs.twimg.com"],
        .custom-connect-button img[src*="profile_images"] {
          display: none !important;
        }
        
        /* Hide any image tags that might be trying to load Twitter profile images */
        img[src*="pbs.twimg.com"],
        img[src*="profile_images"] {
          display: none !important;
        }
        
        /* Style the connect button (both connected and disconnected states) */
        .custom-connect-button button {
          border-radius: 9999px !important;
          /* Removed background, border, padding, color, and font-weight to allow external styling */
          transition: all 0.2s ease-in-out !important;
        }
        
        /* Hover effects for all buttons */
        .custom-connect-button button:hover {
          transform: scale(1.05) !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
        }
        
        /* Style for connected state - add green dot indicator */
        .custom-connect-button [data-connected="true"] button::before {
          content: '' !important;
          display: inline-block !important;
          width: 8px !important;
          height: 8px !important;
          background-color: #10b981 !important; /* emerald-500 */
          border-radius: 50% !important;
          margin-right: 6px !important;
          animation: pulse 2s infinite !important;
        }
        
        @keyframes pulse {
          0% { opacity: 0.7; }
          50% { opacity: 1; }
          100% { opacity: 0.7; }
        }
        
        /* Make the wallet address more readable */
        .custom-connect-button [data-connected="true"] span {
          color: #0c4a6e !important; /* dark blue */
          font-weight: 500 !important;
        }
      `}</style>
      <ConnectButton {...props} />
    </div>
  );
}

interface WalletConnectButtonProps {
  onConnect?: () => void;
  className?: string;
  variant?: "default" | "compact" | "navbar" | "donation" | "createCampaign";
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
      
      const newIsConnected = !!currentAccount;
      if (newIsConnected !== isConnected) {
        setIsConnected(newIsConnected);
        if (newIsConnected) {
          onConnect?.();
        }
      }
    };
    
    // Small delay to ensure stable connection state
    const timeoutId = setTimeout(updateConnectionState, 100);
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [currentAccount, onConnect, isConnected]);

  // Enhanced variant for navbar
  if (variant === "navbar") {
    return (
      <div className={`${className} ml-1`}>
        <CustomConnectButton className="text-sm" />
      </div>
    );
  }
  
  // New variant for create campaign button styling
  if (variant === "createCampaign") {
    return (
      <div className={`${className}`}>
        <CustomConnectButton className="bg-sui-navy text-white rounded-full px-5 py-2 font-medium hover:bg-sui-navy/90 transition-all duration-200 hover:shadow-md" />
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
            <CustomConnectButton />
          </div>
        ) : (
          <CustomConnectButton />
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
            <CustomConnectButton />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
            {showMessage && (
              <p className="text-sm text-gray-700 mb-1">
                Please connect your wallet to donate
              </p>
            )}
            <CustomConnectButton connectText="Connect Wallet to Donate" />
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
          <CustomConnectButton />
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          {showMessage && (
            <p className="text-sm text-red-500 mb-1">
              Please connect your wallet to continue
            </p>
          )}
          <CustomConnectButton />
        </div>
      )}
    </div>
  );
}
