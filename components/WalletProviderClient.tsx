"use client";
import { WalletProvider } from "@mysten/dapp-kit";

export default function WalletProviderClient({ children }: { children: React.ReactNode }) {
  return <WalletProvider>{children}</WalletProvider>;
}