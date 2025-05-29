"use client";

import { create } from 'zustand';
import { Campaign } from './sui-campaigns';
import { SuiClient } from '@mysten/sui/client';

// Define the store state interface
interface StoreState {
  // Campaigns state
  campaigns: Campaign[];
  campaignsLoading: boolean;
  campaignsError: string | null;
  campaignsLastFetched: number;
  setCampaigns: (campaigns: Campaign[]) => void;
  setCampaignsLoading: (loading: boolean) => void;
  setCampaignsError: (error: string | null) => void;
  
  // SgUSD state
  sgUSDBalance: string;
  sgUSDBalanceValue: bigint;
  sgUSDCoins: Array<{id: string, balance: string, balanceValue: bigint}>;
  sgUSDLastFetched: number;
  setSgUSDBalance: (balance: string) => void;
  setSgUSDBalanceValue: (value: bigint) => void;
  setSgUSDCoins: (coins: Array<{id: string, balance: string, balanceValue: bigint}>) => void;
  
  // Force refresh flag
  forceRefresh: boolean;
  setForceRefresh: (value: boolean) => void;
  
  // Cache control
  invalidateCampaigns: () => void;
  invalidateSgUSDBalance: () => void;
  shouldRefetchCampaigns: (forceRefresh?: boolean) => boolean;
  shouldRefetchSgUSDBalance: (forceRefresh?: boolean) => boolean;
}

// Create the store with Zustand
export const useStore = create<StoreState>((set, get) => ({
  // Campaigns state
  campaigns: [],
  campaignsLoading: false,
  campaignsError: null,
  campaignsLastFetched: 0,
  setCampaigns: (campaigns) => set({ campaigns, campaignsLastFetched: Date.now() }),
  setCampaignsLoading: (loading) => set({ campaignsLoading: loading }),
  setCampaignsError: (error) => set({ campaignsError: error }),
  
  // SgUSD state
  sgUSDBalance: '0',
  sgUSDBalanceValue: BigInt(0),
  sgUSDCoins: [],
  sgUSDLastFetched: 0,
  setSgUSDBalance: (balance) => set({ sgUSDBalance: balance }),
  setSgUSDBalanceValue: (value) => set({ sgUSDBalanceValue: value }),
  setSgUSDCoins: (coins) => set({ sgUSDCoins: coins, sgUSDLastFetched: Date.now() }),
  
  // Force refresh flag - only refresh when this is true (after transactions)
  forceRefresh: false,
  setForceRefresh: (value) => set({ forceRefresh: value }),
  
  // Cache control functions
  invalidateCampaigns: () => set({ campaignsLastFetched: 0, forceRefresh: true }),
  invalidateSgUSDBalance: () => set({ sgUSDLastFetched: 0, forceRefresh: true }),
  
  // Refresh when forceRefresh is true, on initial load, or if cache is expired
  shouldRefetchCampaigns: (forceRefresh = false) => {
    // If explicitly forcing refresh, always return true
    if (forceRefresh) return true;
    
    // Otherwise check the global forceRefresh flag and initial load state
    const globalForceRefresh = get().forceRefresh;
    const isInitialLoad = get().campaignsLastFetched === 0;
    
    // Add cache expiration check (5 minutes)
    const cacheExpired = Date.now() - get().campaignsLastFetched > 5 * 60 * 1000;
    
    // If we're forcing refresh, reset the flag for next time
    if (globalForceRefresh) {
      set({ forceRefresh: false });
    }
    
    // Allow refresh on initial load, when forced, or when cache expires
    return isInitialLoad || globalForceRefresh || cacheExpired;
  },
  
  // Refresh when forceRefresh is true, on initial load, or if cache is expired
  shouldRefetchSgUSDBalance: (forceRefresh = false) => {
    // If explicitly forcing refresh, always return true
    if (forceRefresh) return true;
    
    // Otherwise check the global forceRefresh flag and initial load state
    const globalForceRefresh = get().forceRefresh;
    const isInitialLoad = get().sgUSDLastFetched === 0;
    
    // Add cache expiration check (30 seconds)
    const cacheExpired = Date.now() - get().sgUSDLastFetched > 30 * 1000;
    
    // If we're forcing refresh, reset the flag for next time
    if (globalForceRefresh) {
      set({ forceRefresh: false });
    }
    
    // Allow refresh on initial load, when forced, or when cache expires
    return isInitialLoad || globalForceRefresh || cacheExpired;
  }
}));

// Create a hook for campaigns that uses the store
export function useGlobalCampaigns() {
  const { 
    campaigns, 
    campaignsLoading, 
    campaignsError, 
    setCampaigns, 
    setCampaignsLoading, 
    setCampaignsError,
    shouldRefetchCampaigns,
    invalidateCampaigns
  } = useStore();
  
  return {
    campaigns,
    isLoading: campaignsLoading,
    error: campaignsError,
    setCampaigns,
    setLoading: setCampaignsLoading,
    setError: setCampaignsError,
    shouldRefetch: shouldRefetchCampaigns,
    invalidateCache: invalidateCampaigns
  };
}

// Create a hook for SgUSD balance that uses the store
export function useGlobalSgUSDBalance() {
  const {
    sgUSDBalance,
    sgUSDBalanceValue,
    sgUSDCoins,
    setSgUSDBalance,
    setSgUSDBalanceValue,
    setSgUSDCoins,
    shouldRefetchSgUSDBalance,
    invalidateSgUSDBalance
  } = useStore();
  
  return {
    balance: sgUSDBalance,
    balanceValue: sgUSDBalanceValue,
    coins: sgUSDCoins,
    setBalance: setSgUSDBalance,
    setBalanceValue: setSgUSDBalanceValue,
    setCoins: setSgUSDCoins,
    shouldRefetch: shouldRefetchSgUSDBalance,
    invalidateCache: invalidateSgUSDBalance
  };
}
