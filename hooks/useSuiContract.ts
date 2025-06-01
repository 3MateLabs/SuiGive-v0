import { useState } from 'react';
import { useCurrentWallet } from '@mysten/dapp-kit';
import { 
  createCampaign, 
  donate, 
  withdrawFunds, 
  getAllCampaigns, 
  getCampaignDetails,
  isGoalReached
} from '../lib/sui-contract';

export function useSuiContract() {
  const { currentWallet } = useCurrentWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContractCall = async (fn: Function, ...args: any[]) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fn(...args);
      setLoading(false);
      return result;
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setLoading(false);
      throw err;
    }
  };

  return {
    loading,
    error,
    createCampaign: async (
      name: string,
      description: string,
      imageUrl: string,
      goalAmount: number,
      deadline: number,
      category: string
    ) => {
      if (!currentWallet) throw new Error('Wallet not connected');
      return handleContractCall(createCampaign, currentWallet, name, description, imageUrl, goalAmount, deadline, category);
    },
    donate: async (
      campaignId: string,
      amount: number,
      isAnonymous: boolean = false
    ) => {
      if (!currentWallet) throw new Error('Wallet not connected');
      return handleContractCall(donate, currentWallet, campaignId, amount, isAnonymous);
    },
    withdrawFunds: async (
      campaignId: string,
      capabilityId: string
    ) => {
      if (!currentWallet) throw new Error('Wallet not connected');
      return handleContractCall(withdrawFunds, currentWallet, campaignId, capabilityId);
    },
    getAllCampaigns: async () => {
      return handleContractCall(getAllCampaigns);
    },
    getCampaignDetails: async (campaignId: string) => {
      return handleContractCall(getCampaignDetails, campaignId);
    },
    isGoalReached: async (campaignId: string) => {
      return handleContractCall(isGoalReached, campaignId);
    }
  };
}
