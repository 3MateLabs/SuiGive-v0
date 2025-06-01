"use client";

import { useState, useEffect, useRef } from 'react';
import { useSuiClient } from '@mysten/dapp-kit';
import { getCampaignDetails } from '@/lib/sui-campaigns';

// Key for local storage
const CAMPAIGN_PROGRESS_KEY = 'suigives-campaign-progress';

// Interface for campaign progress data
interface CampaignProgress {
  campaignId: string;
  currentAmount: string; // BigInt as string
  lastUpdated: number; // timestamp
  pendingDonations: {
    amount: string; // BigInt as string
    timestamp: number;
  }[];
}

/**
 * Custom hook to manage campaign progress with local persistence
 * This ensures the progress bar doesn't reset on page refresh
 */
export function useCampaignProgress(campaignId: string) {
  const client = useSuiClient();
  const [loading, setLoading] = useState(false);
  const [currentAmount, setCurrentAmount] = useState('0');
  const [goalAmount, setGoalAmount] = useState('0');
  const [progress, setProgress] = useState(0);
  const [lastBlockchainUpdate, setLastBlockchainUpdate] = useState(0);

  // Load initial data from local storage and blockchain
  useEffect(() => {
    if (!campaignId) return;
    
    // Load progress data
    loadProgressData();
    
    // Set up polling for blockchain data
    const intervalId = setInterval(() => {
      fetchBlockchainData();
    }, 15000); // Poll every 15 seconds
    
    return () => clearInterval(intervalId);
  }, [campaignId]);

  // Load progress data from local storage and blockchain
  const loadProgressData = async () => {
    setLoading(true);
    
    try {
      // Try to get data from local storage first for immediate display
      const localData = getLocalProgressData();
      
      if (localData) {
        // Use local data for immediate display
        setCurrentAmount(localData.currentAmount);
        updateProgressPercentage(localData.currentAmount, goalAmount);
        console.log('Loaded progress from local storage:', localData);
      }
      
      // Then fetch the latest from blockchain
      await fetchBlockchainData();
    } catch (error) {
      console.error('Error loading campaign progress:', error);
    } finally {
      setLoading(false);
    }
  };

  // Use useRef instead of useState to track fetch state
  // This prevents re-renders when the fetch state changes
  const isFetchingRef = useRef(false);
  
  // Debounce function to prevent multiple rapid calls
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Fetch the latest data from blockchain with debouncing
  const fetchBlockchainData = async () => {
    // Clear any existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // Set a new timeout to debounce the fetch
    debounceTimeoutRef.current = setTimeout(async () => {
      // Prevent multiple simultaneous fetches
      if (isFetchingRef.current || !client || !campaignId) return;
      
      try {
        isFetchingRef.current = true;
        const campaign = await getCampaignDetails(client, campaignId);
        
        if (campaign) {
          // Batch state updates to prevent cascading renders
          const updates = () => {
            setCurrentAmount(campaign.currentAmount);
            setGoalAmount(campaign.goalAmount);
            updateProgressPercentage(campaign.currentAmount, campaign.goalAmount);
            setLastBlockchainUpdate(Date.now());
          };
          
          // Execute all updates together
          updates();
          
          // Save to local storage
          saveLocalProgressData({
            campaignId,
            currentAmount: campaign.currentAmount,
            lastUpdated: Date.now(),
            pendingDonations: []
          });
          
          console.log('Updated campaign data from blockchain:', campaign);
        }
      } catch (error) {
        console.error('Error fetching blockchain data:', error);
      } finally {
        isFetchingRef.current = false;
      }
    }, 200); // 200ms debounce delay
  };

  // Add a donation to the progress (optimistic update)
  const addDonation = (amountInUnits: string) => {
    try {
      // Get current data
      const localData = getLocalProgressData() || {
        campaignId,
        currentAmount: currentAmount || '0',
        lastUpdated: Date.now(),
        pendingDonations: []
      };
      
      // Add the donation to pending donations
      localData.pendingDonations.push({
        amount: amountInUnits,
        timestamp: Date.now()
      });
      
      // Calculate new total including pending donations
      const newTotal = calculateTotalWithPending(localData);
      
      // Update local state - use a single update to prevent cascading renders
      const updatedGoal = goalAmount;
      setCurrentAmount(newTotal);
      updateProgressPercentage(newTotal, updatedGoal);
      
      // Save to local storage
      saveLocalProgressData(localData);
      
      console.log('Added donation (optimistic update):', {
        donation: amountInUnits,
        newTotal
      });
      
      // Trigger blockchain refresh after a delay - use a longer delay
      // to prevent multiple rapid updates
      const refreshTimeoutId = setTimeout(() => {
        if (!isFetchingRef.current) {
          fetchBlockchainData();
        }
      }, 8000); // Increased to 8 seconds to give more time between updates
      
      // Clean up timeout if component unmounts
      return newTotal;
    } catch (error) {
      console.error('Error adding donation:', error);
      return currentAmount;
    }
  };

  // Calculate total amount including pending donations
  const calculateTotalWithPending = (data: CampaignProgress): string => {
    try {
      let total = BigInt(data.currentAmount);
      
      // Add all pending donations
      for (const donation of data.pendingDonations) {
        total += BigInt(donation.amount);
      }
      
      return total.toString();
    } catch (error) {
      console.error('Error calculating total with pending:', error);
      return data.currentAmount;
    }
  };

  // Update progress percentage
  const updateProgressPercentage = (current: string, goal: string) => {
    try {
      if (!goal || BigInt(goal) === BigInt(0)) {
        setProgress(0);
        return;
      }
      
      const currentBigInt = BigInt(current);
      const goalBigInt = BigInt(goal);
      
      // Calculate percentage (0-100)
      const percentage = Number((currentBigInt * BigInt(100)) / goalBigInt);
      setProgress(Math.min(percentage, 100));
    } catch (error) {
      console.error('Error calculating progress percentage:', error);
      setProgress(0);
    }
  };

  // Get progress data from local storage
  const getLocalProgressData = (): CampaignProgress | null => {
    try {
      if (typeof window === 'undefined') return null;
      
      const storedData = localStorage.getItem(CAMPAIGN_PROGRESS_KEY);
      if (!storedData) return null;
      
      const allCampaigns = JSON.parse(storedData) as Record<string, CampaignProgress>;
      return allCampaigns[campaignId] || null;
    } catch (error) {
      console.error('Error getting local progress data:', error);
      return null;
    }
  };

  // Save progress data to local storage
  const saveLocalProgressData = (data: CampaignProgress) => {
    try {
      if (typeof window === 'undefined') return;
      
      // Get existing data for all campaigns
      const storedData = localStorage.getItem(CAMPAIGN_PROGRESS_KEY);
      const allCampaigns = storedData ? JSON.parse(storedData) : {};
      
      // Update data for this campaign
      allCampaigns[campaignId] = data;
      
      // Save back to local storage
      localStorage.setItem(CAMPAIGN_PROGRESS_KEY, JSON.stringify(allCampaigns));
    } catch (error) {
      console.error('Error saving local progress data:', error);
    }
  };

  // Format amount for display (convert from smallest units to sgUSD)
  const formatAmount = (amount?: string): string => {
    try {
      if (!amount) return '0.00';
      const amountBigInt = BigInt(amount);
      return (Number(amountBigInt) / 1_000_000_000).toFixed(2);
    } catch (error) {
      console.error('Error formatting amount:', error);
      return '0.00';
    }
  };

  return {
    loading,
    currentAmount,
    goalAmount,
    progress,
    currentAmountFormatted: formatAmount(currentAmount),
    goalAmountFormatted: formatAmount(goalAmount),
    addDonation,
    refreshData: fetchBlockchainData,
    lastBlockchainUpdate
  };
}
