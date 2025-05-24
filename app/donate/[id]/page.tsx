"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DollarSign, Heart, Share2, AlertCircle, Wallet, Clock } from "lucide-react"
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

  // Get the campaigns hook
  const { getCampaignDetails, donate, connected, wallet, campaigns, refreshCampaigns } = useSuiCampaigns()

  // Find similar campaigns based on category
  useEffect(() => {
    if (campaigns.length > 0 && campaign) {
      setLoadingSimilar(true);
      // Filter campaigns by same category, excluding the current campaign
      const similar = campaigns
        .filter(c => 
          c.id !== campaign.id && 
          (c.category === campaign.category || Math.random() < 0.3) // Include some random campaigns if not enough in same category
        )
        .slice(0, 3); // Limit to 3 similar campaigns
      
      setSimilarCampaigns(similar);
      setLoadingSimilar(false);
    }
  }, [campaigns, campaign]);

  useEffect(() => {
    // Fetch the campaign details from the blockchain
    const fetchCampaign = async () => {
      try {
        if (typeof id !== 'string') {
          throw new Error('Invalid campaign ID')
        }
        
        const campaignDetails = await getCampaignDetails(id)
        if (!campaignDetails) {
          throw new Error('Campaign not found')
        }
        
        setCampaign(campaignDetails as Campaign)
        setPageLoaded(true)
        
        // After fetching the campaign, load all campaigns to find similar ones
        await refreshCampaigns()
      } catch (err: any) {
        console.error('Error fetching campaign:', err)
        setError(err.message || 'Failed to load campaign')
        setPageLoaded(true)
      }
    }
    
    fetchCampaign()
    window.scrollTo(0, 0)
  }, [id, getCampaignDetails, refreshCampaigns])

  // Calculate progress percentage
  const calculateProgress = () => {
    if (!campaign) return 0
    
    try {
      // Add null checks before BigInt conversion
      if (!campaign.currentAmount || !campaign.goalAmount) {
        return 0;
      }
      
      const currentAmount = BigInt(campaign.currentAmount)
      const goalAmount = BigInt(campaign.goalAmount)
      
      if (goalAmount === BigInt(0)) return 0
      
      // Calculate percentage and convert to number (limited to 100%)
      const percentage = Number((currentAmount * BigInt(100)) / goalAmount)
      return Math.min(percentage, 100)
    } catch (error) {
      console.error('Error calculating progress:', error)
      return 0
    }
  }

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
      await donate(campaign.id, amountInMist, isAnonymous)
      
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
                <Image src={campaign.imageUrl || "/placeholder.svg"} alt={campaign.name} fill className="object-cover" />
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
                  {(() => {
                    const progress = calculateProgress();
                    return (
                      <>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">{progress}% Funded</span>
                          <span>Goal: {campaign?.goalAmount ? (Number(campaign.goalAmount) / 1_000_000_000) : 0} sgUSD</span>
                        </div>
                        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${progress > 66 ? "bg-green-500" : progress > 33 ? "bg-yellow-400" : "bg-red-500"}`}
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600 pt-4 border-t">
                  <div>
                    <span className="font-medium">-</span> backers
                  </div>
                  <div>
                    Organized by <span className="font-medium">{campaign.creator.substring(0, 10)}...</span>
                  </div>
                </div>
              </div>
            </div>

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
                        onDonationComplete={() => {
                          // Refresh campaign details after donation
                          getCampaignDetails(campaign.id).then(updatedCampaign => {
                            if (updatedCampaign) {
                              setCampaign(updatedCampaign as Campaign);
                            }
                          });
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 flex justify-center">
                <button className="flex items-center text-sm text-gray-600 hover:text-sui-navy transition-colors">
                  <Share2 className="mr-1 h-4 w-4" />
                  Share this project
                </button>
              </div>

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
