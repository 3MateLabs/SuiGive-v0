"use client";

import { useState, useEffect } from 'react';
import { useCurrentAccount, useCurrentWallet } from '@mysten/dapp-kit';
import { useSuiClient } from '@mysten/dapp-kit';
import { toast } from 'react-hot-toast';
import { 
  getDonationTokens, 
  getSgSuiTokens, 
  transferDonationToken, 
  mintSgSuiTokens, 
  redeemSgSuiTokens,
  transferSgSuiTokens,
  DonationToken,
  SgSuiToken
} from '@/lib/sui-tokens';
import { useTransactionExecution, TransactionExecutionHook } from './useTransactionExecution';

export function useSuiTokens() {
  const client = useSuiClient();
  const currentWallet = useCurrentWallet();
  const currentAccount = useCurrentAccount();
  const { executeTransaction } = useTransactionExecution();
  
  const [donationTokens, setDonationTokens] = useState<DonationToken[]>([]);
  const [sgSuiTokens, setSgSuiTokens] = useState<SgSuiToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if wallet is connected
  const isWalletConnected = !!currentWallet?.isConnected && !!currentAccount;
  
  // Fetch user's tokens when wallet connects
  useEffect(() => {
    if (isWalletConnected && currentAccount) {
      fetchUserTokens();
    }
  }, [isWalletConnected, currentAccount]);

  // Fetch user's tokens
  const fetchUserTokens = async () => {
    if (!isWalletConnected || !currentAccount) {
      setError("Wallet not connected");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Fetch both token types in parallel
      const [donationTokensResult, sgSuiTokensResult] = await Promise.all([
        getDonationTokens(client, currentAccount.address),
        getSgSuiTokens(client, currentAccount.address)
      ]);
      
      setDonationTokens(donationTokensResult);
      setSgSuiTokens(sgSuiTokensResult);
    } catch (err: any) {
      console.error("Error fetching tokens:", err);
      setError(err.message || "Failed to fetch tokens");
    } finally {
      setLoading(false);
    }
  };

  // Transfer donation token
  const transferDonationTokenToAddress = async (tokenId: string, recipient: string) => {
    if (!isWalletConnected) {
      toast.error("Please connect your wallet first");
      return false;
    }

    try {
      setLoading(true);
      toast.loading("Transferring donation token...", { id: "transfer-token" });
      
      const success = await transferDonationToken(
        currentWallet,
        client,
        tokenId,
        recipient
      );
      
      if (success) {
        toast.success("Token transferred successfully!", { id: "transfer-token" });
        // Refresh tokens
        await fetchUserTokens();
        return true;
      } else {
        toast.error("Failed to transfer token", { id: "transfer-token" });
        return false;
      }
    } catch (err: any) {
      console.error("Error transferring donation token:", err);
      toast.error(err.message || "Failed to transfer token", { id: "transfer-token" });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Mint sgSUI tokens from campaign funds
  const mintSgSuiTokensFromCampaign = async (
    campaignId: string,
    ownerCapId: string,
    treasuryId: string,
    minterCapId: string,
    amount: bigint,
    recipient: string
  ) => {
    if (!isWalletConnected) {
      toast.error("Please connect your wallet first");
      return false;
    }

    try {
      setLoading(true);
      toast.loading("Minting sgSUI tokens...", { id: "mint-tokens" });
      
      const success = await mintSgSuiTokens(
        currentWallet,
        client,
        campaignId,
        ownerCapId,
        treasuryId,
        minterCapId,
        amount,
        recipient
      );
      
      if (success) {
        toast.success("Tokens minted successfully!", { id: "mint-tokens" });
        // Refresh tokens
        await fetchUserTokens();
        return true;
      } else {
        toast.error("Failed to mint tokens", { id: "mint-tokens" });
        return false;
      }
    } catch (err: any) {
      console.error("Error minting sgSUI tokens:", err);
      toast.error(err.message || "Failed to mint tokens", { id: "mint-tokens" });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Redeem sgSUI tokens for SUI
  const redeemSgSuiTokensForSui = async (treasuryId: string, tokenId: string, campaignId: string) => {
    if (!isWalletConnected) {
      toast.error("Please connect your wallet first");
      return false;
    }

    try {
      setLoading(true);
      toast.loading("Redeeming sgSUI tokens...", { id: "redeem-tokens" });
      
      const success = await redeemSgSuiTokens(
        currentWallet,
        client,
        treasuryId,
        tokenId,
        campaignId
      );
      
      if (success) {
        toast.success("Tokens redeemed successfully!", { id: "redeem-tokens" });
        // Refresh tokens
        await fetchUserTokens();
        return true;
      } else {
        toast.error("Failed to redeem tokens", { id: "redeem-tokens" });
        return false;
      }
    } catch (err: any) {
      console.error("Error redeeming sgSUI tokens:", err);
      toast.error(err.message || "Failed to redeem tokens", { id: "redeem-tokens" });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Transfer sgSUI tokens
  const transferSgSuiTokensToAddress = async (tokenId: string, recipient: string) => {
    if (!isWalletConnected) {
      toast.error("Please connect your wallet first");
      return false;
    }

    try {
      setLoading(true);
      toast.loading("Transferring sgSUI tokens...", { id: "transfer-sgsui" });
      
      const success = await transferSgSuiTokens(
        currentWallet,
        client,
        tokenId,
        recipient
      );
      
      if (success) {
        toast.success("Tokens transferred successfully!", { id: "transfer-sgsui" });
        // Refresh tokens
        await fetchUserTokens();
        return true;
      } else {
        toast.error("Failed to transfer tokens", { id: "transfer-sgsui" });
        return false;
      }
    } catch (err: any) {
      console.error("Error transferring sgSUI tokens:", err);
      toast.error(err.message || "Failed to transfer tokens", { id: "transfer-sgsui" });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    donationTokens,
    sgSuiTokens,
    loading,
    error,
    isWalletConnected,
    fetchUserTokens,
    transferDonationTokenToAddress,
    mintSgSuiTokensFromCampaign,
    redeemSgSuiTokensForSui,
    transferSgSuiTokensToAddress
  };
}
