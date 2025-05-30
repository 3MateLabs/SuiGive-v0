"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X, ChevronDown, Plus, Wallet, Search } from "lucide-react"
import { WalletConnectButton } from "./WalletConnectButton"
import SgUSDBalanceDisplay from "./SgUSDBalanceDisplay"

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
      <div className="w-full max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <img src="/suigives-logo.svg" alt="SuiGives Logo" className="h-8 w-8" />
          <span className="text-2xl font-bold sui-navy-text">SuiGives</span>
        </Link>
        
        {/* Right: Search, Create Campaign, Wallet */}
        <div className="flex items-center space-x-5">
          <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <Search className="h-5 w-5 text-sui-navy" />
          </button>
          
          <div className="h-6 w-px bg-gray-200 mx-1"></div>
          
          <Link href="/create">
            <button className="bg-sui-navy text-white rounded-full px-5 py-2 font-medium hover:bg-sui-navy/90 transition-all duration-200 hover:shadow-md">
              <span className="flex items-center gap-1.5">
                <Plus className="h-4 w-4" />
                Create Campaign
              </span>
            </button>
          </Link>
          
          <div className="h-6 w-px bg-gray-200 mx-1"></div>
          
          <div className="flex items-center gap-5">
            <SgUSDBalanceDisplay />
            <WalletConnectButton variant="navbar" showMessage={false} />
          </div>
        </div>
      </div>
    </header>
  )
}
