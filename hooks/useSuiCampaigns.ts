"use client";

import { useState, useEffect } from 'react';
import { useCurrentWallet } from '@mysten/dapp-kit';
import { useSuiClient } from '@mysten/dapp-kit';
import { 
  getAllCampaigns, 
  getCampaignDetails,
  isGoalReached,
  Campaign
} from '../lib/sui-campaigns';
import { useTransactionExecution } from './useTransactionExecution';

// No mock implementations - using real blockchain calls only

export function useSuiCampaigns() {
  const currentWallet = useCurrentWallet();
  const client = useSuiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  
  // Add cache for campaign data to prevent unnecessary refetches
  const [campaignCache, setCampaignCache] = useState<{
    timestamp: number;
    data: Campaign[];
  } | null>(null);
  
  // Use our transaction execution hook
  const { 
    createCampaign: executeCreateCampaign, 
    donate: executeDonate, 
    donateSgUSD: executeDonateSgUSD,
    withdrawFunds: executeWithdrawFunds,
    isPending: isTransactionPending,
    isWalletConnected
  } = useTransactionExecution();

  // Load all campaigns with retry logic and caching
  const fetchCampaigns = async (forceRefresh = false) => {
    // Check cache first if not forcing refresh
    const currentTime = Date.now();
    if (!forceRefresh && campaignCache && (currentTime - campaignCache.timestamp < 120000)) {
      // Use cached data if it's less than 2 minutes old
      console.log('Using cached campaign data');
      return campaignCache.data;
    }
    
    setLoading(true);
    setError(null);
    console.log('Starting campaign fetch...');
    
    // Retry configuration
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Check if client is available
        if (!client) {
          console.warn(`Sui client not available on attempt ${attempt + 1}, retrying...`);
          if (attempt < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            continue;
          } else {
            throw new Error('Sui client not available after multiple attempts');
          }
        }
        
        console.log(`Fetching campaigns with client (attempt ${attempt + 1})...`);
        const allCampaigns = await getAllCampaigns(client);
        
        // Make sure we have valid campaign data before updating state
        if (Array.isArray(allCampaigns) && allCampaigns.length > 0) {
          // Update state with the fetched campaigns
          setCampaigns(allCampaigns);
          
          // Update cache with timestamp
          setCampaignCache({
            timestamp: currentTime,
            data: allCampaigns
          });
        }
        
        setLoading(false);
        return allCampaigns;
      } catch (err: any) {
        console.error(`Error loading campaigns (attempt ${attempt + 1}/${maxRetries}):`, err);
        
        // If we've tried the maximum number of times, show error
        if (attempt === maxRetries - 1) {
          const errorMessage = err.message || 'Unknown error';
          console.error('Final error after all retries:', errorMessage);
          setError(`Failed to load campaigns: ${errorMessage}`);
          setLoading(false);
          
          // Return cached data if available, otherwise empty array
          return campaignCache?.data || [];
        }
        
        // Otherwise wait before retrying
        const waitTime = retryDelay * Math.pow(2, attempt);
        console.log(`Waiting ${waitTime}ms before retry ${attempt + 2}...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    // This should never be reached, but just in case
    setError('Unexpected error loading campaigns');
    setLoading(false);
    return campaignCache?.data || [];
  };

  const handleContractCall = async <T,>(fn: Function, ...args: any[]): Promise<T> => {
    setLoading(true);
    setError(null);
    try {
      const result = await fn(...args);
      setLoading(false);
      return result as T;
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setLoading(false);
      throw err;
    }
  };

  return {
    campaigns,
    loading: loading || isTransactionPending,
    error,
    connected: !!currentWallet,
    wallet: currentWallet,
    refreshCampaigns: fetchCampaigns,
    createCampaign: async (
      name: string,
      description: string,
      imageUrl: string,
      goalAmount: number,
      deadline: number,
      category: string
    ) => {
      // Check if wallet is connected
      if (!isWalletConnected) {
        setError('Wallet not connected. Please connect your wallet first.');
        throw new Error('Wallet not connected. Please connect your wallet first.');
      }
      
      try {
        setLoading(true);
        const result = await executeCreateCampaign(
          name, 
          description, 
          imageUrl, 
          goalAmount, 
          deadline, 
          category
        );
        setLoading(false);
        return result;
      } catch (err: any) {
        setLoading(false);
        setError(err.message || 'Error during campaign creation');
        console.error('Error during campaign creation:', err);
        throw err;
      }
    },
    donate: async (
      campaignId: string,
      amount: number,
      isAnonymous: boolean = false
    ) => {
      // Check if wallet is connected
      if (!isWalletConnected) {
        setError('Wallet not connected. Please connect your wallet first.');
        throw new Error('Wallet not connected. Please connect your wallet first.');
      }
      
      try {
        setLoading(true);
        const result = await executeDonate(campaignId, amount, isAnonymous);
        setLoading(false);
        return result;
      } catch (err: any) {
        setLoading(false);
        setError(err.message || 'Error during donation');
        console.error('Error during donation:', err);
        throw err;
      }
    },
    donateSgUSD: async (
      campaignId: string,
      coinObjectId: string,
      amount: number,
      isAnonymous: boolean = false
    ) => {
      // Check if wallet is connected
      if (!isWalletConnected) {
        setError('Wallet not connected. Please connect your wallet first.');
        throw new Error('Wallet not connected. Please connect your wallet first.');
      }
      
      try {
        setLoading(true);
        const result = await executeDonateSgUSD(campaignId, coinObjectId, amount, isAnonymous);
        setLoading(false);
        return result;
      } catch (err: any) {
        setLoading(false);
        setError(err.message || 'Error during sgUSD donation');
        console.error('Error during sgUSD donation:', err);
        throw err;
      }
    },
    withdrawFunds: async (
      campaignId: string,
      capabilityId: string
    ) => {
      // Check if wallet is connected
      if (!isWalletConnected) {
        setError('Wallet not connected. Please connect your wallet first.');
        throw new Error('Wallet not connected. Please connect your wallet first.');
      }
      
      try {
        setLoading(true);
        const result = await executeWithdrawFunds(campaignId, capabilityId);
        setLoading(false);
        return result;
      } catch (err: any) {
        setLoading(false);
        setError(err.message || 'Error during withdrawal');
        console.error('Error during withdrawal:', err);
        throw err;
      }
    },
    getCampaignDetails: async (campaignId: string) => {
      try {
        return await handleContractCall(getCampaignDetails, client, campaignId);
      } catch (err) {
        console.error('Error getting campaign details:', err);
        throw err;
      }
    },
    isGoalReached: async (campaignId: string) => {
      try {
        return await handleContractCall(isGoalReached, client, campaignId);
      } catch (err) {
        console.error('Error checking if goal reached:', err);
        throw err;
      }
    }
  };
}
