"use client"

import Footer from "@/components/footer"
import Link from "next/link"
import { useState, useRef, useEffect } from "react"
import { useCurrentAccount } from "@mysten/dapp-kit"
import { useRouter } from "next/navigation"
import { toast } from "react-hot-toast"
import { WalletConnectButton } from "@/components/WalletConnectButton"

const categories = [
  "Community Project",
  "Personal Fundraiser",
  "Charity Campaign",
  "Business Startup",
]

export default function SubmitProposalPage() {
  const router = useRouter()
  const currentAccount = useCurrentAccount()
  
  // Form fields
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)
  const [imageUrl, setImageUrl] = useState("")
  const [duration, setDuration] = useState("")
  const [goalAmount, setGoalAmount] = useState("")
  const [manualImageUrl, setManualImageUrl] = useState("")
  
  // Additional proposal fields
  const [proposerEmail, setProposerEmail] = useState("")
  const [proposerPhone, setProposerPhone] = useState("")
  const [projectDetails, setProjectDetails] = useState("")
  const [teamInfo, setTeamInfo] = useState("")
  const [fundUsage, setFundUsage] = useState("")
  
  const [submitting, setSubmitting] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentAccount) {
      toast.error("Please connect your wallet first")
      return
    }
    
    if (!title || !description || !selectedCategory || !duration || !goalAmount || !proposerEmail) {
      toast.error("Please fill in all required fields")
      return
    }
    
    try {
      setSubmitting(true)
      
      // Calculate deadline timestamp (duration in days from approval)
      const durationDays = parseInt(duration, 10)
      if (isNaN(durationDays) || durationDays <= 0) {
        toast.error("Please enter a valid duration in days")
        return
      }
      
      // Convert goal amount to MIST (1 SUI = 10^9 MIST)
      const goalAmountMist = BigInt(parseFloat(goalAmount) * 1_000_000_000).toString()
      
      // Submit proposal to API
      const response = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: title,
          description,
          imageUrl: manualImageUrl || "https://picsum.photos/800/600",
          goalAmount: goalAmountMist,
          duration: durationDays,
          category: selectedCategory,
          proposerAddress: currentAccount.address,
          proposerEmail,
          proposerPhone,
          projectDetails,
          teamInfo,
          fundUsage
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to submit proposal")
      }
      
      toast.success("Proposal submitted successfully! We'll review it soon.")
      router.push("/profile")
    } catch (err: any) {
      console.error("Error submitting proposal:", err)
      toast.error(err.message || "Failed to submit proposal")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-1">
        <div className="max-w-2xl mx-auto py-12 px-4">
          <Link href="/" className="text-gray-600 text-sm mb-8 inline-block">← Back to Home</Link>
          <h1 className="text-3xl font-bold mb-2">Submit Campaign Proposal</h1>
          <p className="text-gray-600 mb-8">
            Submit your campaign idea for review. Our admin team will review your proposal and create the campaign if approved.
          </p>
          
          {/* Info Box */}
          <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h2 className="text-lg font-medium mb-2 text-blue-900">How it works</h2>
            <ol className="text-sm text-blue-800 list-decimal list-inside space-y-1">
              <li>Fill out the proposal form with your campaign details</li>
              <li>Our team will review your submission within 24-48 hours</li>
              <li>You'll receive an email notification about the decision</li>
              <li>If approved, your campaign will go live on the platform</li>
            </ol>
          </div>
          
          {/* Wallet Connection Status */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg border">
            <h2 className="text-lg font-medium mb-2">Wallet Connection</h2>
            <p className="text-sm text-gray-600 mb-3">
              Connect your wallet to link your proposal to your account.
            </p>
            <WalletConnectButton />
          </div>

          <form className="space-y-8" onSubmit={handleSubmit}>
            {/* Basic Information */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Basic Information</h3>
              
              <div>
                <label className="block font-medium mb-2">
                  Campaign Title <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  placeholder="Enter campaign title" 
                  className="w-full border rounded px-4 py-2"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block font-medium mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
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
                <label className="block font-medium mb-2">
                  Brief Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="w-full border rounded px-4 py-2 min-h-[120px]"
                  placeholder="Brief description of your campaign (this will be visible on the campaign page)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block font-medium mb-2">
                  Fundraise Duration (days) <span className="text-red-500">*</span>
                </label>
                <input 
                  type="number" 
                  className="w-full border rounded px-4 py-2"
                  placeholder="30"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  min="1"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Duration will start from the date of approval
                </p>
              </div>
              
              <div>
                <label className="block font-medium mb-2">
                  Goal Amount (sgUSD) <span className="text-red-500">*</span>
                </label>
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
                <label className="block font-medium mb-2">Cover Image URL</label>
                <input
                  type="url"
                  className="w-full border rounded px-4 py-2"
                  placeholder="https://your-image-url.com/image.png"
                  value={manualImageUrl}
                  onChange={e => setManualImageUrl(e.target.value)}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Leave empty to use a default image
                </p>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Contact Information</h3>
              
              <div>
                <label className="block font-medium mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input 
                  type="email" 
                  placeholder="your@email.com" 
                  className="w-full border rounded px-4 py-2"
                  value={proposerEmail}
                  onChange={(e) => setProposerEmail(e.target.value)}
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  We'll use this to notify you about your proposal status
                </p>
              </div>

              <div>
                <label className="block font-medium mb-2">Phone Number (Optional)</label>
                <input 
                  type="tel" 
                  placeholder="+1 234 567 8900" 
                  className="w-full border rounded px-4 py-2"
                  value={proposerPhone}
                  onChange={(e) => setProposerPhone(e.target.value)}
                />
              </div>
            </div>

            {/* Detailed Information */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Detailed Information</h3>
              <p className="text-sm text-gray-600">
                Provide additional details to help us evaluate your proposal
              </p>
              
              <div>
                <label className="block font-medium mb-2">Detailed Project Description</label>
                <textarea
                  className="w-full border rounded px-4 py-2 min-h-[150px]"
                  placeholder="Provide a detailed explanation of your project, its goals, and expected impact..."
                  value={projectDetails}
                  onChange={(e) => setProjectDetails(e.target.value)}
                />
              </div>

              <div>
                <label className="block font-medium mb-2">Team Information</label>
                <textarea
                  className="w-full border rounded px-4 py-2 min-h-[100px]"
                  placeholder="Tell us about your team, experience, and why you're the right people for this project..."
                  value={teamInfo}
                  onChange={(e) => setTeamInfo(e.target.value)}
                />
              </div>

              <div>
                <label className="block font-medium mb-2">Fund Usage Plan</label>
                <textarea
                  className="w-full border rounded px-4 py-2 min-h-[100px]"
                  placeholder="How will you use the funds? Provide a breakdown if possible..."
                  value={fundUsage}
                  onChange={(e) => setFundUsage(e.target.value)}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex flex-col items-center mt-8">
              <button
                type="submit"
                className={`w-full max-w-xs rounded-full bg-sui-navy text-white py-3 text-lg font-medium ${
                  submitting ? "opacity-50 cursor-not-allowed" : "hover:bg-sui-navy/90"
                }`}
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit Proposal"}
              </button>
              <span className="text-xs text-gray-500 mt-2 text-center max-w-md">
                By submitting, you agree that all information provided is accurate and you understand that approval is at the discretion of our admin team
              </span>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  )
}