"use client"

import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import { Heart } from "lucide-react"
import { useState, useEffect } from "react"
import { useSuiCampaigns } from "@/hooks/useSuiCampaigns"
import { Campaign } from "@/lib/sui-campaigns"

export default function ExplorePage() {
  // Use the hook to fetch campaigns from the blockchain
  const { campaigns, loading, error, refreshCampaigns } = useSuiCampaigns();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('Featured');

  // Fetch campaigns when component mounts
  useEffect(() => {
    refreshCampaigns();
  }, [refreshCampaigns]);

  // Filter campaigns based on search term
  const filteredCampaigns = campaigns.filter(campaign => 
    (campaign.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (campaign.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (campaign.category || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate progress percentage for a campaign
  const calculateProgress = (current: string | undefined, goal: string | undefined): number => {
    if (!current || !goal) return 0;
    
    const currentNum = parseInt(current, 10);
    const goalNum = parseInt(goal, 10);
    
    if (isNaN(currentNum) || isNaN(goalNum) || goalNum === 0) {
      console.log('Invalid progress calculation inputs:', { current, goal, currentNum, goalNum });
      return 0;
    }
    
    return Math.min(Math.round((currentNum / goalNum) * 100), 100);
  };

  // Get progress color based on percentage
  const getProgressColor = (progress: number) => {
    if (progress < 30) return 'bg-red-500';
    if (progress < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Format SUI amount for display
  const formatSuiAmount = (amount: string) => {
    if (!amount) return '0';
    try {
      // Convert from MIST to SUI (1 SUI = 10^9 MIST)
      const suiAmount = parseInt(amount, 10) / 1000000000;
      return suiAmount.toLocaleString(undefined, { maximumFractionDigits: 2 });
    } catch (e) {
      return '0';
    }
  };

  // Format deadline to human-readable date using chain of thought approach
  const formatDeadline = (timestamp: string) => {
    if (!timestamp) return 'No deadline';
    try {
      // Step 1: Parse the timestamp - blockchain timestamps can be in different formats
      let timestampNum = parseInt(timestamp, 10);
      
      // Step 2: Check if we have a reasonable timestamp (blockchain epochs vs unix timestamps)
      // If it's a small number (like blockchain epoch), convert to a reasonable date
      if (timestampNum < 100000) {
        // This is likely a blockchain epoch number, use current date + epoch days as estimate
        const currentDate = new Date();
        const futureDate = new Date(currentDate.setDate(currentDate.getDate() + timestampNum));
        return futureDate.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        });
      }
      
      // Step 3: If it's a unix timestamp (seconds since 1970), convert to milliseconds
      const date = new Date(timestampNum * 1000);
      
      // Step 4: Validate the date is reasonable (not thousands of years in future)
      const currentYear = new Date().getFullYear();
      if (date.getFullYear() > currentYear + 100) {
        // If date is too far in future, it might be in milliseconds already
        const adjustedDate = new Date(timestampNum);
        if (adjustedDate.getFullYear() <= currentYear + 100) {
          return adjustedDate.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          });
        }
        // If still unreasonable, return a relative timeframe
        return 'Future date';
      }
      
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (e) {
      return 'No deadline';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <section className="w-full bg-gradient-to-b from-[#d6eaff] to-white py-10 px-4">
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-2xl md:text-3xl font-bold mb-2 sui-navy-text">Explore Crowdfunding <span className="inline-block">🖱️</span></h1>
            <p className="text-gray-600 mb-6">For Dreams, Needs, and the Moments That Matter Most.</p>
            <div className="flex justify-center mb-8">
              <input
                type="text"
                placeholder="Search for projects, causes, or keywords..."
                className="w-full max-w-lg px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sui-navy bg-white shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 justify-center mb-2">
              <button 
                className={`px-4 py-2 rounded-full ${activeFilter === 'Featured' ? 'bg-sui-navy text-white' : 'bg-gray-200 text-gray-800'} font-medium text-sm`}
                onClick={() => setActiveFilter('Featured')}
              >
                Featured
              </button>
              <button 
                className={`px-4 py-2 rounded-full ${activeFilter === 'Newest' ? 'bg-sui-navy text-white' : 'bg-gray-200 text-gray-800'} font-medium text-sm`}
                onClick={() => setActiveFilter('Newest')}
              >
                Newest
              </button>
              <button 
                className={`px-4 py-2 rounded-full ${activeFilter === 'Near me' ? 'bg-sui-navy text-white' : 'bg-gray-200 text-gray-800'} font-medium text-sm`}
                onClick={() => setActiveFilter('Near me')}
              >
                Near me
              </button>
            </div>
          </div>
        </section>

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sui-navy"></div>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="text-center py-20">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={() => refreshCampaigns()} className="bg-sui-navy text-white hover:bg-sui-navy/90">
              Try Again
            </Button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filteredCampaigns.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 mb-4">No campaigns found. Create your own campaign to get started!</p>
            <Button className="bg-sui-navy text-white hover:bg-sui-navy/90" onClick={() => window.location.href = '/create'}>
              Create Campaign
            </Button>
          </div>
        )}

        {/* Campaigns grid */}
        {filteredCampaigns.length > 0 && (
          <section className="max-w-6xl mx-auto px-4 py-8">
            <div className="grid md:grid-cols-3 gap-8">
              {/* Featured campaign card with modern design */}
              {(
                <div className="md:col-span-3 flex justify-center mb-12">
                  <div className="bg-white rounded-3xl overflow-hidden w-full max-w-xl relative shadow-[0_20px_50px_rgba(8,112,184,0.07)] border border-gray-100 hover:shadow-[0_20px_60px_rgba(8,112,184,0.1)] transition-all duration-300">
                    {/* Campaign image with gradient overlay */}
                    <div className="relative h-64 w-full">
                      <Image 
                        src={filteredCampaigns[0]?.imageUrl || '/placeholder-campaign.jpg'} 
                        alt={filteredCampaigns[0]?.name || 'Campaign Image'} 
                        fill 
                        className="object-cover" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                      
                      {/* Category badge */}
                      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-sui-navy font-medium px-3 py-1 rounded-full text-xs shadow-sm border border-gray-100">
                        {filteredCampaigns[0]?.category || 'Uncategorized'}
                      </div>
                      
                      {/* Favorite button */}
                      <button className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-sm border border-gray-100 hover:bg-white transition-colors">
                        <Heart className="h-4 w-4 text-sui-navy" />
                      </button>
                    </div>
                    
                    <div className="p-6">
                      {/* Campaign title */}
                      <h2 className="font-bold text-xl mb-2 text-gray-800">{filteredCampaigns[0]?.name || 'Unnamed Campaign'}</h2>
                      
                      {/* Campaign description */}
                      <p className="text-gray-600 mb-5 line-clamp-2">{filteredCampaigns[0]?.description || 'No description available'}</p>
                      
                      {/* Progress bar with modern design */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-gray-800">{formatSuiAmount(filteredCampaigns[0]?.currentAmount || '0')} SUI</span>
                          <span className="text-gray-500">{formatSuiAmount(filteredCampaigns[0]?.goalAmount || '0')} SUI</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-gray-100">
                          {(() => {
                            const progress = calculateProgress(
                              filteredCampaigns[0]?.currentAmount, 
                              filteredCampaigns[0]?.goalAmount
                            );
                            const progressColor = getProgressColor(progress);
                            return (
                              <div className={`h-2 rounded-full ${progressColor}`} style={{width: `${progress}%`}}></div>
                            );
                          })()}
                        </div>
                      </div>
                      
                      {/* Campaign stats */}
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                          <span>Active</span>
                        </div>
                        <div className="text-xs font-medium text-gray-500">
                          Deadline: {formatDeadline(filteredCampaigns[0]?.deadline || '')}
                        </div>
                      </div>
                      
                      {/* Call to action */}
                      <Link href={`/donate/${filteredCampaigns[0]?.id}`} className="block w-full">
                        <Button className="w-full rounded-xl py-3 bg-sui-navy text-white hover:bg-sui-navy/90 flex items-center justify-center gap-2 font-medium">
                          Donate Now
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Rest of the campaigns */}
              {filteredCampaigns.slice(1).map((campaign, index) => (
                <div key={campaign?.id || index} className="bg-white rounded-2xl overflow-hidden relative shadow-[0_15px_30px_rgba(8,112,184,0.06)] border border-gray-100 hover:shadow-[0_15px_40px_rgba(8,112,184,0.1)] transition-all duration-300">
                  {/* Campaign image with gradient overlay */}
                  <div className="relative h-44 w-full">
                    <Image 
                      src={campaign?.imageUrl || '/placeholder-campaign.jpg'} 
                      alt={campaign?.name || 'Campaign Image'} 
                      fill 
                      className="object-cover" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    
                    {/* Category badge */}
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-sui-navy font-medium px-2 py-0.5 rounded-full text-xs shadow-sm border border-gray-100">
                      {campaign?.category || 'Uncategorized'}
                    </div>
                    
                    {/* Favorite button */}
                    <button className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow-sm border border-gray-100 hover:bg-white transition-colors">
                      <Heart className="h-3 w-3 text-sui-navy" />
                    </button>
                  </div>
                  
                  <div className="p-4">
                    {/* Campaign title */}
                    <h2 className="font-bold text-base mb-1.5 text-gray-800 line-clamp-1">{campaign?.name || 'Unnamed Campaign'}</h2>
                    
                    {/* Campaign description */}
                    <p className="text-xs text-gray-600 mb-3 line-clamp-2">{campaign?.description || 'No description available'}</p>
                    
                    {/* Progress bar with modern design */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-gray-800">{formatSuiAmount(campaign?.currentAmount || '0')} SUI</span>
                        <span className="text-gray-500">{formatSuiAmount(campaign?.goalAmount || '0')} SUI</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-gray-100">
                        {(() => {
                          const progress = calculateProgress(
                            campaign?.currentAmount,
                            campaign?.goalAmount
                          );
                          const progressColor = getProgressColor(progress);
                          return (
                            <div className={`h-1.5 rounded-full ${progressColor}`} style={{width: `${progress}%`}}></div>
                          );
                        })()}
                      </div>
                    </div>
                    
                    {/* Campaign stats and CTA */}
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-medium text-gray-500">
                        Ends: {formatDeadline(campaign?.deadline || '')}
                      </div>
                      <Link href={`/donate/${campaign?.id}`}>
                        <Button className="rounded-lg px-3 py-1 text-xs bg-sui-navy text-white hover:bg-sui-navy/90">
                          Donate
                        </Button>
                      </Link>
                    </div>
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
};
