"use client"

import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import { CheckCircle, Clock, RefreshCw, Info, Trophy, TrendingUp } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useSuiCampaigns } from "@/hooks/useSuiCampaigns"
import { Campaign } from "@/lib/sui-campaigns"
import { format } from "date-fns"
import { useCampaignProgress } from "@/hooks/useCampaignProgress"
import { toast } from "react-hot-toast"

export default function CompletedCampaignsPage() {
  const { campaigns, loading, error, refreshCampaigns } = useSuiCampaigns();
  const [completedCampaigns, setCompletedCampaigns] = useState<Campaign[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Use a ref to track if we've already fetched campaigns
  const initialFetchDone = useRef(false);
  
  // Track when we actually start fetching data
  const [isFetching, setIsFetching] = useState(false);
  
  // Track which campaigns are currently being refreshed
  const [refreshingCampaigns, setRefreshingCampaigns] = useState<{[id: string]: boolean}>({});
  
  // Fetch campaigns on mount with retry logic
  useEffect(() => {
    if (initialFetchDone.current) return;
    
    setIsFetching(true);
    
    const fetchWithRetry = async () => {
      try {
        console.log('Initial campaign fetch for completed campaigns page');
        await refreshCampaigns();
        initialFetchDone.current = true;
        setIsFetching(false);
      } catch (err) {
        console.error('Error fetching campaigns:', err);
        setTimeout(() => {
          refreshCampaigns()
            .then(() => {
              initialFetchDone.current = true;
              setIsFetching(false);
            })
            .catch(e => {
              console.error('Retry failed:', e);
              setIsFetching(false);
            });
        }, 2000);
      }
    };
    
    fetchWithRetry();
  }, []);

  // Filter completed campaigns
  useEffect(() => {
    if (campaigns.length > 0) {
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
      
      // Sort by total raised (descending)
      const sorted = completed.sort((a, b) => {
        const aAmount = Number(a.currentAmountSgUSD || 0);
        const bAmount = Number(b.currentAmountSgUSD || 0);
        return bAmount - aAmount;
      });
      
      setCompletedCampaigns(sorted);
      console.log('Found completed campaigns:', sorted.length);
    }
  }, [campaigns]);
  
  // Filter campaigns based on search term
  const filteredCampaigns = completedCampaigns.filter(campaign => 
    (campaign.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (campaign.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (campaign.category || '').toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Function to refresh a specific campaign's data
  const refreshCampaignProgress = async (campaignId: string) => {
    setRefreshingCampaigns(prev => ({
      ...prev,
      [campaignId]: true
    }));
    
    try {
      await refreshCampaigns();
      toast.success('Campaign data refreshed!');
    } catch (error) {
      console.error('Error refreshing campaign progress:', error);
      toast.error('Failed to refresh campaign data');
    } finally {
      setRefreshingCampaigns(prev => ({
        ...prev,
        [campaignId]: false
      }));
    }
  };
  
  // Campaign Progress Bar component
  function CampaignProgressBar({ campaignId, isRefreshing, onRefresh }: { 
    campaignId: string, 
    isRefreshing?: boolean, 
    onRefresh?: () => void 
  }) {
    const {
      loading,
      progress,
      currentAmountFormatted,
      goalAmountFormatted
    } = useCampaignProgress(campaignId);

    return (
      <>
        <div className="flex flex-wrap justify-between text-sm mb-2">
          <span className="font-medium text-green-600">{progress}% Funded</span>
          <div className="flex items-center">
            <span className="text-gray-700">
              Raised: <span className="font-medium text-green-600">{currentAmountFormatted}</span> / 
              <span className="font-medium text-blue-500"> {goalAmountFormatted}</span> sgUSD
            </span>
            {onRefresh && (
              <button 
                onClick={onRefresh}
                className="ml-2 text-gray-500 hover:text-sui-navy transition-colors" 
                disabled={isRefreshing || loading}
              >
                <RefreshCw className={`h-3 w-3 ${isRefreshing || loading ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
        </div>
        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`h-full bg-green-500 rounded-full transition-all duration-500 ${loading ? 'animate-pulse' : ''}`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          ></div>
        </div>
      </>
    );
  }
  
  // Calculate total funds raised
  const totalFundsRaised = completedCampaigns.reduce((total, campaign) => {
    return total + parseFloat(campaign.currentAmountSgUSD || "0");
  }, 0);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full bg-gradient-to-b from-green-50 to-white py-12 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Trophy className="h-8 w-8 text-green-600" />
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
                Successfully Funded Campaigns
              </h1>
            </div>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              These campaigns have reached their funding goals thanks to generous donors like you. 
              Explore the success stories and see the impact of community support.
            </p>
            
            {/* Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                <div className="text-2xl font-bold text-green-600">{completedCampaigns.length}</div>
                <div className="text-sm text-gray-600">Completed Campaigns</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {totalFundsRaised.toFixed(2)} sgUSD
                </div>
                <div className="text-sm text-gray-600">Total Funds Raised</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                <div className="flex items-center justify-center text-2xl font-bold text-sui-navy">
                  <TrendingUp className="h-6 w-6 mr-1" />
                  100%+
                </div>
                <div className="text-sm text-gray-600">Success Rate</div>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="flex justify-center">
              <input
                type="text"
                placeholder="Search completed campaigns..."
                className="w-full max-w-lg px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Loading state */}
        {(isFetching || (loading && completedCampaigns.length === 0)) && (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading completed campaigns...</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="text-center py-20">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-lg mx-auto">
              <h3 className="text-red-600 font-bold text-lg mb-2">Network Connection Error</h3>
              <p className="text-gray-700 mb-4">Unable to load completed campaigns.</p>
              <Button 
                onClick={() => refreshCampaigns()} 
                className="bg-sui-navy text-white hover:bg-sui-navy/90"
              >
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isFetching && !loading && !error && filteredCampaigns.length === 0 && (
          <div className="text-center py-20">
            <CheckCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              {searchTerm ? 'No completed campaigns match your search.' : 'No campaigns have been completed yet.'}
            </p>
            <Link href="/explore">
              <Button className="bg-sui-navy text-white hover:bg-sui-navy/90">
                Explore Active Campaigns
              </Button>
            </Link>
          </div>
        )}

        {/* Campaigns grid */}
        {filteredCampaigns.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 py-12">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCampaigns.map((campaign) => (
                <div key={campaign.id} className="bg-white rounded-lg overflow-hidden border shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="relative">
                    <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center z-10">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Funded Successfully
                    </div>
                    <div className="relative h-48 w-full">
                      <Image 
                        src={campaign.imageUrl || "/placeholder.svg"} 
                        alt={campaign.name} 
                        fill 
                        className="object-cover" 
                      />
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2 line-clamp-1">{campaign.name}</h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2 h-10">
                      {campaign.description}
                    </p>

                    <div className="mb-4">
                      <CampaignProgressBar 
                        campaignId={campaign.id} 
                        isRefreshing={refreshingCampaigns[campaign.id]} 
                        onRefresh={() => refreshCampaignProgress(campaign.id)} 
                      />
                    </div>

                    {/* Category and completion date */}
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-4">
                      <span className="bg-gray-100 px-2 py-1 rounded-full">
                        {campaign.category || 'General'}
                      </span>
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {(() => {
                          try {
                            if (!campaign.deadline) return 'Completed';
                            const deadlineTimestamp = Number(campaign.deadline);
                            if (isNaN(deadlineTimestamp) || deadlineTimestamp <= 0) {
                              return 'Completed';
                            }
                            const deadlineDate = new Date(deadlineTimestamp * 1000);
                            return `Completed ${format(deadlineDate, 'MMM d, yyyy')}`;
                          } catch (error) {
                            return 'Completed';
                          }
                        })()}
                      </div>
                    </div>

                    {/* View Details Button */}
                    <Link href={`/donate/${campaign.id}`} className="w-full">
                      <Button className="w-full bg-sui-navy text-white hover:bg-sui-navy/90 rounded-full flex items-center justify-center">
                        <Info className="mr-1.5 h-4 w-4" />
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  )
}