"use client";
import { WalletKitProvider } from "@mysten/wallet-kit";

export default function WalletProviderClient({ children }: { children: React.ReactNode }) {
  return <WalletKitProvider>{children}</WalletKitProvider>;
} 