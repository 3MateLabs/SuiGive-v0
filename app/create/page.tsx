"use client"

import Footer from "@/components/footer"
import Link from "next/link"
import { useState, useRef, useEffect } from "react"
import { useCurrentWallet, ConnectButton, useCurrentAccount } from "@mysten/dapp-kit"
import { useSuiCampaigns } from "@/hooks/useSuiCampaigns"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import { WalletConnectButton } from "@/components/WalletConnectButton"

const categories = [
  "Community Project",
  "Personal Fundraiser",
  "Charity Campaign",
  "Business Startup",
]

export default function CreateCrowdfundPage() {
  const router = useRouter()
  const currentWallet = useCurrentWallet()
  const currentAccount = useCurrentAccount()
  const { createCampaign, loading, error } = useSuiCampaigns()
  
  // Check if wallet is connected
  const isWalletConnected = !!currentWallet?.isConnected && !!currentAccount
  
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState("")
  const [duration, setDuration] = useState("")
  const [goalAmount, setGoalAmount] = useState("")
  const [manualImageUrl, setManualImageUrl] = useState("")
  const dropdownRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside)
    } else {
      document.removeEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showDropdown])

  // Handle image upload to IPFS or another storage service
  const handleImageUpload = async (file: File) => {
    // For demo purposes, we'll just use a placeholder URL
    // In a real app, you would upload to IPFS or another storage service
    setImageUrl(`https://picsum.photos/seed/${file.name}/800/600`)
    return `https://picsum.photos/seed/${file.name}/800/600`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isWalletConnected) {
      toast.error("Please connect your wallet first")
      return
    }
    
    if (!title || !description || !selectedCategory || !duration || !goalAmount) {
      toast.error("Please fill in all required fields")
      return
    }
    
    try {
      // Upload image if selected
      let finalImageUrl = "https://picsum.photos/800/600" // Default image
      if (manualImageUrl) {
        finalImageUrl = manualImageUrl;
      } else if (coverImage) {
        finalImageUrl = await handleImageUpload(coverImage);
      }
      
      // Calculate deadline timestamp (duration in days from now)
      const durationDays = parseInt(duration, 10)
      if (isNaN(durationDays) || durationDays <= 0) {
        toast.error("Please enter a valid duration in days")
        return
      }
      
      const deadlineTimestamp = Math.floor(Date.now() / 1000) + (durationDays * 24 * 60 * 60)
      
      // Convert goal amount to MIST (1 SUI = 10^9 MIST)
      const goalAmountMist = BigInt(parseFloat(goalAmount) * 1_000_000_000)
      
      toast.loading("Creating your campaign...", { id: "create-campaign" })
      
      const result = await createCampaign(
        title,
        description,
        finalImageUrl,
        Number(goalAmountMist),
        deadlineTimestamp,
        selectedCategory
      )
      
      toast.success("Campaign created successfully!", { id: "create-campaign" })
      
      // Redirect to home page after successful creation
      router.push("/")
    } catch (err: any) {
      console.error("Error creating campaign:", err)
      toast.error(err.message || "Failed to create campaign", { id: "create-campaign" })
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-1">
        <div className="max-w-2xl mx-auto py-12 px-4">
          <Link href="/" className="text-gray-600 text-sm mb-8 inline-block"> Back to Home</Link>
          <h1 className="text-3xl font-bold mb-6">Start a new crowdfund</h1>
          
          {/* Wallet Connection Status */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg border">
            <h2 className="text-lg font-medium mb-2">Wallet Connection</h2>
            <p className="text-sm text-gray-600 mb-3">
              You need to connect your Sui wallet to create a campaign. All transactions will be signed using your connected wallet.
            </p>
            <WalletConnectButton />
          </div>
          
          {!isWalletConnected && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
              <p className="text-yellow-800 text-sm">
                You need to connect your wallet to create a campaign. All transactions will be signed using your connected wallet.
              </p>
            </div>
          )}

          <form className="space-y-8" onSubmit={handleSubmit}>
            <div>
              <label className="block font-medium mb-2">Project Title</label>
              <input 
                type="text" 
                placeholder="Enter project title" 
                className="w-full border rounded px-4 py-2"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block font-medium mb-2">Category</label>
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  className="w-full border rounded px-4 py-2 text-left flex justify-between items-center"
                  onClick={() => setShowDropdown((v) => !v)}
                >
                  {selectedCategory || "Select a Category"}
                  <span className="ml-2">▼</span>
                </button>
                {showDropdown && (
                  <div className="absolute left-0 right-0 bg-white border rounded mt-1 z-10">
                    {categories.map((cat) => (
                      <div
                        key={cat}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setSelectedCategory(cat)
                          setShowDropdown(false)
                        }}
                      >
                        {cat}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block font-medium mb-2">Description</label>
              <textarea
                className="w-full border rounded px-4 py-2 min-h-[120px]"
                placeholder="Describe your project and why people should fund it."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block font-medium mb-2">Fundraise Duration (days)</label>
              <input 
                type="number" 
                className="w-full border rounded px-4 py-2"
                placeholder="30"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                min="1"
                required
              />
            </div>
            
            <div>
              <label className="block font-medium mb-2">Goal Amount (sgUSD)</label>
              <input 
                type="number" 
                className="w-full border rounded px-4 py-2"
                placeholder="10"
                value={goalAmount}
                onChange={(e) => setGoalAmount(e.target.value)}
                min="0.000000001"
                step="0.000000001"
                required
              />
            </div>

            <div>
              <label className="block font-medium mb-2">Upload cover image</label>
              <div className="w-full border rounded px-4 py-8 text-center bg-gray-50">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="cover-image-upload"
                  ref={fileInputRef}
                  onChange={e => setCoverImage(e.target.files?.[0] || null)}
                />
                <label htmlFor="cover-image-upload" className="cursor-pointer block">
                  Drag and drop your image or click <span className="text-blue-600 underline" onClick={e => {e.preventDefault();fileInputRef.current?.click();}}>here</span> to browse.
                </label>
                <button
                  type="button"
                  className="mt-4 px-6 py-2 border rounded bg-white hover:bg-gray-100"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Browse Files
                </button>
                {coverImage && <div className="mt-2 text-sm">Selected: {coverImage.name}</div>}
              </div>
              <div className="mt-4">
                <label className="block font-medium mb-1">Or enter image URL</label>
                <input
                  type="url"
                  className="w-full border rounded px-4 py-2"
                  placeholder="https://your-image-url.com/image.png"
                  value={manualImageUrl}
                  onChange={e => setManualImageUrl(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col items-center mt-8">
              <button
                type="submit"
                className={`w-full max-w-xs rounded-full bg-sui-navy text-white py-3 text-lg font-medium ${
                  !isWalletConnected || loading ? "opacity-50 cursor-not-allowed" : "hover:bg-sui-navy/90"
                }`}
                disabled={!isWalletConnected || loading}
              >
                {loading ? "Creating..." : isWalletConnected ? "Create Crowdfund" : "Connect Wallet to Continue"}
              </button>
              <span className="text-xs text-gray-500 mt-2">
                Tip: Review your inputs properly before clicking on "Create Crowdfund"
              </span>
              {error && <p className="text-red-500 mt-2">{error}</p>}
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  )
} 