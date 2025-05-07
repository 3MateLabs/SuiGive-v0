"use client"

import { ArrowRight, Clock, DollarSign } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import AnimationWrapper from "./animation-wrapper"
import { useSuiCampaigns } from "@/hooks/useSuiCampaigns"
import { useEffect, useState } from "react"
import { Campaign } from "@/lib/sui-campaigns"
import { formatDistanceToNow } from "date-fns"

export default function NewestEvents() {
  const { campaigns, loading, error, refreshCampaigns } = useSuiCampaigns();
  const [displayCampaigns, setDisplayCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    // Fetch campaigns when component mounts with retry logic
    const fetchWithRetry = async () => {
      try {
        await refreshCampaigns();
      } catch (err) {
        console.error('Error fetching campaigns in component:', err);
        // Retry after 3 seconds if there was an error
        setTimeout(() => {
          refreshCampaigns().catch(e => console.error('Retry failed:', e));
        }, 3000);
      }
    };
    
    fetchWithRetry();
  }, [refreshCampaigns]);

  useEffect(() => {
    if (campaigns && campaigns.length > 0) {
      // Sort campaigns by creation date (newest first) and take the first 3
      const sorted = [...campaigns].sort((a, b) => {
        return Number(b.createdAt) - Number(a.createdAt);
      }).slice(0, 3);
      
      setDisplayCampaigns(sorted);
    }
  }, [campaigns]);
  
  // Calculate progress percentage based on current amount and goal amount
  const calculateProgress = (current: string, goal: string) => {
    try {
      const currentAmount = BigInt(current);
      const goalAmount = BigInt(goal);
      
      if (goalAmount === BigInt(0)) return 0;
      
      // Calculate percentage and convert to number (limited to 100%)
      const percentage = Number((currentAmount * BigInt(100)) / goalAmount);
      return Math.min(percentage, 100);
    } catch (error) {
      console.error('Error calculating progress:', error);
      return 0;
    }
  };
  
  // Format the timestamp to "X days ago"
  const formatTimeAgo = (timestamp: string) => {
    try {
      const date = new Date(Number(timestamp) * 1000);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return 'Recently';
    }
  };
  
  // Use placeholder data if no campaigns are loaded yet
  const events = displayCampaigns.length > 0 ? displayCampaigns : [
    {
      id: '1',
      name: "Loading campaigns...",
      description: "Please connect your wallet to view campaigns from the blockchain.",
      imageUrl: "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=600&q=80",
      createdAt: Date.now().toString(),
      goalAmount: "100",
      currentAmount: "0",
      deadline: (Date.now() + 30 * 24 * 60 * 60 * 1000).toString(),
      category: "Loading",
      creator: ""
    },
  ]

  return (
    <section id="newest-events" className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <AnimationWrapper animationClass="fade-right">
            <h2 className="text-3xl font-everett font-bold sui-navy-text">Newest Crowdfunding Events</h2>
          </AnimationWrapper>
          <AnimationWrapper animationClass="fade-left">
            <Link
              href="#"
              className="flex items-center text-sm font-medium sui-navy-text hover:text-sui-navy/70 transition-colors"
            >
              See all <ArrowRight className="ml-1 h-4 w-4 arrow-bounce" />
            </Link>
          </AnimationWrapper>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            <div className="col-span-3 text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sui-navy mx-auto mb-4"></div>
              <p>Loading campaigns from the blockchain...</p>
            </div>
          ) : error ? (
            <div className="col-span-3 text-center py-12">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-lg mx-auto">
                <h3 className="text-red-600 font-bold text-lg mb-2">Network Connection Error</h3>
                <p className="text-gray-700 mb-4">We're having trouble connecting to the Sui blockchain. This could be due to network issues or high traffic.</p>
                <p className="text-gray-600 text-sm mb-4">Error details: {error}</p>
                <Button 
                  onClick={() => refreshCampaigns()} 
                  className="bg-sui-navy text-white hover:bg-sui-navy/90"
                >
                  Try Again
                </Button>
              </div>
            </div>
          ) : events.map((campaign, index) => (
            <AnimationWrapper
              key={campaign.id}
              id="newest-events"
              className="bg-white rounded-lg overflow-hidden border shadow-sm hover:shadow-md transition-shadow duration-300"
              animationClass="fade-up"
              delay={index * 0.2}
            >
              <div className="p-6">
                <h3 className="text-xl font-everett font-bold mb-2">{campaign.name}</h3>
                <p className="text-sm text-gray-500 font-light mb-4">{campaign.description}</p>
              </div>

              <div className="relative h-48 w-full">
                <Image 
                  src={campaign.imageUrl || "/placeholder.svg"} 
                  alt={campaign.name} 
                  fill 
                  className="object-cover" 
                />
              </div>

              <div className="p-6">
                <div className="mb-4">
                  {/* Calculate progress based on current and goal amounts */}
                  {(() => {
                    const progress = calculateProgress(campaign.currentAmount, campaign.goalAmount);
                    return (
                      <>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">{progress}% Funded</span>
                          <span>Goal: {Number(campaign.goalAmount) / 1_000_000_000} SUI</span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                <div className="flex justify-between items-center mt-4">
                  <Link href={`/donate/${campaign.id}`} className="page-transition">
                    <Button className="bg-sui-navy text-white hover:bg-sui-navy/90 rounded-md flex items-center transition-transform hover:scale-105">
                      <DollarSign className="mr-1 h-4 w-4" />
                      Donate Now
                    </Button>
                  </Link>

                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{formatTimeAgo(campaign.createdAt)}</span>
                  </div>
                </div>
              </div>
            </AnimationWrapper>
          ))}
        </div>
      </div>
    </section>
  )
}
