"use client";
import { SuiClientProvider, SuiWalletProvider, createNetworkConfig, SuiMainnetChain } from "@mysten/wallet-kit";

const { networkConfig } = createNetworkConfig({
  chains: [SuiMainnetChain],
  defaultChain: SuiMainnetChain,
});

export default function SuiWalletContextProvider({ children }: { children: React.ReactNode }) {
  return (
    <SuiClientProvider networks={networkConfig}>
      <SuiWalletProvider>
        {children}
      </SuiWalletProvider>
    </SuiClientProvider>
  );
} 