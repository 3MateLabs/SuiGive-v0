"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DollarSign, Heart, Share2, AlertCircle, Wallet, Clock, RefreshCw, Copy, X, Twitter, Facebook, Linkedin } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { useSuiCampaigns } from "@/hooks/useSuiCampaigns"
import { Campaign } from "@/lib/sui-campaigns"
import { toast } from "react-hot-toast"
import { formatDistanceToNow, format } from "date-fns"
import { WalletConnectButton } from "@/components/WalletConnectButton"
import DonateWithSgUSD from "@/components/DonateWithSgUSD"
import { useCampaignProgress } from "@/hooks/useCampaignProgress"
import CampaignCharts from "@/components/CampaignCharts"

// We'll fetch real campaigns instead of using hardcoded ones

export default function DonatePage() {
  const router = useRouter()
  const { id } = useParams()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [donationAmount, setDonationAmount] = useState("50")
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pageLoaded, setPageLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [similarCampaigns, setSimilarCampaigns] = useState<Campaign[]>([])
  const [loadingSimilar, setLoadingSimilar] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const shareModalRef = useRef<HTMLDivElement>(null)

  // Get the campaigns hook
  const { getCampaignDetails, donate, connected, wallet, campaigns, refreshCampaigns } = useSuiCampaigns()

  // Find similar campaigns based on category
  useEffect(() => {
    if (campaigns.length > 0 && campaign) {
      setLoadingSimilar(true);
      // Filter campaigns by same category, excluding the current campaign
      const similar = campaigns
        .filter((c: Campaign) => 
          c.id !== campaign.id && 
          (c.category === campaign.category || Math.random() < 0.3) // Include some random campaigns if not enough in same category
        )
        .slice(0, 3); // Limit to 3 similar campaigns
      
      setSimilarCampaigns(similar);
      setLoadingSimilar(false);
    }
  }, [campaigns, campaign]);

  // Close modal when clicking outside of it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (shareModalRef.current && !shareModalRef.current.contains(event.target as Node)) {
        setShowShareModal(false);
      }
    }

    // Add event listener when modal is open
    if (showShareModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showShareModal]);

  // Define fetchCampaign function with useCallback to prevent recreation on each render
  const fetchCampaign = useCallback(async () => {
    if (!id) return
    
    try {
      setError(null)
      const campaignDetails = await getCampaignDetails(id.toString())
      
      if (campaignDetails) {
        setCampaign(campaignDetails as Campaign)
      } else {
        setError('Campaign not found')
      }
    } catch (err: any) {
      console.error('Error fetching campaign:', err)
      setError(err.message || 'Failed to load campaign')
    } finally {
      setPageLoaded(true)
    }
  }, [id, getCampaignDetails])
  


  // Fetch campaign data when the component mounts
  useEffect(() => {
    fetchCampaign()
    window.scrollTo(0, 0)
  }, [fetchCampaign])

  // Use our new campaign progress hook for reliable progress tracking
  const {
    loading: progressLoading,
    progress,
    currentAmountFormatted,
    goalAmountFormatted,
    addDonation,
    refreshData: refreshProgress,
    lastBlockchainUpdate
  } = useCampaignProgress(typeof id === 'string' ? id : '');
  
  // Ensure the campaign progress is synchronized with the homepage data
  useEffect(() => {
    if (campaign) {
      console.log('Synchronizing campaign progress with campaign data:', {
        id: campaign.id,
        currentAmount: campaign.currentAmount,
        goalAmount: campaign.goalAmount
      });
      
      // Debug image URL specifically
      console.log('Campaign image URL:', campaign.imageUrl);
      console.log('Image URL type:', typeof campaign.imageUrl);
      
      // Force refresh the progress data when campaign data is loaded
      // This ensures the progress bar matches what was shown on the homepage
      refreshProgress();
    }
  }, [campaign, refreshProgress]);
  
  // Memoized donation completion handler to prevent infinite update loops
  const handleDonationComplete = useCallback((amountValue: number, amountInUnits: string) => {
    // Show loading toast
    toast.loading('Updating campaign data...', { id: 'update-campaign' });
    
    try {
      // Use our addDonation function from useCampaignProgress
      // This will update the UI immediately and persist the data between refreshes
      const newTotal = addDonation(amountInUnits);
      
      // Update toast
      toast.success('Campaign progress updated!', { id: 'update-campaign' });
      
      // Log the update for debugging
      console.log('Campaign update after donation:', {
        donationAmount: amountValue,
        donationAmountInUnits: amountInUnits,
        newTotal
      });
      
      // IMPORTANT: Use setTimeout to prevent React update loops
      // by deferring the campaign state update
      setTimeout(() => {
        setCampaign((prevCampaign) => {
          if (!prevCampaign) return prevCampaign;
          
          // Create a copy of the campaign with updated amount
          return {
            ...prevCampaign,
            currentAmount: newTotal
          };
        });
      }, 200);
    } catch (error) {
      console.error('Error updating campaign after donation:', error);
      toast.error('Error updating display. Please refresh the page.', { id: 'update-campaign' });
    }
  }, [addDonation]);

  // Format the timestamp to "X days ago"
  const formatTimeAgo = (timestamp: string) => {
    try {
      const date = new Date(Number(timestamp) * 1000)
      return formatDistanceToNow(date, { addSuffix: true })
    } catch (error) {
      return 'Recently'
    }
  }

  // Convert SUI amount to MIST (1 SUI = 10^9 MIST)
  const suiToMist = (amount: string): number => {
    try {
      return Math.floor(parseFloat(amount) * 1_000_000_000)
    } catch (error) {
      return 0
    }
  }

  const handleDonate = async () => {
    if (!connected) {
      // Use toast.error instead of toast.info since that's what's available
      toast.error('Please connect your wallet to donate')
      return
    }
    
    if (!campaign) {
      toast.error('Campaign not found')
      return
    }
    
    try {
      setIsSubmitting(true)
      setError(null)
      
      // Convert the donation amount from SUI to MIST (smallest unit)
      const amountInMist = suiToMist(donationAmount)
      
      // Call the donate function from the hook
      // The Treasury Cap ID is now handled internally in the donate function
      // Fix: Pass empty message string as third parameter and isAnonymous as fourth parameter
      await donate(campaign.id, amountInMist, '', isAnonymous)
      
      // Show success message
      toast.success('Thank you for your donation!')
      
      // Refresh the campaign details
      const updatedCampaign = await getCampaignDetails(campaign.id)
      setCampaign(updatedCampaign as Campaign)
      
      // Reset form
      setDonationAmount('50')
      setIsAnonymous(false)
    } catch (err: any) {
      console.error('Error donating:', err)
      setError(err.message || 'Failed to process donation')
      toast.error(err.message || 'Failed to process donation')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!pageLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sui-navy"></div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Error Loading Campaign</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={() => router.push('/')} className="bg-sui-navy text-white">
          Return to Home
        </Button>
      </div>
    )
  }
  
  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sui-navy"></div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${pageLoaded ? "page-enter" : "opacity-0"}`}>
      <Navbar />

      <main className="container max-w-5xl py-8 px-4">
        <Link
          href="/"
          className="inline-flex items-center text-sm font-medium mb-6 text-gray-600 hover:text-sui-navy transition-colors page-transition"
        >
          Back to Home
        </Link>

        <div className="grid md:grid-cols-5 gap-8">
          {/* Project details - 3 columns */}
          <div className="md:col-span-3 space-y-6">
            <div className="bg-white rounded-xl overflow-hidden shadow-sm">
              <div className="relative h-64 w-full">
                {/* Handle both external and local image URLs */}
                {campaign.imageUrl ? (
                  campaign.imageUrl.startsWith('http') ? (
                    // External URL - use direct img tag for maximum compatibility
                    <div className="relative w-full h-full">
                      <img 
                        src={campaign.imageUrl} 
                        alt={campaign.name} 
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => {
                          console.error('External image failed to load:', campaign.imageUrl);
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder.svg';
                        }}
                      />
                    </div>
                  ) : (
                    // Local URL - use Next.js image optimization
                    <Image 
                      src={campaign.imageUrl.startsWith('/') ? campaign.imageUrl : `/${campaign.imageUrl}`} 
                      alt={campaign.name} 
                      fill 
                      className="object-cover"
                      onError={(e) => {
                        console.error('Local image failed to load:', campaign.imageUrl);
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder.svg';
                      }}
                    />
                  )
                ) : (
                  // No image URL - use placeholder
                  <Image 
                    src="/placeholder.svg" 
                    alt={campaign.name} 
                    fill 
                    className="object-cover"
                  />
                )}
                <div className="absolute top-4 left-4 bg-white rounded-full p-3">
                  <span className="text-2xl">🎯</span>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-center text-sm text-gray-500 mb-2">
                  <span className="bg-gray-100 rounded-full px-3 py-1">{campaign.category}</span>
                  <span className="mx-2">•</span>
                  <span>{formatTimeAgo(campaign.createdAt)}</span>
                </div>

                <h1 className="text-2xl md:text-3xl font-bold mb-4 sui-navy-text">{campaign.name}</h1>

                <p className="text-gray-700 mb-6">{campaign.description}</p>

                <div className="mb-6">
                  {/* Progress bar using useCampaignProgress hook - sgUSD only */}
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{progress}% Funded with sgUSD</span>
                    <span>Goal: {goalAmountFormatted} sgUSD</span>
                    <button 
                      onClick={() => {
                        toast.loading('Refreshing data...', { id: 'refresh-progress' });
                        refreshProgress();
                        setTimeout(() => toast.success('Data refreshed!', { id: 'refresh-progress' }), 1000);
                      }}
                      className="text-xs text-blue-600 hover:underline flex items-center"
                      disabled={progressLoading}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Refresh Data
                    </button>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-gray-500">
                    <span>sgUSD Donated: <span className="font-medium">{currentAmountFormatted}</span> sgUSD</span>
                    <span>Progress based on sgUSD donations only</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600 pt-4 border-t">
                  <div>
                    <span className="font-medium">{campaign.backerCount || '-'}</span> backers
                  </div>
                  <div>
                    Organized by <span className="font-medium">{campaign.creator.substring(0, 10)}...</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Campaign Charts */}
            <CampaignCharts 
              name={campaign.name}
              goalAmount={campaign.goalAmount}
              raisedSUI={campaign.currentAmount || '0'}
              raisedSgUSD={campaign.currentAmountSgUSD || '0'}
              backerCount={typeof campaign.backerCount === 'string' ? parseInt(campaign.backerCount) || 0 : campaign.backerCount || 0}
            />

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-4 sui-navy-text">About This Project</h2>
              <p className="text-gray-700 mb-4">
                Every contribution makes a difference. By supporting this project, you're not just donating funds -
                you're becoming part of a community effort to create positive change.
              </p>
              <p className="text-gray-700">
                All donations are securely processed through the Sui blockchain, ensuring transparency and
                accountability. You can track exactly how your contribution is being used.
              </p>
            </div>
          </div>

          {/* Donation form - 2 columns */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm sticky top-24">
              {/* Import and use the new DonateWithSgUSD component */}
              {campaign && (
                <div>
                  <h2 className="text-xl font-bold mb-6 sui-navy-text">Make a Donation</h2>
                  
                  {!connected ? (
                    <div className="space-y-4 mb-6">
                      <p className="text-sm text-gray-600 mb-4">
                        Connect your wallet to donate with SUI or sgUSD tokens.
                      </p>
                      <WalletConnectButton variant="donation" className="w-full" />
                    </div>
                  ) : (
                    <div>
                      {/* Use the new DonateWithSgUSD component */}
                      <DonateWithSgUSD 
                        campaignId={campaign.id} 
                        campaignName={campaign.name} 
                        onDonationComplete={handleDonationComplete}
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 flex justify-center">
                <button 
                  onClick={() => setShowShareModal(true)}
                  className="flex items-center text-sm text-gray-600 hover:text-sui-navy transition-colors"
                >
                  <Share2 className="mr-1 h-4 w-4" />
                  Share this project
                </button>
              </div>
              
              {/* Share Modal */}
              {showShareModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowShareModal(false)}>
                  <div 
                    ref={shareModalRef}
                    className="bg-white rounded-xl p-6 max-w-md w-full mx-4 relative" 
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button 
                      onClick={() => setShowShareModal(false)}
                      className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                    >
                      <X className="h-5 w-5" />
                    </button>
                    
                    <h3 className="text-xl font-bold mb-4 sui-navy-text">Share this campaign</h3>
                    
                    <div className="mb-6">
                      <p className="text-sm text-gray-600 mb-2">Campaign URL:</p>
                      <div className="flex">
                        <input 
                          type="text" 
                          readOnly 
                          value={typeof window !== 'undefined' ? window.location.href : ''}
                          className="flex-1 p-2 text-sm border rounded-l-md focus:outline-none focus:ring-1 focus:ring-sui-blue"
                        />
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(window.location.href)
                            toast.success('Link copied to clipboard!')
                          }}
                          className="bg-sui-navy text-white p-2 rounded-r-md hover:bg-opacity-90"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600 mb-3">Share on social media:</p>
                      <div className="flex space-x-4 justify-center">
                        <a 
                          href={`https://twitter.com/intent/tweet?text=Support this campaign: ${campaign?.name}&url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 bg-[#1DA1F2] text-white rounded-full hover:bg-opacity-90"
                        >
                          <Twitter className="h-5 w-5" />
                        </a>
                        <a 
                          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 bg-[#1877F2] text-white rounded-full hover:bg-opacity-90"
                        >
                          <Facebook className="h-5 w-5" />
                        </a>
                        <a 
                          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 bg-[#0A66C2] text-white rounded-full hover:bg-opacity-90"
                        >
                          <Linkedin className="h-5 w-5" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 text-xs text-center text-gray-500">
                By donating, you agree to our terms of service and privacy policy. All transactions are secure and
                processed on the Sui blockchain.
              </div>
            </div>
          </div>
        </div>
      </main>

    </div>
  )
}
