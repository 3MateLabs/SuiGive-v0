"use client";

import React, { useEffect, useState } from 'react';
import { useCurrentWallet } from '@mysten/dapp-kit';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface Donation {
  id: string;
  amount: string;
  currency: string;
  message: string;
  isAnonymous: boolean;
  createdAt: string;
  campaign: {
    id: string;
    name: string;
    imageUrl: string;
  };
}

interface UserStats {
  address: string;
  totalDonated: string;
  donationCount: number;
  firstDonation?: string;
  lastDonation?: string;
}

export default function DonationHistory() {
  const { currentWallet } = useCurrentWallet();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDonationHistory() {
      // Check if wallet is connected and has an account
      if (!currentWallet || !currentWallet.accounts || currentWallet.accounts.length === 0) return;
      
      const walletAddress = currentWallet.accounts[0].address;
      
      setIsLoading(true);
      try {
        const response = await fetch(`/api/users?address=${walletAddress}`);
        const data = await response.json();
        
        if (data.donations) {
          setDonations(data.donations);
        }
        
        if (data.user) {
          setUserStats(data.user);
        }
      } catch (error) {
        console.error('Error fetching donation history:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDonationHistory();
  }, [currentWallet?.accounts]);

  // Format currency amount for display
  const formatAmount = (amount: string, currency: string) => {
    // sgUSD has 6 decimals, SUI has 9 decimals
    const decimals = currency === 'sgUSD' ? 1_000_000 : 1_000_000_000;
    const numAmount = parseFloat(amount) / decimals;
    // Add $ prefix for sgUSD
    const prefix = currency === 'sgUSD' ? '$' : '';
    return `${prefix}${numAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${currency}`;
  };

  if (!currentWallet || !currentWallet.accounts || currentWallet.accounts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Donation History</CardTitle>
          <CardDescription>Connect your wallet to view your donation history</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Donation History</CardTitle>
          <CardDescription>Loading your donation history...</CardDescription>
        </CardHeader>
        <CardContent>
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center space-x-4 mb-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Your Donation History</CardTitle>
        <CardDescription>
          {userStats ? (
            <>
              You've made {userStats.donationCount} donation{userStats.donationCount !== 1 ? 's' : ''} 
              totaling {formatAmount(userStats.totalDonated, 'sgUSD')}
            </>
          ) : (
            "You haven't made any donations yet"
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {donations.length > 0 ? (
          <div className="space-y-4">
            {donations.map((donation) => (
              <div key={donation.id} className="flex items-start space-x-4 p-4 rounded-lg border">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={donation.campaign.imageUrl} alt={donation.campaign.name} />
                  <AvatarFallback>{donation.campaign.name.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <Link href={`/campaigns/${donation.campaign.id}`} className="font-medium hover:underline">
                      {donation.campaign.name}
                    </Link>
                    <Badge variant="outline">{formatAmount(donation.amount, donation.currency)}</Badge>
                  </div>
                  {donation.message && (
                    <p className="text-sm mt-1 text-gray-500 italic">"{donation.message}"</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    {formatDistanceToNow(new Date(donation.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>You haven't made any donations yet.</p>
            <p className="mt-2">
              <Link href="/campaigns" className="text-primary hover:underline">
                Explore campaigns
              </Link>
              {" "}to find causes you'd like to support.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
