"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

interface Donor {
  address: string;
  totalDonated: string;
  donationCount: number;
  displayName?: string;
  profileImage?: string;
}

interface TopDonorsProps {
  limit?: number;
}

export default function TopDonors({ limit = 10 }: TopDonorsProps) {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTopDonors() {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/users?top=${limit}`);
        const data = await response.json();
        
        console.log('Top donors API response:', data);
        
        if (data.users) {
          setDonors(data.users);
        }
      } catch (error) {
        console.error('Error fetching top donors:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTopDonors();
  }, [limit]);

  // Format currency amount for display
  const formatAmount = (amount: string) => {
    const numAmount = parseFloat(amount) / 1_000_000_000; // Convert from MIST to SUI
    return `${numAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} SUI`;
  };

  // Get donor display name or shortened address
  const getDonorName = (donor: Donor) => {
    if (donor.displayName) return donor.displayName;
    
    // Shorten address for display
    const address = donor.address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Donors</CardTitle>
          <CardDescription>Loading top donors...</CardDescription>
        </CardHeader>
        <CardContent>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center space-x-4 mb-4">
              <div className="flex-shrink-0 w-8 text-center font-semibold text-gray-500">#{i}</div>
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-[150px]" />
                <Skeleton className="h-4 w-[100px]" />
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
        <CardTitle>Top Donors</CardTitle>
        <CardDescription>
          The most generous supporters on SuiGive
        </CardDescription>
      </CardHeader>
      <CardContent>
        {donors.length > 0 ? (
          <div className="space-y-4">
            {donors.map((donor, index) => (
              <div key={donor.address} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-shrink-0 w-8 text-center font-semibold text-gray-500">#{index + 1}</div>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={donor.profileImage} />
                  <AvatarFallback>{getDonorName(donor).substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:justify-between">
                    <span className="font-medium">{getDonorName(donor)}</span>
                    <span className="text-primary font-semibold">{formatAmount(donor.totalDonated)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {donor.donationCount} donation{donor.donationCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No donation data available yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
