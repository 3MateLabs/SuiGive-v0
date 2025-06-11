import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      name,
      description,
      imageUrl,
      goalAmount,
      duration,
      category,
      proposerAddress,
      proposerEmail,
      proposerPhone,
      projectDetails,
      teamInfo,
      fundUsage
    } = body

    // Validate required fields
    if (!name || !description || !goalAmount || !duration || !category || !proposerAddress || !proposerEmail) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      )
    }

    // Create or update user profile
    await prisma.user.upsert({
      where: { address: proposerAddress },
      update: {
        email: proposerEmail,
      },
      create: {
        address: proposerAddress,
        email: proposerEmail,
      }
    })

    // Create proposal
    const proposal = await prisma.campaignProposal.create({
      data: {
        name,
        description,
        imageUrl: imageUrl || "https://picsum.photos/800/600",
        goalAmount: goalAmount.toString(),
        duration: parseInt(duration),
        category,
        proposerAddress,
        proposerEmail,
        proposerPhone,
        projectDetails,
        teamInfo,
        fundUsage,
        status: "PENDING"
      }
    })

    return NextResponse.json({
      success: true,
      proposalId: proposal.id,
      message: "Proposal submitted successfully"
    })
  } catch (error) {
    console.error("Error creating proposal:", error)
    return NextResponse.json(
      { message: "Failed to create proposal", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

// GET endpoint to fetch user's proposals
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const proposerAddress = searchParams.get("address")
    
    if (!proposerAddress) {
      return NextResponse.json(
        { message: "Address parameter is required" },
        { status: 400 }
      )
    }

    const proposals = await prisma.campaignProposal.findMany({
      where: { proposerAddress },
      orderBy: { createdAt: "desc" },
      include: {
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