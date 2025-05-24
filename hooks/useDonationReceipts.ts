"use client";

import { useState, useEffect } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useSuiClient } from '@mysten/dapp-kit';
import { getUserDonationReceipts, DonationReceipt } from '../lib/sui-receipts';

export function useDonationReceipts() {
  const currentAccount = useCurrentAccount();
  const client = useSuiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipts, setReceipts] = useState<DonationReceipt[]>([]);
  
  // Check if wallet is connected
  const isWalletConnected = !!currentAccount;
  
  // Fetch donation receipts for the connected wallet
  const fetchDonationReceipts = async () => {
    if (!isWalletConnected || !currentAccount) {
      setError('Wallet not connected. Please connect your wallet to view your NFT receipts.');
      return [];
    }
    
    if (!client) {
      setError('Sui client not available');
      return [];
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching donation receipts for address:', currentAccount.address);
      const userReceipts = await getUserDonationReceipts(client, currentAccount.address);
      
      // Sort receipts by timestamp (newest first)
      const sortedReceipts = [...userReceipts].sort((a, b) => {
        const timestampA = a.timestamp ? parseInt(a.timestamp.toString(), 10) : 0;
        const timestampB = b.timestamp ? parseInt(b.timestamp.toString(), 10) : 0;
        return timestampB - timestampA;
      });
      
      setReceipts(sortedReceipts);
      return sortedReceipts;
    } catch (err: any) {
      console.error('Error fetching donation receipts:', err);
      setError(err.message || 'Failed to fetch donation receipts');
      return [];
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch receipts when wallet connection changes
  useEffect(() => {
    if (isWalletConnected) {
      fetchDonationReceipts();
    } else {
      setReceipts([]);
    }
  }, [isWalletConnected, currentAccount?.address]);
  
  return {
    receipts,
    loading,
    error,
    isWalletConnected,
    refreshReceipts: fetchDonationReceipts
  };
}
