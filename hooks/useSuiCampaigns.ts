"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useCurrentWallet } from '@mysten/dapp-kit';
import { useSuiClient } from '@mysten/dapp-kit';
import { 
  getAllCampaigns, 
  getCampaignDetails,
  isGoalReached,
  Campaign
} from '../lib/sui-campaigns';
import { useTransactionExecution } from './useTransactionExecution';
import { useGlobalCampaigns, useStore } from '../lib/store';

// No mock implementations - using real blockchain calls only

export function useSuiCampaigns() {
  const currentWallet = useCurrentWallet();
  const client = useSuiClient();
  
  // Use our global state store instead of local state
  const { 
    campaigns, 
    isLoading: loading, 
    error, 
    setCampaigns, 
    setLoading, 
    setError,
    shouldRefetch,
    invalidateCache
  } = useGlobalCampaigns();
  
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
    // Check global state cache first if not forcing refresh
    if (!forceRefresh && !shouldRefetch()) {
      // Use cached data if it's still valid according to our cache policy
      console.log('Using cached campaign data from global store');
      return campaigns;
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
          // Update global state with the fetched campaigns
          setCampaigns(allCampaigns);
          
          setLoading(false);
          console.log(`Successfully fetched ${allCampaigns.length} campaigns`);
          return allCampaigns;
        } else {
          // Handle empty or invalid response
          console.warn('No campaigns found or invalid response format');
          setCampaigns([]);
          setLoading(false);
          return [];
        }
      } catch (error: any) {
        console.error(`Error fetching campaigns (attempt ${attempt + 1}):`, error.message || error);
        
        // If this is the last attempt, update the error state
        if (attempt === maxRetries - 1) {
          setError(error.message || 'Failed to fetch campaigns');
          setLoading(false);
          return [];
        }
        
        // Otherwise wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
      }
    }
    
    // This should never be reached due to the return in the last iteration of the loop
    // but TypeScript needs it for type safety
    return [];
  };

  // Use refs to track loading state to prevent unnecessary re-renders
  const loadingRef = useRef(false);
  
  // Track in-flight requests to prevent duplicate requests
  const pendingRequests = useRef<Record<string, Promise<any>>>({});
  
  const handleContractCall = async <T,>(fn: Function, ...args: any[]): Promise<T> => {
    // Update both ref and state for loading
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const result = await fn(...args);
      loadingRef.current = false;
      setLoading(false);
      return result as T;
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      loadingRef.current = false;
      setLoading(false);
      throw err;
    }
  };

  // Create a new campaign
  const createCampaign = async (name: string, description: string, imageUrl: string, goalAmount: number, deadline: number, category: string) => {
    const result = await handleContractCall<any>(
      executeCreateCampaign,
      name,
      description,
      imageUrl,
      goalAmount,
      deadline,
      category
    );
    
    // Force refresh after campaign creation
    if (result) {
      invalidateCache();
      // Also set the global force refresh flag
      useStore.getState().setForceRefresh(true);
    }
    
    return result;
  };

  // Handle donation with SUI tokens
  const donate = async (campaignId: string, amount: number, message: string = '', isAnonymous: boolean = false) => {
    const result = await handleContractCall<any>(
      executeDonate,
      campaignId,
      amount,
      message,
      isAnonymous
    );
    
    // Force refresh after donation
    if (result) {
      invalidateCache();
      // Also set the global force refresh flag
      useStore.getState().setForceRefresh(true);
    }
    
    return result;
  };

  // Handle donation with sgUSD tokens
  const donateSgUSD = async (campaignId: string, coinObjectId: string, amount: number, message: string = '', isAnonymous: boolean = false) => {
    const result = await handleContractCall<any>(
      executeDonateSgUSD,
      campaignId,
      coinObjectId,
      amount,
      message,
      isAnonymous
    );
    
    // Force refresh after donation
    if (result) {
      invalidateCache();
      // Also set the global force refresh flag
      useStore.getState().setForceRefresh(true);
    }
    
    return result;
  };

  return {
    campaigns,
    loading: loading || isTransactionPending,
    error,
    connected: !!currentWallet,
    wallet: currentWallet,
    refreshCampaigns: fetchCampaigns,
    createCampaign,
    donate,
    donateSgUSD,
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
    // Memoize getCampaignDetails to prevent recreation on each render
    getCampaignDetails: useCallback(async (campaignId: string) => {
      // Create a request key for deduplication
      const requestKey = `campaign-${campaignId}`;
      
      // If there's already a request in flight for this campaign, return that promise
      // This prevents duplicate requests for the same campaign
      if (requestKey in pendingRequests.current) {
        console.log(`Reusing existing request for campaign ${campaignId}`);
        return pendingRequests.current[requestKey];
      }
      
      console.log(`Creating new request for campaign ${campaignId}`);
      
      try {
        // Create a new promise for this request and store it
        const promise = handleContractCall(getCampaignDetails, client, campaignId);
        pendingRequests.current[requestKey] = promise;
        
        // Wait for the result
        const result = await promise;
        
        // Clean up after request completes
        setTimeout(() => {
          delete pendingRequests.current[requestKey];
        }, 100);
        
        return result;
      } catch (err) {
        console.error(`Error getting campaign details for ${campaignId}:`, err);
        // Clean up failed request
        delete pendingRequests.current[requestKey];
        throw err;
      }
    }, [client]),
    isGoalReached: useCallback(async (campaignId: string) => {
      // Create a request key for deduplication
      const requestKey = `goal-${campaignId}`;
      
      // If there's already a request in flight for this campaign, return that promise
      if (requestKey in pendingRequests.current) {
        console.log(`Reusing existing goal check request for campaign ${campaignId}`);
        return pendingRequests.current[requestKey];
      }
      
      try {
        // Create a new promise for this request and store it
        const promise = handleContractCall(isGoalReached, client, campaignId);
        pendingRequests.current[requestKey] = promise;
        
        // Wait for the result
        const result = await promise;
        
        // Clean up after request completes
        setTimeout(() => {
          delete pendingRequests.current[requestKey];
        }, 100);
        
        return result;
      } catch (err) {
        console.error(`Error checking if goal reached for ${campaignId}:`, err);
        // Clean up failed request
        delete pendingRequests.current[requestKey];
        throw err;
      }
    }, [client]),
  };
}
