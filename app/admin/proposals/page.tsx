"use client"

import { useState, useEffect } from "react"
import { useCurrentAccount } from "@mysten/dapp-kit"
import { useSuiCampaigns } from "@/hooks/useSuiCampaigns"
import { toast } from "react-hot-toast"
import { useRouter } from "next/navigation"
import { SUI_CONFIG } from "@/lib/sui-config"
import Link from "next/link"

interface Proposal {
  id: string
  name: string
  description: string
  imageUrl: string
  goalAmount: string
  duration: number
  category: string
  proposerAddress: string
  proposerEmail: string
  proposerPhone: string | null
  projectDetails: string | null
  teamInfo: string | null
  fundUsage: string | null
  status: "PENDING" | "APPROVED" | "REJECTED" | "REVISION_REQUESTED"
  reviewedBy: string | null
  reviewedAt: string | null
  reviewNotes: string | null
  campaignId: string | null
  createdAt: string
  proposer: {
    address: string
    displayName: string | null
    email: string | null
  } | null
}

const ADMIN_ADDRESSES = [
  SUI_CONFIG.PUBLISHER_ADDRESS.toLowerCase(),
  SUI_CONFIG.BENEFICIARY_ADDRESS.toLowerCase()
]

export default function AdminProposalsPage() {
  const router = useRouter()
  const currentAccount = useCurrentAccount()
  const { createCampaign } = useSuiCampaigns()
  
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null)
  const [reviewNotes, setReviewNotes] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [processing, setProcessing] = useState(false)

  // Check if current user is admin
  const isAdmin = currentAccount && ADMIN_ADDRESSES.includes(currentAccount.address.toLowerCase())

  useEffect(() => {
    if (!currentAccount) return
    
    if (!isAdmin) {
      toast.error("Unauthorized access")
      router.push("/")
      return
    }

    fetchProposals()
  }, [currentAccount, isAdmin, statusFilter])

  const fetchProposals = async () => {
    try {
      setLoading(true)
      const url = statusFilter === "ALL" 
        ? "/api/admin/proposals" 
        : `/api/admin/proposals?status=${statusFilter}`
      
      const response = await fetch(url, {
        headers: {
          "x-admin-address": currentAccount!.address
        }
      })
      
      if (!response.ok) throw new Error("Failed to fetch proposals")
      
      const data = await response.json()
      setProposals(data)
    } catch (error) {
      console.error("Error fetching proposals:", error)
      toast.error("Failed to load proposals")
    } finally {
      setLoading(false)
    }
  }

  const updateProposalStatus = async (proposalId: string, status: string) => {
    try {
      setProcessing(true)
      
      const response = await fetch("/api/admin/proposals", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-address": currentAccount!.address
        },
        body: JSON.stringify({
          proposalId,
          status,
          reviewNotes
        })
      })
      
      if (!response.ok) throw new Error("Failed to update proposal")
      
      toast.success(`Proposal ${status.toLowerCase()}`)
      setReviewNotes("")
      setSelectedProposal(null)
      fetchProposals()
    } catch (error) {
      console.error("Error updating proposal:", error)
      toast.error("Failed to update proposal")
    } finally {
      setProcessing(false)
    }
  }

  const approveAndCreateCampaign = async (proposal: Proposal) => {
    try {
      setProcessing(true)
      toast.loading("Creating campaign on blockchain...", { id: "create-campaign" })
      
      // Calculate deadline
      const deadlineTimestamp = Math.floor(Date.now() / 1000) + (proposal.duration * 24 * 60 * 60)
      
      // Create campaign on blockchain
      const result = await createCampaign(
        proposal.name,
        proposal.description,
        proposal.imageUrl,
        Number(proposal.goalAmount),
        deadlineTimestamp,
        proposal.category
      )
      
      // Extract campaign ID from the result
      const campaignId = result.effects?.created?.[0]?.reference?.objectId
      
      if (!campaignId) throw new Error("Failed to get campaign ID from transaction")
      
      // Update proposal in database
      const response = await fetch("/api/admin/proposals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-address": currentAccount!.address
        },
        body: JSON.stringify({
          proposalId: proposal.id,
          campaignId,
          transactionHash: result.digest
        })
      })
      
      if (!response.ok) throw new Error("Failed to update proposal")
      
      toast.success("Campaign created successfully!", { id: "create-campaign" })
      setSelectedProposal(null)
      fetchProposals()
    } catch (error) {
      console.error("Error creating campaign:", error)
      toast.error("Failed to create campaign", { id: "create-campaign" })
    } finally {
      setProcessing(false)
    }
  }

  const formatAmount = (amount: string) => {
    const sui = Number(amount) / 1_000_000_000
    return `${sui.toFixed(2)} sgUSD`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!currentAccount || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Admin Access Required</h1>
          <p className="text-gray-600">Please connect an admin wallet to access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="mb-8">
          <Link href="/admin" className="text-gray-600 text-sm mb-4 inline-block">← Back to Admin</Link>
          <h1 className="text-3xl font-bold">Campaign Proposals</h1>
          <p className="text-gray-600 mt-2">Review and approve campaign proposals</p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-2">
          {["ALL", "PENDING", "APPROVED", "REJECTED", "REVISION_REQUESTED"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium ${
                statusFilter === status 
                  ? "bg-sui-navy text-white" 
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {status === "ALL" ? "All" : status.replace("_", " ")}
            </button>
          ))}
        </div>

        {/* Proposals List */}
        {loading ? (
          <div className="text-center py-12">Loading proposals...</div>
        ) : proposals.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-500">No proposals found</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {proposals.map((proposal) => (
              <div key={proposal.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-1">{proposal.name}</h3>
                    <p className="text-gray-600 text-sm">
                      {proposal.category} • {formatAmount(proposal.goalAmount)} • {proposal.duration} days
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    proposal.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                    proposal.status === "APPROVED" ? "bg-green-100 text-green-800" :
                    proposal.status === "REJECTED" ? "bg-red-100 text-red-800" :
                    "bg-blue-100 text-blue-800"
                  }`}>
                    {proposal.status.replace("_", " ")}
                  </span>
                </div>

                <p className="text-gray-700 mb-4 line-clamp-2">{proposal.description}</p>

                <div className="border-t pt-4 mt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Proposer:</span>
                      <p className="font-mono">{proposal.proposerAddress.slice(0, 6)}...{proposal.proposerAddress.slice(-4)}</p>
                      <p>{proposal.proposerEmail}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Submitted:</span>
                      <p>{formatDate(proposal.createdAt)}</p>
                    </div>
                  </div>
                </div>

                {proposal.status === "PENDING" && (
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => setSelectedProposal(proposal)}
                      className="px-4 py-2 bg-sui-navy text-white rounded-lg hover:bg-sui-navy/90"
                    >
                      Review
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Review Modal */}
        {selectedProposal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4">Review Proposal</h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold">Campaign Details</h3>
                    <div className="mt-2 space-y-2 text-sm">
                      <p><span className="text-gray-500">Title:</span> {selectedProposal.name}</p>
                      <p><span className="text-gray-500">Category:</span> {selectedProposal.category}</p>
                      <p><span className="text-gray-500">Goal:</span> {formatAmount(selectedProposal.goalAmount)}</p>
                      <p><span className="text-gray-500">Duration:</span> {selectedProposal.duration} days</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold">Description</h3>
                    <p className="mt-2 text-sm text-gray-700">{selectedProposal.description}</p>
                  </div>

                  {selectedProposal.projectDetails && (
                    <div>
                      <h3 className="font-semibold">Project Details</h3>
                      <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{selectedProposal.projectDetails}</p>
                    </div>
                  )}

                  {selectedProposal.teamInfo && (
                    <div>
                      <h3 className="font-semibold">Team Information</h3>
                      <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{selectedProposal.teamInfo}</p>
                    </div>
                  )}

                  {selectedProposal.fundUsage && (
                    <div>
                      <h3 className="font-semibold">Fund Usage Plan</h3>
                      <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{selectedProposal.fundUsage}</p>
                    </div>
                  )}

                  <div>
                    <h3 className="font-semibold">Contact Information</h3>
                    <div className="mt-2 space-y-1 text-sm">
                      <p><span className="text-gray-500">Email:</span> {selectedProposal.proposerEmail}</p>
                      {selectedProposal.proposerPhone && (
                        <p><span className="text-gray-500">Phone:</span> {selectedProposal.proposerPhone}</p>
                      )}
                      <p><span className="text-gray-500">Wallet:</span> {selectedProposal.proposerAddress}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold mb-2">Review Notes</label>
                    <textarea
                      className="w-full border rounded-lg px-4 py-2 min-h-[100px]"
                      placeholder="Add notes about your decision..."
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                    />
                  </div>
                </div>

                <div className="mt-6 flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setSelectedProposal(null)
                      setReviewNotes("")
                    }}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                    disabled={processing}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => updateProposalStatus(selectedProposal.id, "REVISION_REQUESTED")}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    disabled={processing}
                  >
                    Request Revision
                  </button>
                  <button
                    onClick={() => updateProposalStatus(selectedProposal.id, "REJECTED")}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    disabled={processing}
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => approveAndCreateCampaign(selectedProposal)}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    disabled={processing}
                  >
                    {processing ? "Processing..." : "Approve & Create"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}