import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// Record a beneficial party withdrawal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      campaignId,
      receiver,
      amount,
      currency,
      partyIndex,
      notes,
      txHash
    } = body

    // Validate required fields
    if (!campaignId || !receiver || !amount || !currency || partyIndex === undefined) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      )
    }

    // Create withdrawal record
    const withdrawal = await prisma.beneficiaryWithdrawal.create({
      data: {
        campaignId,
        receiver,
        amount: amount.toString(),
        currency,
        partyIndex,
        notes,
        txHash
      }
    })

    // Update campaign withdrawn amount
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId }
    })

    if (campaign) {
      const currentWithdrawn = BigInt(campaign.withdrawnAmount || "0")
      const newWithdrawn = currentWithdrawn + BigInt(amount)
      
      await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          withdrawnAmount: newWithdrawn.toString(),
          updatedAt: new Date()
        }
      })
    }

    return NextResponse.json({
      success: true,
      withdrawal,
      message: "Withdrawal recorded successfully"
    })
  } catch (error) {
    console.error("Error recording withdrawal:", error)
    return NextResponse.json(
      { message: "Failed to record withdrawal", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

// Get withdrawals for a campaign or beneficiary
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const campaignId = searchParams.get("campaignId")
    const receiver = searchParams.get("receiver")

    if (!campaignId && !receiver) {
      return NextResponse.json(
        { message: "Either campaignId or receiver is required" },
        { status: 400 }
      )
    }

    const where: any = {}
    
    if (campaignId) {
      where.campaignId = campaignId
    }
    
    if (receiver) {
      where.receiver = receiver
    }

    const withdrawals = await prisma.beneficiaryWithdrawal.findMany({
      where,
      include: {
        campaign: {
          select: {
            name: true,
            creator: true,
            beneficialParties: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({
      withdrawals,
      total: withdrawals.length
    })
  } catch (error) {
    console.error("Error fetching withdrawals:", error)
    return NextResponse.json(
      { message: "Failed to fetch withdrawals", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}