"use client"

import { ArrowRight, CheckCircle, Clock, RefreshCw, Info } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import AnimationWrapper from "./animation-wrapper"
import { useSuiCampaigns } from "@/hooks/useSuiCampaigns"
import { useEffect, useState, useRef } from "react"
import { Campaign } from "@/lib/sui-campaigns"
import { format } from "date-fns"
import { useCampaignProgress } from "@/hooks/useCampaignProgress"
import { toast } from "react-hot-toast"
import { Button } from "@/components/ui/button"

export default function CompletedCrowdfunds() {
  const { campaigns, loading, error, refreshCampaigns } = useSuiCampaigns();
  const [completedCampaigns, setCompletedCampaigns] = useState<Campaign[]>([]);
  
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
        console.log('Initial campaign fetch for completed crowdfunds');
        await refreshCampaigns();
        initialFetchDone.current = true;
        setIsFetching(false); // Done fetching
      } catch (err) {
        console.error('Error fetching campaigns for completed crowdfunds:', err);
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

  // Filter and sort completed campaigns
  useEffect(() => {
    if (campaigns.length > 0) {
      // Filter campaigns that have reached 100% or more based on sgUSD amounts
      const completed = campaigns.filter(campaign => {
        // Use the same logic as useCampaignProgress hook for consistency
        const currentAmountSgUSD = campaign.currentAmountSgUSD || "0";
        const goalAmount = campaign.goalAmount || "0";
        
        if (goalAmount === "0") return false;
        
        try {
          // Parse the sgUSD amount (already in sgUSD units with decimals)
          const currentSgUSD = parseFloat(currentAmountSgUSD);
          
          // Convert goal amount from smallest units to sgUSD
          const goalBigInt = BigInt(goalAmount);
          const goalInSgUSD = Number(goalBigInt) / 1_000_000_000;
          
          if (goalInSgUSD === 0) return false;
          
          // Calculate progress percentage
          const progress = (currentSgUSD / goalInSgUSD) * 100;
          
          
          // Only include campaigns that have reached 100% or more
          return progress >= 100;
        } catch (error) {
          console.error('Error calculating progress for campaign:', campaign.id, error);
          return false;
        }
      });
      
      // Sort by completion date (using currentAmount as proxy for activity) - newest first
      const sorted = completed.sort((a, b) => {
        return Number(b.currentAmount || 0) - Number(a.currentAmount || 0);
      });
      
      // Take the first 3 completed campaigns
      const limited = sorted.slice(0, 3);
      
      setCompletedCampaigns(limited);
      console.log('Updated completed campaigns:', limited.length);
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

  
  // Campaign Progress Bar component for completed campaigns
  function CompletedCampaignProgressBar({ campaignId, isRefreshing, onRefresh }: { campaignId: string, isRefreshing?: boolean, onRefresh?: () => void }) {
    // Use the campaign progress hook to get sgUSD values
    const {
      loading,
      progress,
      goalAmountFormatted
    } = useCampaignProgress(campaignId);

    return (
      <>
        <div className="flex flex-wrap justify-between text-sm mb-1">
          <span className="font-medium text-green-600">{progress}% Funded</span>
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
            className={`h-full bg-green-500 rounded-full transition-all duration-500 ${loading ? 'animate-pulse' : ''}`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          ></div>
        </div>
      </>
    );
  }

  // Placeholder data for loading state
  const placeholderProjects = [
    {
      id: 'placeholder-1',
      name: "Loading completed campaigns...",
      description: "Please wait while we fetch completed campaigns from the blockchain.",
      imageUrl: "/placeholder.svg",
      createdAt: Date.now().toString(),
      goalAmount: "10000000000", // 10 sgUSD
      currentAmount: "10000000000",
      currentAmountSgUSD: "10", // 10 sgUSD
      deadline: Math.floor(Date.now() / 1000).toString(),
      category: "Loading",
      creator: ""
    },
    {
      id: 'placeholder-2',
      name: "Searching for funded projects...",
      description: "We're looking for successfully funded campaigns.",
      imageUrl: "/placeholder.svg",
      createdAt: Date.now().toString(),
      goalAmount: "5000000000", // 5 sgUSD
      currentAmount: "5000000000",
      currentAmountSgUSD: "5", // 5 sgUSD
      deadline: Math.floor(Date.now() / 1000).toString(),
      category: "Loading",
      creator: ""
    },
    {
      id: 'placeholder-3',
      name: "Almost there...",
      description: "Just a moment while we load completed crowdfunding campaigns.",
      imageUrl: "/placeholder.svg",
      createdAt: Date.now().toString(),
      goalAmount: "3000000000", // 3 sgUSD
      currentAmount: "3000000000",
      currentAmountSgUSD: "3", // 3 sgUSD
      deadline: Math.floor(Date.now() / 1000).toString(),
      category: "Loading",
      creator: ""
    },
  ];

  // Use completed campaigns or placeholder data
  const projects = completedCampaigns.length > 0 ? completedCampaigns : placeholderProjects;

  return (
    <section id="completed-crowdfunds" className="flex flex-col px-4 sm:px-6 lg:px-8 bg-gray-50 py-10">
      <div className="max-w-[90%] mx-auto">
        <div className="flex justify-between items-center mb-12">
          <AnimationWrapper animationClass="fade-right">
            <h2 className="text-3xl font-everett font-bold sui-navy-text">Completed Crowdfunds</h2>
          </AnimationWrapper>
          <AnimationWrapper animationClass="fade-left">
            <Link
              href="/completed"
              className="flex items-center text-sm font-medium sui-navy-text hover:text-sui-navy/70 transition-colors"
            >
              View all projects <ArrowRight className="ml-1 h-4 w-4 arrow-bounce" />
            </Link>
          </AnimationWrapper>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {(isFetching || (loading && completedCampaigns.length === 0)) ? (
            <div className="col-span-3 text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sui-navy mx-auto mb-4"></div>
              <p className="text-sui-navy font-medium">Loading completed campaigns from the blockchain...</p>
              <p className="text-gray-500 text-sm mt-2">Searching for successfully funded projects</p>
              {isFetching && <p className="text-xs text-gray-400 mt-2">Fetching latest data...</p>}
            </div>
          ) : error ? (
            <div className="col-span-3 text-center py-12">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-lg mx-auto">
                <h3 className="text-red-600 font-bold text-lg mb-2">Network Connection Error</h3>
                <p className="text-gray-700 mb-4">We're having trouble connecting to the Sui blockchain. This could be due to network issues or high traffic.</p>
                <p className="text-gray-600 text-sm mb-4">Error details: {error}</p>
                <button 
                  onClick={() => refreshCampaigns()} 
                  className="px-4 py-2 bg-sui-navy text-white rounded-lg hover:bg-sui-navy/90"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : completedCampaigns.length === 0 && !isFetching ? (
            <div className="col-span-3 text-center py-12">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 max-w-lg mx-auto">
                <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-gray-700 font-bold text-lg mb-2">No Completed Campaigns Yet</h3>
                <p className="text-gray-600">Be the first to help a campaign reach its funding goal!</p>
                <Link href="/explore" className="inline-block mt-4">
                  <button className="px-4 py-2 bg-sui-navy text-white rounded-lg hover:bg-sui-navy/90">
                    Explore Active Campaigns
                  </button>
                </Link>
              </div>
            </div>
          ) : projects.map((project, index) => (
            <AnimationWrapper
              key={project.id}
              id="completed-crowdfunds"
              className={`bg-white rounded-lg overflow-hidden border shadow-sm hover:shadow-md transition-shadow duration-300 ${(isFetching || (loading && !completedCampaigns.length)) ? 'animate-pulse' : ''}`}
              animationClass="fade-up"
              delay={index * 0.2}
            >
              <div className="relative">
                <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center z-10">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Funded Successfully
                </div>
                <div className="relative h-48 w-full">
                  <Image 
                    src={project.imageUrl || "/placeholder.svg"} 
                    alt={project.name} 
                    fill 
                    className="object-cover" 
                  />
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-everett font-bold mb-2 line-clamp-1">{project.name}</h3>
                <p className="text-sm text-gray-500 font-light mb-4 line-clamp-2 h-10">{project.description}</p>

                <div className="mb-4">
                  {/* Use the campaign progress bar for consistent sgUSD tracking */}
                  {project.id.startsWith('placeholder') ? (
                    <>
                      <div className="flex flex-wrap justify-between text-sm mb-1">
                        <span className="font-medium text-green-600">100% Funded</span>
                        <span className="text-gray-700">Goal: <span className="font-medium text-blue-500">0.00</span> sgUSD</span>
                      </div>
                      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mt-1 mb-2">
                        <div 
                          className="h-full bg-green-500 rounded-full animate-pulse" 
                          style={{ width: '100%' }}
                        ></div>
                      </div>
                    </>
                  ) : (
                    <CompletedCampaignProgressBar 
                      campaignId={project.id} 
                      isRefreshing={refreshingCampaigns[project.id]} 
                      onRefresh={() => refreshCampaignProgress(project.id)} 
                    />
                  )}
                </div>

                <div className="flex flex-col gap-3 mt-4">
                  <Link href={`/donate/${project.id}`} className="w-full">
                    <Button className="w-full bg-sui-navy text-white hover:bg-sui-navy/90 rounded-full px-5 flex items-center justify-center transition-all duration-200 hover:shadow-md">
                      <Info className="mr-1.5 h-4 w-4" />
                      View Details
                    </Button>
                  </Link>
                  
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 mr-1.5 text-green-500" />
                      <span className="font-medium">Successfully Funded</span>
                    </div>

                    <div className="flex items-center text-xs text-gray-600 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                      <Clock className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                      <span>
                        {(() => {
                          try {
                            if (!project.deadline) return 'Completed';
                            const deadlineTimestamp = Number(project.deadline);
                            if (isNaN(deadlineTimestamp) || deadlineTimestamp <= 0) {
                              return 'Completed';
                            }
                            const deadlineDate = new Date(deadlineTimestamp * 1000);
                            return `Completed ${format(deadlineDate, 'MMM d, yyyy')}`;
                          } catch (error) {
                            return 'Completed';
                          }
                        })()}
                      </span>
                    </div>
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
