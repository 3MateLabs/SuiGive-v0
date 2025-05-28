"use client";

import { createNetworkConfig, SuiClientProvider, WalletProvider, type WalletProviderProps } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';

// Import the CSS for the UI components
import '@mysten/dapp-kit/dist/index.css';

// Config options for the networks you want to connect to
// Using our proxy to avoid CORS issues
const { networkConfig } = createNetworkConfig({
  testnet: { 
    url: getFullnodeUrl('testnet'),
    // Use the official websocket URL
    websocketUrl: 'wss://fullnode.testnet.sui.io:443'
  },
  mainnet: { 
    url: getFullnodeUrl('mainnet'),
    // Use the official websocket URL
    websocketUrl: 'wss://fullnode.mainnet.sui.io:443'
  },
});

// Create a client for React Query with better caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep data fresh but don't refetch on window focus which can cause wallet disconnects
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (previously called cacheTime)
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
});

// Configure wallet provider options to persist connection
const walletProviderProps = {
  autoConnect: true, // Automatically try to reconnect to the last wallet
  preferredWallets: ['Sui Wallet', 'Ethos Wallet', 'Suiet'],
  // Use localStorage to persist wallet connection
  localStorageKey: 'suigive-wallet-connection',
};

export default function SuiProviders({ children }: { children: ReactNode }) {
  // Add state to track if the app is hydrated
  const [isHydrated, setIsHydrated] = useState(false);

  // This effect runs once after hydration is complete
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
        <WalletProvider {...walletProviderProps}>
          {/* Only render children after hydration to prevent wallet connection issues */}
          {isHydrated ? children : 
            <div className="min-h-screen flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sui-navy"></div>
            </div>
          }
          <Toaster position="bottom-right" toastOptions={{ duration: 5000 }} />
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
