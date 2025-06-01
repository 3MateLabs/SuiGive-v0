"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X, ChevronDown, Plus, Wallet, Search } from "lucide-react"
import { WalletConnectButton } from "./WalletConnectButton"

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="z-50 bg-white">
      <div className="w-full max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <img src="/suigives-logo.svg" alt="SuiGives Logo" className="h-8 w-8" />
          <span className="text-2xl font-bold sui-navy-text">SuiGives</span>
        </Link>

        {/* Center: Navigation Links */}
        <nav className="hidden md:flex items-center space-x-10 text-sui-navy text-base">
          <Link href="/explore" className="relative group hover:opacity-90 transition-opacity font-medium">
            Explore
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-sui-navy transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-in-out"></span>
          </Link>
          <Link href="/about" className="relative group hover:opacity-90 transition-opacity font-medium">
            About
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-sui-navy transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-in-out"></span>
          </Link>
          <Link href="/create" className="relative group hover:opacity-90 transition-opacity font-medium">
             Create
             <span className="absolute bottom-0 left-0 w-full h-0.5 bg-sui-navy transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-in-out"></span>
          </Link>
        </nav>
        
        {/* Right Group: Wallet Button and Mobile Menu Button */}
        <div className="flex items-center gap-x-4">
          {/* Wallet Button */}
          <WalletConnectButton variant="createCampaign" showMessage={false} className="text-sui-navy text-base"/>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-sui-navy">
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu - needs adjustment */}
      {isMenuOpen && (
        <div className="md:hidden bg-white px-6 py-4 border-b">
          <div className="flex flex-col space-y-4">
            <Link href="/explore" className="text-sui-navy hover:opacity-90 transition-opacity" onClick={() => setIsMenuOpen(false)}>Explore</Link>
            <Link href="/about" className="text-sui-navy hover:opacity-90 transition-opacity" onClick={() => setIsMenuOpen(false)}>About</Link>
            <Link href="/create" className="text-sui-navy hover:opacity-90 transition-opacity flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
              <Plus className="h-4 w-4" /> Create Campaign
            </Link>
            {/* Wallet button might need different handling in mobile */}
          </div>
        </div>
      )}
    </header>
  )
}
