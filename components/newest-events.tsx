"use client"

import { ArrowRight, Clock, DollarSign, RefreshCw } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import AnimationWrapper from "./animation-wrapper"
import { useSuiCampaigns } from "@/hooks/useSuiCampaigns"
import { useEffect, useState, useRef } from "react"
import { Campaign } from "@/lib/sui-campaigns"
import { formatDistanceToNow, format } from "date-fns"
import { useCampaignProgress } from "@/hooks/useCampaignProgress"
import { toast } from "react-hot-toast"

export default function NewestEvents() {
  const { campaigns, loading, error, refreshCampaigns } = useSuiCampaigns();
  const [displayCampaigns, setDisplayCampaigns] = useState<Campaign[]>([]);

  // Use a ref to track if we've already fetched campaigns
  const initialFetchDone = useRef(false);

  // Track when we actually start fetching data
  const [isFetching, setIsFetching] = useState(false);
  
  // Use useCallback to memoize the fetch function so it doesn't change on every render
  useEffect(() => {
    // Only fetch campaigns on initial mount
    if (initialFetchDone.current) return;
    
    // Immediately set fetching state to true
    setIsFetching(true);
    
    // Fetch campaigns when component mounts with retry logic
    const fetchWithRetry = async () => {
      try {
        console.log('Initial campaign fetch on component mount');
        await refreshCampaigns();
        initialFetchDone.current = true;
        setIsFetching(false); // Done fetching
      } catch (err) {
        console.error('Error fetching campaigns in component:', err);
        // Retry after 2 seconds if there was an error
        setTimeout(() => {
          refreshCampaigns()
            .then(() => {
              initialFetchDone.current = true;
              setIsFetching(false); // Done fetching
            })
            .catch(e => {
              console.error('Retry failed:', e);
              setIsFetching(false); // Stop loading even if failed
            });
        }, 2000);
      }
    };
    
    fetchWithRetry();
  }, []);

  // Sort campaigns by creation date (newest first) and limit to 3
  useEffect(() => {
    if (campaigns.length > 0) {
      // Sort by creation date (newest first)
      const sorted = [...campaigns].sort((a, b) => {
        return Number(b.createdAt) - Number(a.createdAt);
      });
      
      // Take the first 3 campaigns
      const limited = sorted.slice(0, 3);
      
      // Update state with sorted and limited campaigns
      setDisplayCampaigns(limited);
      console.log('Updated display campaigns:', limited.length);
    }
  }, [campaigns]);
  
  // Track which campaigns are currently being refreshed
  const [refreshingCampaigns, setRefreshingCampaigns] = useState<{[id: string]: boolean}>({});
  
  // Function to refresh a specific campaign's data
  const refreshCampaignProgress = async (campaignId: string) => {
    // Mark this campaign as refreshing
    setRefreshingCampaigns(prev => ({
      ...prev,
      [campaignId]: true
    }));
    
    try {
      // Refresh all campaigns data from the blockchain
      await refreshCampaigns();
      toast.success('Campaign data refreshed!');
    } catch (error) {
      console.error('Error refreshing campaign progress:', error);
      toast.error('Failed to refresh campaign data');
    } finally {
      // Mark as not refreshing
      setRefreshingCampaigns(prev => ({
        ...prev,
        [campaignId]: false
      }));
    }
  };
  
  // Helper function to format amount for display (convert from smallest units to sgUSD)
  const formatAmountValue = (amount?: string): number => {
    try {
      if (!amount) return 0;
      const amountBigInt = BigInt(amount);
      return Number(amountBigInt) / 1_000_000_000;
    } catch (error) {
      console.error('Error getting formatted amount value:', error);
      return 0;
    }
  };
  
// Campaign Progress Bar component that uses the useCampaignProgress hook
function CampaignProgressBar({ campaignId, isRefreshing, onRefresh }: { campaignId: string, isRefreshing?: boolean, onRefresh?: () => void }) {
  // Use the campaign progress hook to get sgUSD values
  const {
    loading,
    progress,
    currentAmountFormatted,
    goalAmountFormatted,
    refreshData
  } = useCampaignProgress(campaignId);

  return (
    <>
      <div className="flex flex-wrap justify-between text-sm mb-1">
        <span className="font-medium text-sui-navy">{progress}% Funded</span>
        <div className="flex items-center">
          <span className="text-gray-700">Goal: <span className="font-medium text-blue-500">{goalAmountFormatted}</span> sgUSD</span>
          {onRefresh && (
            <button 
              onClick={onRefresh}
              className="ml-2 text-gray-500 hover:text-sui-navy transition-colors" 
              disabled={isRefreshing || loading}
            >
              <RefreshCw className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mt-1 mb-2">
        <div 
          className={`h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-500 ${loading ? 'animate-pulse' : ''}`}
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </>
  );
}

// This function is now handled by the useCampaignProgress hook

// Placeholder progress bar for loading state
function PlaceholderProgressBar() {
  return (
    <>
      <div className="flex flex-wrap justify-between text-sm mb-1">
        <span className="font-medium text-sui-navy animate-pulse">0% Funded</span>
        <span className="text-gray-700">Goal: <span className="font-medium text-blue-500">0.00</span> sgUSD</span>
      </div>
      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mt-1 mb-2">
        <div 
          className="h-full bg-gradient-to-r from-gray-200 to-gray-300 rounded-full animate-pulse" 
          style={{ width: '0%' }}
        ></div>
      </div>
    </>
  );
}
  
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
      id: 'placeholder-1',
      name: "Loading campaigns...",
      description: "Please wait while we fetch campaigns from the blockchain.",
      imageUrl: "/placeholder.svg",
      createdAt: Date.now().toString(),
      goalAmount: "10000000000", // 10 sgUSD
      currentAmount: "0",
      currentAmountSgUSD: "0", // 0 sgUSD
      deadline: Math.floor(Date.now() / 1000 + 30 * 24 * 60 * 60).toString(), // 30 days from now in seconds
      category: "Loading",
      creator: ""
    },
    {
      id: 'placeholder-2',
      name: "Connecting to Sui...",
      description: "We're connecting to the Sui blockchain to fetch the latest campaigns.",
      imageUrl: "/placeholder.svg",
      createdAt: Date.now().toString(),
      goalAmount: "5000000000", // 5 sgUSD
      currentAmount: "0",
      currentAmountSgUSD: "0", // 0 sgUSD
      deadline: Math.floor(Date.now() / 1000 + 15 * 24 * 60 * 60).toString(), // 15 days from now in seconds
      category: "Loading",
      creator: ""
    },
    {
      id: 'placeholder-3',
      name: "Almost there...",
      description: "Just a moment while we load the latest crowdfunding campaigns.",
      imageUrl: "/placeholder.svg",
      createdAt: Date.now().toString(),
      goalAmount: "3000000000", // 3 sgUSD
      currentAmount: "0",
      currentAmountSgUSD: "0", // 0 sgUSD
      deadline: Math.floor(Date.now() / 1000 + 20 * 24 * 60 * 60).toString(), // 20 days from now in seconds
      category: "Loading",
      creator: ""
    },
  ]

  return (
    <section id="newest-events" className="min-h-screen flex flex-col justify-center px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-[90%] mx-auto">
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
          {(isFetching || (loading && displayCampaigns.length === 0)) ? (
            <div className="col-span-3 text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sui-navy mx-auto mb-4"></div>
              <p className="text-sui-navy font-medium">Loading campaigns from the blockchain...</p>
              <p className="text-gray-500 text-sm mt-2">This may take a few moments as we connect to the Sui network</p>
              {isFetching && <p className="text-xs text-gray-400 mt-2">Fetching latest data...</p>}
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
              className={`bg-white rounded-lg overflow-hidden border shadow-sm hover:shadow-md transition-shadow duration-300 ${(isFetching || (loading && !displayCampaigns.length)) ? 'animate-pulse' : ''}`}
              animationClass="fade-up"
              delay={index * 0.2}
            >
              <div className="p-6">
                <h3 className="text-xl font-everett font-bold mb-2 line-clamp-1">{campaign.name}</h3>
                <p className="text-sm text-gray-500 font-light mb-4 line-clamp-2 h-10">{campaign.description}</p>
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
                  {/* Use the useCampaignProgress hook for consistent sgUSD progress tracking */}
                  {campaign.id.startsWith('placeholder') ? (
                    // Use a placeholder progress bar for loading state
                    <PlaceholderProgressBar />
                  ) : (
                    // Use the real progress bar with sgUSD values for actual campaigns
                    <CampaignProgressBar campaignId={campaign.id} isRefreshing={refreshingCampaigns[campaign.id]} onRefresh={() => refreshCampaignProgress(campaign.id)} />
                  )}
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mt-4">
                  <Link href={`/donate/${campaign.id}`} className="page-transition w-full sm:w-auto">
                    <Button className="w-full sm:w-auto bg-sui-navy text-white hover:bg-sui-navy/90 rounded-full px-5 flex items-center justify-center transition-all duration-200 hover:shadow-md">
                      <DollarSign className="mr-1.5 h-4 w-4" />
                      Donate Now
                    </Button>
                  </Link>

                  <div className="flex items-center text-xs text-gray-600 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                    <Clock className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                    <span>
                      {(() => {
                        try {
                          // Check if deadline is valid
                          if (!campaign.deadline) return 'Deadline not set';
                          
                          // Parse the deadline timestamp
                          const deadlineTimestamp = Number(campaign.deadline);
                          
                          // Validate the timestamp (must be a valid future date)
                          if (isNaN(deadlineTimestamp) || deadlineTimestamp <= 0) {
                            return 'Invalid deadline';
                          }
                          
                          // Convert to milliseconds and create Date object
                          const deadlineDate = new Date(deadlineTimestamp * 1000);
                          
                          // Format the date
                          return `Ends on ${format(deadlineDate, 'MMM d, yyyy')}`;
                        } catch (error) {
                          console.error('Error formatting deadline:', error, campaign.deadline);
                          return 'Date error';
                        }
                      })()}
                    </span>
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
