import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// Enhanced campaign creation with beneficial parties
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      id,
      name,
      description,
      imageUrl,
      goalAmount,
      creator,
      deadline,
      category,
      beneficialParties = [],
      isActive = true,
      currentAmount = "0",
      backerCount = 0,
      distributedAmount = "0",
      withdrawnAmount = "0"
    } = body

    // Validate required fields
    if (!id || !name || !description || !goalAmount || !creator || !deadline || !category) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      )
    }

    // Create or update campaign with enhanced fields
    const campaign = await prisma.campaign.upsert({
      where: { id },
      update: {
        name,
        description,
        imageUrl,
        goalAmount: goalAmount.toString(),
        creator,
        deadline: new Date(deadline * 1000), // Convert epoch to Date
        category,
        beneficialParties,
        isActive,
        currentAmount: currentAmount.toString(),
        backerCount,
        distributedAmount: distributedAmount.toString(),
        withdrawnAmount: withdrawnAmount.toString(),
        updatedAt: new Date()
      },
      create: {
        id,
        name,
        description,
        imageUrl,
        goalAmount: goalAmount.toString(),
        creator,
        deadline: new Date(deadline * 1000),
        category,
        beneficialParties,
        isActive,
        currentAmount: currentAmount.toString(),
        backerCount,
        distributedAmount: distributedAmount.toString(),
        withdrawnAmount: withdrawnAmount.toString()
      }
    })

    // Create or update user profile
    await prisma.user.upsert({
      where: { address: creator },
      update: {},
      create: {
        address: creator,
      }
    })

    return NextResponse.json({
      success: true,
      campaign,
      message: "Campaign created/updated successfully"
    })
  } catch (error) {
    console.error("Error creating/updating enhanced campaign:", error)
    return NextResponse.json(
      { message: "Failed to create/update campaign", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

// Get campaigns with beneficial parties information
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const creator = searchParams.get("creator")
    const category = searchParams.get("category")
    const limit = parseInt(searchParams.get("limit") || "10")
    const offset = parseInt(searchParams.get("offset") || "0")

    const where: any = {}
    
    if (creator) {
      where.creator = creator
    }
    
    if (category) {
      where.category = category
    }

    const campaigns = await prisma.campaign.findMany({
      where,
      include: {
        donations: {
          select: {
            amount: true,
            currency: true,
            createdAt: true,
            isAnonymous: true
          }
        },
        beneficiaryWithdrawals: {
          select: {
            receiver: true,
            amount: true,
            currency: true,
            partyIndex: true,
            notes: true,
            createdAt: true
          }
        },
        createdBy: {
          select: {
            displayName: true,
            profileImage: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset
    })

    return NextResponse.json({
      campaigns,
      total: await prisma.campaign.count({ where })
    })
  } catch (error) {
    console.error("Error fetching enhanced campaigns:", error)
    return NextResponse.json(
      { message: "Failed to fetch campaigns", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

// Update campaign status or beneficial parties
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, updates } = body

    if (!id) {
      return NextResponse.json(
        { message: "Campaign ID is required" },
        { status: 400 }
      )
    }

    const campaign = await prisma.campaign.update({
      where: { id },
      data: {
        ...updates,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      campaign,
      message: "Campaign updated successfully"
    })
  } catch (error) {
    console.error("Error updating campaign:", error)
    return NextResponse.json(
      { message: "Failed to update campaign", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}