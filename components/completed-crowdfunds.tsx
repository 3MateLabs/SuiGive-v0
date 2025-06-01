"use client"

import { ArrowRight, CheckCircle, Clock } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import AnimationWrapper from "./animation-wrapper"
import { useSuiCampaigns } from "@/hooks/useSuiCampaigns"
import { useEffect, useState } from "react"
import { Campaign } from "@/lib/sui-campaigns"
import { format } from 'date-fns';

export default function CompletedCrowdfunds() {
  const { campaigns, loading, error, refreshCampaigns } = useSuiCampaigns();
  const [completedCampaigns, setCompletedCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    // Filter campaigns to only show completed ones
    if (campaigns) {
      const completed = campaigns.filter(campaign => {
        // Assuming a campaign is completed if currentAmount >= goalAmount
        try {
          const currentAmount = BigInt(campaign.currentAmount);
          const goalAmount = BigInt(campaign.goalAmount);
          return currentAmount >= goalAmount;
        } catch (e) {
          console.error('Error parsing campaign amounts for completion check:', e);
          return false; // Exclude if amounts are invalid
        }
      });
      setCompletedCampaigns(completed);
    }
  }, [campaigns]);

  // Helper function to calculate progress percentage
  const calculateProgress = (current: string, goal: string) => {
    try {
      const currentAmount = BigInt(current);
      const goalAmount = BigInt(goal);
      
      if (goalAmount === BigInt(0)) return 0;
      
      const percentage = Number((currentAmount * BigInt(100)) / goalAmount);
      return Math.min(percentage, 100);
    } catch (error) {
      console.error('Error calculating progress:', error);
      return 0;
    }
  };

  // Helper function to format amount for display
  const formatAmount = (amount: string): string => {
    try {
      const amountBigInt = BigInt(amount);
      // Format as USD, assuming the amount is in base units and needs scaling
      // This might need adjustment based on the actual token decimals (sgUSD was mentioned as 9 decimals previously)
      // For simplicity, assuming 9 decimals based on prior context with sgUSD
      return (Number(amountBigInt) / 1_000_000_000).toFixed(2);
    } catch (error) {
      console.error('Error formatting amount:', error);
      return '0.00';
    }
  };
  
  // Helper function to format timestamp as a date
  const formatDate = (timestamp: string | number | Date) => {
    try {
       // Convert to number if it's a string timestamp from Sui
      const date = typeof timestamp === 'string' ? new Date(Number(timestamp) * 1000) : new Date(timestamp);
      return format(date, 'MMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown date';
    }
  };

  return (
    <section id="completed-crowdfunds" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-everett font-bold sui-navy-text">Completed Crowdfunds</h2>
          <Link href="#" className="flex items-center text-sm font-medium sui-navy-text">
            View all successful projects <ArrowRight className="ml-1 h-4 w-4 arrow-bounce" />
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-3 text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sui-navy mx-auto mb-4"></div>
              <p>Loading completed campaigns from the blockchain...</p>
            </div>
          ) : error ? (
            <div className="col-span-3 text-center py-12">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-lg mx-auto">
                <h3 className="text-red-600 font-bold text-lg mb-2">Network Connection Error</h3>
                <p className="text-gray-700 mb-4">We're having trouble connecting to the Sui blockchain to fetch completed campaigns.</p>
                <p className="text-gray-600 text-sm mb-4">Error details: {error}</p>
                {/* Consider adding a retry button here if needed */}
              </div>
            </div>
          ) : completedCampaigns.length > 0 ? (
            completedCampaigns.map((campaign, index) => (
              <AnimationWrapper
                key={campaign.id}
                id="completed-crowdfunds"
                className="bg-white rounded-lg overflow-hidden border shadow-sm"
                animationClass="panel-slide-in"
                delay={index * 0.2}
              >
                <div className="relative">
                  <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Funded Successfully
                  </div>
                  <div className="relative h-48 w-full">
                    <Image src={campaign.imageUrl || "/placeholder.svg"} alt={campaign.name} fill className="object-cover" priority />
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="text-xl font-everett font-bold mb-2">{campaign.name}</h3>
                  <p className="text-sm text-gray-700 mb-4 line-clamp-2 h-10">{campaign.description}</p>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-green-600">{calculateProgress(campaign.currentAmount, campaign.goalAmount)}% Funded</span>
                      <span>Goal: {formatAmount(campaign.goalAmount)} sgUSD</span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-bar-fill bg-green-500"
                        style={{ width: `${Math.min(calculateProgress(campaign.currentAmount, campaign.goalAmount), 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm text-gray-600 border-t pt-4">
                    <div>
                      <span className="font-medium">{/* Backers count not available in current Campaign type */}?</span> backers
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>Completed on {campaign.deadline ? formatDate(campaign.deadline) : 'Unknown'}</span>
                    </div>
                  </div>
                </div>
              </AnimationWrapper>
            ))
          ) : (
            <div className="col-span-3 text-center py-12 text-gray-600">
              No completed campaigns found yet.
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
