import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { SUI_CONFIG } from "@/lib/sui-config"

// Admin addresses that can manage proposals
const ADMIN_ADDRESSES = [
  SUI_CONFIG.PUBLISHER_ADDRESS,
  SUI_CONFIG.BENEFICIARY_ADDRESS
].map(addr => addr.toLowerCase())

// Helper to check if address is admin
function isAdmin(address: string | null): boolean {
  if (!address) return false
  return ADMIN_ADDRESSES.includes(address.toLowerCase())
}

// GET all proposals (admin only)
export async function GET(request: NextRequest) {
  try {
    // Get admin address from header (should be set by frontend)
    const adminAddress = request.headers.get("x-admin-address")
    
    if (!isAdmin(adminAddress)) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status") // Filter by status

    const proposals = await prisma.campaignProposal.findMany({
      where: status ? { status: status as any } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        proposer: true,
        campaign: true
      }
    })

    return NextResponse.json(proposals)
  } catch (error) {
    console.error("Error fetching proposals:", error)
    return NextResponse.json(
      { message: "Failed to fetch proposals", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

// PATCH to update proposal status (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const adminAddress = request.headers.get("x-admin-address")
    
    if (!isAdmin(adminAddress)) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { proposalId, status, reviewNotes } = body

    if (!proposalId || !status) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses = ["PENDING", "APPROVED", "REJECTED", "REVISION_REQUESTED"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { message: "Invalid status" },
        { status: 400 }
      )
    }

    // Update proposal
    const proposal = await prisma.campaignProposal.update({
      where: { id: proposalId },
      data: {
        status,
        reviewedBy: adminAddress,
        reviewedAt: new Date(),
        reviewNotes
      }
    })

    return NextResponse.json({
      success: true,
      proposal
    })
  } catch (error) {
    console.error("Error updating proposal:", error)
    return NextResponse.json(
      { message: "Failed to update proposal", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

// POST to approve proposal and create campaign (admin only)
export async function POST(request: NextRequest) {
  try {
    const adminAddress = request.headers.get("x-admin-address")
    
    if (!isAdmin(adminAddress)) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { proposalId, campaignId, transactionHash } = body

    if (!proposalId || !campaignId) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      )
    }

    // Get proposal
    const proposal = await prisma.campaignProposal.findUnique({
      where: { id: proposalId }
    })

    if (!proposal) {
      return NextResponse.json(
        { message: "Proposal not found" },
        { status: 404 }
      )
    }

    // Calculate deadline based on duration
    const deadline = new Date()
    deadline.setDate(deadline.getDate() + proposal.duration)

    // Create campaign in database
    const campaign = await prisma.campaign.create({
      data: {
        id: campaignId,
        name: proposal.name,
        description: proposal.description,
        imageUrl: proposal.imageUrl,
        goalAmount: proposal.goalAmount,
        creator: proposal.proposerAddress,
        deadline,
        category: proposal.category,
        currentAmount: "0",
        backerCount: 0
      }
    })

    // Update proposal with campaign ID and approved status
    await prisma.campaignProposal.update({
      where: { id: proposalId },
      data: {
        status: "APPROVED",
        campaignId,
        reviewedBy: adminAddress,
        reviewedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      campaign,
      message: "Campaign created successfully"
    })
  } catch (error) {
    console.error("Error approving proposal:", error)
    return NextResponse.json(
      { message: "Failed to approve proposal", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}