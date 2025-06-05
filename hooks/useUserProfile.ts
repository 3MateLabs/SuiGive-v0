"use client";

/**
 * User Profile Hook
 * 
 * React hook for managing user profiles in the SuiGive platform.
 * Integrates with the wallet connection and provides profile data and management functions.
 */

import { useState, useEffect, useCallback } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';

// Define types for user profile data
export interface UserProfile {
  address: string;
  displayName?: string;
  profileImage?: string;
  bio?: string;
  email?: string;
  website?: string;
  twitter?: string;
  discord?: string;
  totalDonated?: string;
  donationCount?: number;
  firstDonation?: string | Date;
  lastDonation?: string | Date;
  createdCampaigns?: Array<{
    id: string;
    name: string;
    imageUrl?: string;
    currentAmount: string;
    goalAmount: string;
    backerCount: number;
    category?: string;
  }>;
  badges?: string[];
  isPrivate?: boolean;
  showEmail?: boolean;
  showSocial?: boolean;
}

export interface ProfileUpdateData {
  displayName?: string;
  profileImage?: string;
  bio?: string;
  email?: string;
  website?: string;
  twitter?: string;
  discord?: string;
  isPrivate?: boolean;
  showEmail?: boolean;
  showSocial?: boolean;
}

export function useUserProfile() {
  const currentAccount = useCurrentAccount();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user profile data
  const fetchProfile = useCallback(async (address?: string): Promise<UserProfile | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Use the connected wallet address if none provided
      const targetAddress = address || currentAccount?.address;
      
      if (!targetAddress) {
        setError('No wallet address available');
        setIsLoading(false);
        return null;
      }
      
      const response = await fetch(`/api/user/profile?address=${targetAddress}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch profile');
      }
      
      const profileData = await response.json() as UserProfile;
      setProfile(profileData);
      return profileData;
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentAccount]);

  // Update user profile data
  const updateProfile = useCallback(async (profileData: ProfileUpdateData): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!currentAccount?.address) {
        setError('No wallet connected');
        setIsLoading(false);
        return false;
      }
      
      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: currentAccount.address,
          ...profileData
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }
      
      const result = await response.json();
      setProfile(result.user as UserProfile);
      return true;
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentAccount]);

  // Load profile when wallet connects
  useEffect(() => {
    if (currentAccount?.address) {
      fetchProfile();
    } else {
      setProfile(null);
    }
  }, [currentAccount, fetchProfile]);

  return {
    profile,
    isLoading,
    error,
    fetchProfile,
    updateProfile,
    isConnected: !!currentAccount,
    walletAddress: currentAccount?.address
  };
}

export default useUserProfile;
