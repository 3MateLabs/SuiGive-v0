import React from 'react';
import { WalletProvider } from '@mysten/dapp-kit';

interface SuiWalletProviderProps {
  children: React.ReactNode;
}

export function SuiWalletProvider({ children }: SuiWalletProviderProps) {
  return (
    <WalletProvider>
      {children}
    </WalletProvider>
  );
}
