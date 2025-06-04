"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from 'date-fns';

interface Donor {
  address: string;
  displayName?: string;
  profileImage?: string;
}

interface Donation {
  id: string;
  donorAddress: string;
  amount: string;
  currency: string;
  message: string;
  isAnonymous: boolean;
  createdAt: string;
  donor?: Donor;
}

interface CampaignDonationsProps {
  campaignId: string;
}

export default function CampaignDonations({ campaignId }: CampaignDonationsProps) {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalDonors, setTotalDonors] = useState(0);

  useEffect(() => {
    async function fetchCampaignDonations() {
      if (!campaignId) return;
      
      setIsLoading(true);
      try {
        const response = await fetch(`/api/donations?campaignId=${campaignId}`);
        const data = await response.json();
        
        if (data.donations) {
          setDonations(data.donations);
          
          // Count unique donors (excluding anonymous)
          const uniqueDonors = new Set();
          data.donations.forEach((donation: Donation) => {
            if (!donation.isAnonymous) {
              uniqueDonors.add(donation.donorAddress);
            }
          });
          setTotalDonors(uniqueDonors.size);
        }
      } catch (error) {
        console.error('Error fetching campaign donations:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCampaignDonations();
  }, [campaignId]);

  // Format currency amount for display
  const formatAmount = (amount: string, currency: string) => {
    const numAmount = parseFloat(amount) / 1_000_000_000; // Convert from MIST to SUI
    return `${numAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${currency}`;
  };

  // Get donor display name or shortened address
  const getDonorName = (donation: Donation) => {
    if (donation.isAnonymous) return 'Anonymous';
    if (donation.donor?.displayName) return donation.donor.displayName;
    
    // Shorten address for display
    const address = donation.donorAddress;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Get donor avatar
  const getDonorAvatar = (donation: Donation) => {
    if (donation.isAnonymous) return undefined;
    return donation.donor?.profileImage || undefined;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Donations</CardTitle>
          <CardDescription>Loading donation history...</CardDescription>
        </CardHeader>
        <CardContent>
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center space-x-4 mb-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[150px]" />
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
        <CardTitle>Recent Donations</CardTitle>
        <CardDescription>
          {donations.length > 0 
            ? `${donations.length} donation${donations.length !== 1 ? 's' : ''} from ${totalDonors} donor${totalDonors !== 1 ? 's' : ''}`
            : "No donations yet. Be the first to donate!"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {donations.length > 0 ? (
          <div className="space-y-4">
            {donations.map((donation) => (
              <div key={donation.id} className="flex items-start space-x-4 p-3 rounded-lg border">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={getDonorAvatar(donation)} />
                  <AvatarFallback>{getDonorName(donation).substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <span className="font-medium">{getDonorName(donation)}</span>
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
            <p>This campaign hasn't received any donations yet.</p>
            <p className="mt-2">Be the first to support this cause!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
