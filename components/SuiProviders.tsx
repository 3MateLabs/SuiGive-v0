"use client";

import { createNetworkConfig, SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

// Import the CSS for the UI components
import '@mysten/dapp-kit/dist/index.css';

// Config options for the networks you want to connect to
// Using specific RPC endpoints for better reliability
const { networkConfig } = createNetworkConfig({
  testnet: { 
    url: "https://fullnode.testnet.sui.io:443",
    // Fallback URLs if needed
    websocketUrl: "wss://fullnode.testnet.sui.io:443"
  },
  mainnet: { 
    url: "https://fullnode.mainnet.sui.io:443",
    websocketUrl: "wss://fullnode.mainnet.sui.io:443"
  },
});

// Create a client for React Query
const queryClient = new QueryClient();

export default function SuiProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
        <WalletProvider>
          {children}
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
