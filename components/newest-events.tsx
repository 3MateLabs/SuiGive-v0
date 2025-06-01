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
        }, 2000); // Reduced retry time
      }
    };
    
    fetchWithRetry();
    // Empty dependency array ensures this only runs once on mount
  }, []);  // Remove refreshCampaigns from dependency array to prevent infinite loop

  useEffect(() => {
    if (campaigns && campaigns.length > 0) {
      // Sort campaigns by creation date (newest first) and take the first 3
      const sorted = [...campaigns].sort((a, b) => {
        return Number(b.createdAt) - Number(a.createdAt);
      }).slice(0, 3);
      
      setDisplayCampaigns(sorted);
    }
  }, [campaigns]);
  
  // We'll use a map to store campaign progress data for each campaign
  const [campaignProgressData, setCampaignProgressData] = useState<{[id: string]: {
    loading: boolean;
    progress: number;
    currentAmount: string;
    goalAmount: string;
    currentAmountFormatted: string;
    goalAmountFormatted: string;
    lastBlockchainUpdate: number;
  }}>({});
  
  // Function to refresh campaign data from the blockchain
  const refreshCampaignProgress = async (campaignId: string) => {
    // Mark this campaign as loading
    setCampaignProgressData(prev => ({
      ...prev,
      [campaignId]: {
        ...prev[campaignId],
        loading: true
      }
    }));
    
    try {
      // Get the campaign from our list
      const campaign = displayCampaigns.find(c => c.id === campaignId);
      if (!campaign) return;
      
      // Refresh the campaign data from the blockchain
      await refreshCampaigns();
      
      // Update the progress data with the refreshed campaign data
      // Note: The refreshCampaigns function will update the campaigns state
      // which will trigger the useEffect that updates campaignProgressData
      
      toast.success('Campaign data refreshed!');
    } catch (error) {
      console.error('Error refreshing campaign progress:', error);
      toast.error('Failed to refresh campaign data');
      
      // Mark as not loading even if there was an error
      setCampaignProgressData(prev => ({
        ...prev,
        [campaignId]: {
          ...prev[campaignId],
          loading: false
        }
      }));
    }
  };
  
  // Initialize progress data for each campaign
  useEffect(() => {
    if (displayCampaigns.length > 0) {
      const newProgressData: {[id: string]: any} = {};
      
      // Create progress data for each campaign
      displayCampaigns.forEach(campaign => {
        // Calculate initial progress for this campaign
        const progress = calculateInitialProgress(campaign.currentAmount, campaign.goalAmount);
        
        newProgressData[campaign.id] = {
          loading: false,
          progress: progress,
          currentAmount: campaign.currentAmount,
          goalAmount: campaign.goalAmount,
          currentAmountFormatted: formatAmount(campaign.currentAmount),
          goalAmountFormatted: formatAmount(campaign.goalAmount),
          lastBlockchainUpdate: Date.now()
        };
      });
      
      setCampaignProgressData(newProgressData);
    }
  }, [displayCampaigns]);
  
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
  
  // Helper function to calculate initial progress percentage
  const calculateInitialProgress = (current: string, goal: string) => {
    try {
      // Use the same formatting logic as the displayed amount for consistency
      // This ensures the gauge matches exactly what's shown in the UI
      const currentFormatted = formatAmountValue(current);
      const goalFormatted = formatAmountValue(goal);
      
      if (goalFormatted === 0) return 0;
      
      // If the formatted amount would display as 0.00, set progress to 0
      if (currentFormatted < 0.01) {
        console.log('Current amount too small, setting progress to 0');
        return 0;
      }
      
      // Calculate percentage using the formatted values (limited to 100%)
      const percentage = Math.floor((currentFormatted * 100) / goalFormatted);
      console.log('Progress calculation:', { current: currentFormatted, goal: goalFormatted, percentage });
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
      return (Number(amountBigInt) / 1_000_000_000).toFixed(2);
    } catch (error) {
      console.error('Error formatting amount:', error);
      return '0.00';
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
      description: "Please wait while we fetch campaigns from the blockchain.",
      imageUrl: "/placeholder.svg",
      createdAt: Date.now().toString(),
      goalAmount: "10000000000", // 10 sgUSD
      currentAmount: "0",
      deadline: Math.floor(Date.now() / 1000 + 30 * 24 * 60 * 60).toString(), // 30 days from now in seconds
      category: "Loading",
      creator: ""
    },
    {
      id: '2',
      name: "Connecting to Sui...",
      description: "We're connecting to the Sui blockchain to fetch the latest campaigns.",
      imageUrl: "/placeholder.svg",
      createdAt: Date.now().toString(),
      goalAmount: "5000000000", // 5 sgUSD
      currentAmount: "0",
      deadline: Math.floor(Date.now() / 1000 + 15 * 24 * 60 * 60).toString(), // 15 days from now in seconds
      category: "Loading",
      creator: ""
    },
    {
      id: '3',
      name: "Almost there...",
      description: "Just a moment while we load the latest crowdfunding campaigns.",
      imageUrl: "/placeholder.svg",
      createdAt: Date.now().toString(),
      goalAmount: "3000000000", // 3 sgUSD
      currentAmount: "0",
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
                  {/* Use our progress hooks for consistent progress tracking */}
                  {(() => {
                    // Get the progress data for this campaign
                    const progressData = campaignProgressData[campaign.id] || {
                      progress: calculateInitialProgress(campaign.currentAmount, campaign.goalAmount),
                      goalAmountFormatted: formatAmount(campaign.goalAmount)
                    };
                    
                    return (
                      <>
                        <div className="flex flex-wrap justify-between text-sm mb-1">
                          <span className="font-medium text-sui-navy">{progressData.progress}% Funded</span>
                          <span className="text-gray-700">Goal: <span className="font-medium text-blue-500">{progressData.goalAmountFormatted}</span> sgUSD</span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mt-1 mb-2">
                          <div 
                            className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-500" 
                            style={{ width: `${progressData.progress}%` }}
                          ></div>
                        </div>
                      </>
                    );
                  })()}
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
