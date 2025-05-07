"use client";

import { useState, useEffect } from 'react';
import { useCurrentWallet } from '@mysten/dapp-kit';
import { useSuiClient } from '@mysten/dapp-kit';
import { 
  createCampaign, 
  donate, 
  withdrawFunds, 
  getAllCampaigns, 
  getCampaignDetails,
  isGoalReached,
  Campaign
} from '../lib/sui-campaigns';
import { MOCK_CAMPAIGNS, getMockCampaignById } from '../lib/mock-campaigns';

// Flag to use mock data (set to true for development or when blockchain connection fails)
const USE_MOCK_DATA = process.env.NODE_ENV === 'development';

export function useSuiCampaigns() {
  const currentWallet = useCurrentWallet();
  const client = useSuiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  // Load all campaigns with retry logic and fallback to mock data
  const fetchCampaigns = async () => {
    setLoading(true);
    setError(null);
    
    // If we're explicitly using mock data, return it immediately
    if (USE_MOCK_DATA) {
      console.log('Using mock campaign data for development');
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
      setCampaigns(MOCK_CAMPAIGNS);
      setLoading(false);
      return MOCK_CAMPAIGNS;
    }
    
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
        
        const allCampaigns = await getAllCampaigns(client);
        setCampaigns(allCampaigns);
        setLoading(false);
        return allCampaigns;
      } catch (err: any) {
        console.error(`Error loading campaigns (attempt ${attempt + 1}/${maxRetries}):`, err);
        
        // If we've tried the maximum number of times, fallback to mock data
        if (attempt === maxRetries - 1) {
          console.warn('Falling back to mock campaign data due to network issues');
          setCampaigns(MOCK_CAMPAIGNS);
          setLoading(false);
          return MOCK_CAMPAIGNS;
        }
        
        // Otherwise wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
    
    // This should never be reached, but just in case
    console.warn('Falling back to mock campaign data (unexpected path)');
    setCampaigns(MOCK_CAMPAIGNS);
    setLoading(false);
    return MOCK_CAMPAIGNS;
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
    loading,
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
      if (!currentWallet) throw new Error('Wallet not connected');
      
      if (USE_MOCK_DATA) {
        console.log(`Using mock campaign creation for development: ${name}`);
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        // Return a mock transaction result
        return {
          digest: `mock_tx_${Date.now()}`,
          status: 'success',
          effects: { status: { status: 'success' } },
          // Mock the new campaign object ID
          objectChanges: [{
            type: 'created',
            objectId: `0x${Math.random().toString(16).substring(2, 42)}`
          }]
        };
      }
      
      try {
        return await handleContractCall(
          createCampaign, 
          currentWallet, 
          name, 
          description, 
          imageUrl, 
          goalAmount, 
          deadline, 
          category
        );
      } catch (err) {
        console.error('Error during campaign creation:', err);
        throw err; // We don't fall back to mock for transactions that modify state
      }
    },
    donate: async (
      campaignId: string,
      amount: number,
      isAnonymous: boolean = false
    ) => {
      if (!currentWallet) throw new Error('Wallet not connected');
      
      if (USE_MOCK_DATA) {
        console.log(`Using mock donation for development: ${amount} to campaign ${campaignId}`);
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Return a mock transaction result
        return {
          digest: `mock_tx_${Date.now()}`,
          status: 'success',
          effects: { status: { status: 'success' } }
        };
      }
      
      try {
        return await handleContractCall(donate, currentWallet, campaignId, amount, isAnonymous);
      } catch (err) {
        console.error('Error during donation:', err);
        throw err; // We don't fall back to mock for transactions that modify state
      }
    },
    withdrawFunds: async (
      campaignId: string,
      capabilityId: string
    ) => {
      if (!currentWallet) throw new Error('Wallet not connected');
      return handleContractCall(withdrawFunds, currentWallet, campaignId, capabilityId);
    },
    getCampaignDetails: async (campaignId: string) => {
      if (USE_MOCK_DATA) {
        console.log('Using mock campaign details for development');
        await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
        return getMockCampaignById(campaignId);
      }
      try {
        return await handleContractCall(getCampaignDetails, client, campaignId);
      } catch (err) {
        console.warn('Falling back to mock campaign details due to network issues');
        return getMockCampaignById(campaignId);
      }
    },
    isGoalReached: async (campaignId: string) => {
      if (USE_MOCK_DATA) {
        console.log('Using mock goal check for development');
        await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
        const campaign = getMockCampaignById(campaignId);
        if (!campaign) return false;
        return BigInt(campaign.currentAmount) >= BigInt(campaign.goalAmount);
      }
      try {
        return await handleContractCall(isGoalReached, client, campaignId);
      } catch (err) {
        console.warn('Falling back to mock goal check due to network issues');
        const campaign = getMockCampaignById(campaignId);
        if (!campaign) return false;
        return BigInt(campaign.currentAmount) >= BigInt(campaign.goalAmount);
      }
    }
  };
}
