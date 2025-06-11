"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X, ChevronDown, Plus, Wallet, Search, User, Shield } from "lucide-react"
import { WalletConnectButton } from "./WalletConnectButton"
import { useCurrentAccount } from "@mysten/dapp-kit"
import { SUI_CONFIG } from "@/lib/sui-config"

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const currentAccount = useCurrentAccount()
  
  // Check if user is admin
  const isAdmin = useMemo(() => {
    if (!currentAccount) return false
    const adminAddresses = [
      SUI_CONFIG.PUBLISHER_ADDRESS.toLowerCase(),
      SUI_CONFIG.BENEFICIARY_ADDRESS.toLowerCase()
    ]
    return adminAddresses.includes(currentAccount.address.toLowerCase())
  }, [currentAccount])

  return (
    <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
      <div className="w-full max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <img src="/images/TheLogo.png" alt="SuiGives Logo" className="h-8 w-8" />
          <span className="text-2xl font-bold sui-navy-text">SuiGives</span>
        </Link>
        
        {/* Right: Search, Create Campaign, Wallet */}
        <div className="flex items-center space-x-5">
          <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <Search className="h-5 w-5 text-sui-navy" />
          </button>
          
          <div className="h-6 w-px bg-gray-200 mx-1"></div>
          
          {isAdmin ? (
            <Link href="/create">
              <button className="bg-sui-navy text-white rounded-full px-5 py-2 font-medium hover:bg-sui-navy/90 transition-all duration-200 hover:shadow-md">
                <span className="flex items-center gap-1.5">
                  <Plus className="h-4 w-4" />
                  Create Campaign
                </span>
              </button>
            </Link>
          ) : (
            <Link href="/submit-proposal">
              <button className="bg-sui-navy text-white rounded-full px-5 py-2 font-medium hover:bg-sui-navy/90 transition-all duration-200 hover:shadow-md">
                <span className="flex items-center gap-1.5">
                  <Plus className="h-4 w-4" />
                  Submit Proposal
                </span>
              </button>
            </Link>
          )}
          
          <div className="h-6 w-px bg-gray-200 mx-1"></div>
          
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link href="/admin">
                <button className="p-2 rounded-full hover:bg-gray-100 transition-colors" title="Admin Panel">
                  <Shield className="h-5 w-5 text-sui-navy" />
                </button>
              </Link>
            )}
            <Link href="/dashboard">
              <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                <User className="h-5 w-5 text-sui-navy" />
              </button>
            </Link>
            <WalletConnectButton variant="navbar" showMessage={false} />
          </div>
        </div>
      </div>
    </header>
  )
}
