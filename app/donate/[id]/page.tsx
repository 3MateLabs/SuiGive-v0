"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DollarSign, Heart, Share2, AlertCircle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { useSuiCampaigns } from "@/hooks/useSuiCampaigns"
import { Campaign } from "@/lib/sui-campaigns"
import { toast } from "react-hot-toast"
import { formatDistanceToNow } from "date-fns"

const similarProjects = [
  {
    id: 2,
    title: "Help Ruru Arcade",
    image: "https://pbs.twimg.com/profile_images/1905766835519418368/ppyyNHS9_400x400.jpg",
    progress: 76,
    target: 5000,
    color: "bg-green-500",
  },
  {
    id: 3,
    title: "SuiOnCampus Funding",
    image: "https://pbs.twimg.com/profile_banners/1800057780176338944/1735411752/1500x500",
    progress: 17,
    target: 5000,
    color: "bg-red-500",
  },
  {
    id: 4,
    title: "SuiPlay Grant",
    image: "https://pbs.twimg.com/media/Gp7hNaFawAADKyA?format=jpg&name=4096x4096",
    progress: 47,
    target: 5000,
    color: "bg-yellow-400",
  },
  {
    id: 5,
    title: "Clean Water for All",
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80",
    progress: 22,
    target: 5000,
    color: "bg-red-500",
  },
  {
    id: 6,
    title: "Solar Village Project",
    image: "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=600&q=80",
    progress: 17,
    target: 5000,
    color: "bg-red-500",
  },
  {
    id: 7,
    title: "Art for Hope Initiative",
    image: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=600&q=80",
    progress: 70,
    target: 5000,
    color: "bg-green-500",
  },
]

export default function DonatePage() {
  const router = useRouter()
  const { id } = useParams()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [donationAmount, setDonationAmount] = useState("50")
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pageLoaded, setPageLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get the campaigns hook
  const { getCampaignDetails, donate, connected, wallet } = useSuiCampaigns()

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
        
        setCampaign(campaignDetails)
        setPageLoaded(true)
      } catch (err: any) {
        console.error('Error fetching campaign:', err)
        setError(err.message || 'Failed to load campaign')
        setPageLoaded(true)
      }
    }
    
    fetchCampaign()
    window.scrollTo(0, 0)
  }, [id, getCampaignDetails])

  // Calculate progress percentage
  const calculateProgress = () => {
    if (!campaign) return 0
    
    try {
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
      toast.error('Please connect your wallet first')
      return
    }
    
    if (!campaign) {
      toast.error('Campaign not found')
      return
    }
    
    if (!donationAmount || parseFloat(donationAmount) <= 0) {
      toast.error('Please enter a valid donation amount')
      return
    }
    
    setIsSubmitting(true)
    toast.loading('Processing your donation...', { id: 'donation' })
    
    try {
      // Convert SUI to MIST for the blockchain
      const amountInMist = suiToMist(donationAmount)
      
      // Call the donate function from the hook
      const result = await donate(campaign.id, amountInMist, isAnonymous)
      
      toast.success(`Thank you for your donation of ${donationAmount} SUI!`, { id: 'donation' })
      
      // Redirect to home page after successful donation
      setTimeout(() => {
        router.push('/')
      }, 2000)
    } catch (err: any) {
      console.error('Error donating:', err)
      toast.error(err.message || 'Failed to process donation', { id: 'donation' })
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
                          <span>Goal: {Number(campaign.goalAmount) / 1_000_000_000} SUI</span>
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
              <h2 className="text-xl font-bold mb-6 sui-navy-text">Make a Donation</h2>

              <div className="space-y-4 mb-6">
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium mb-1">
                    Donation Amount (SUI)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="amount"
                      type="number"
                      value={donationAmount}
                      onChange={(e) => setDonationAmount(e.target.value)}
                      className="pl-10 text-lg font-medium"
                    />
                  </div>
                </div>

                <div className="flex space-x-2">
                  {[10, 50, 100, 500].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setDonationAmount(amount.toString())}
                      className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                        donationAmount === amount.toString()
                          ? "bg-sui-navy text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {amount} SUI
                    </button>
                  ))}
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="anonymous"
                    checked={isAnonymous}
                    onChange={() => setIsAnonymous(!isAnonymous)}
                    className="h-4 w-4 text-sui-navy rounded border-gray-300"
                  />
                  <label htmlFor="anonymous" className="ml-2 text-sm text-gray-700">
                    Donate anonymously
                  </label>
                </div>
              </div>

              <Button
                onClick={handleDonate}
                disabled={isSubmitting}
                className="w-full py-6 bg-sui-navy text-white hover:bg-sui-navy/90 rounded-lg flex items-center justify-center"
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Heart className="mr-2 h-5 w-5" />
                    Donate {donationAmount} SUI
                  </>
                )}
              </Button>

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

      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-8">Similar Crowdfunds</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {similarProjects.map((project) => (
            <div key={project.id} className="bg-white rounded-2xl shadow-lg p-4 relative border border-gray-200 flex flex-col" style={{boxShadow: '0 4px 16px 0 rgba(0, 60, 120, 0.08)'}}>
              <div className="absolute -top-4 left-4 bg-white rounded-full p-2 shadow border"><Heart className="h-5 w-5 text-sui-navy" /></div>
              <h3 className="font-bold text-base mb-2 sui-navy-text">{project.title}</h3>
              <div className="relative h-32 w-full mb-3 rounded-xl overflow-hidden">
                <Image src={project.image} alt={project.title} fill className="object-cover" />
              </div>
              <div className="w-full h-2 rounded-full bg-gray-200 mb-2">
                <div className={`h-2 rounded-full ${project.color}`} style={{width: `${project.progress}%`}}></div>
              </div>
              <div className="flex justify-between items-center text-xs mt-auto">
                <span>Target: $5,000</span>
                <a href={`/donate/${project.id}`}>
                  <Button className="rounded-full px-3 py-1 text-xs bg-sui-navy text-white hover:bg-sui-navy/90 flex items-center">Donate Now</Button>
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />

    </div>
  )
}
