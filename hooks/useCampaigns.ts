"use client";

import { useState, useEffect } from 'react';
import { useCurrentWallet } from '@mysten/dapp-kit';
import { 
  createCampaign, 
  donate, 
  withdrawFunds, 
  getAllCampaigns, 
  getCampaignDetails,
  isGoalReached,
  Campaign
} from '../lib/campaigns-service';

export function useCampaigns() {
  const { currentWallet } = useCurrentWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  
  // Check if wallet is connected
  const connected = !!currentWallet && currentWallet.accounts && currentWallet.accounts.length > 0;

  // Load all campaigns on mount
  useEffect(() => {
    async function loadCampaigns() {
      setLoading(true);
      try {
        const allCampaigns = await getAllCampaigns();
        setCampaigns(allCampaigns);
      } catch (err: any) {
        setError(err.message || 'Failed to load campaigns');
        console.error('Error loading campaigns:', err);
      } finally {
        setLoading(false);
      }
    }

    loadCampaigns();
  }, []);

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
    loading,
    error,
    connected,
    refreshCampaigns: async () => {
      const allCampaigns = await handleContractCall<Campaign[]>(getAllCampaigns);
      setCampaigns(allCampaigns);
      return allCampaigns;
    },
    createCampaign: async (
      name: string,
      description: string,
      imageUrl: string,
      goalAmount: number,
      deadline: number,
      category: string
    ) => {
      if (!currentWallet || !connected) throw new Error('Wallet not connected');
      return handleContractCall(
        createCampaign, 
        currentWallet, 
        name, 
        description, 
        imageUrl, 
        goalAmount, 
        deadline, 
        category
      );
    },
    donate: async (
      campaignId: string,
      amount: number,
      isAnonymous: boolean = false
    ) => {
      if (!currentWallet || !connected) throw new Error('Wallet not connected');
      return handleContractCall(donate, currentWallet, campaignId, amount, isAnonymous);
    },
    withdrawFunds: async (
      campaignId: string,
      capabilityId: string
    ) => {
      if (!currentWallet || !connected) throw new Error('Wallet not connected');
      return handleContractCall(withdrawFunds, currentWallet, campaignId, capabilityId);
    },
    getCampaignDetails: async (campaignId: string) => {
      return handleContractCall(getCampaignDetails, campaignId);
    },
    isGoalReached: async (campaignId: string) => {
      return handleContractCall(isGoalReached, campaignId);
    }
  };
}
