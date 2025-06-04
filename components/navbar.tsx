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
    <header className="sticky top-0 z-50 bg-white/50 border-b shadow-sm backdrop-blur-md">
      <div className="w-full max-w-7xl mx-auto px-6 py-1 flex items-center justify-between">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <img src="/TheLogo.png" alt="SuiGives Logo" className="h-24 w-24" />
          <span className="text-2xl font-bold sui-navy-text">SuiGives</span>
        </Link>

        {/* Center: Navigation Links */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/explore" className="text-gray-600 hover:text-sui-navy transition-colors font-medium hover:underline underline-offset-4">
            Explore
          </Link>
          <Link href="/about" className="text-gray-600 hover:text-sui-navy transition-colors font-medium hover:underline underline-offset-4">
            About
          </Link>
          <Link href="/create" className="text-gray-600 hover:text-sui-navy transition-colors font-medium hover:underline underline-offset-4">
            Create
          </Link>
        </nav>

        {/* Right: Wallet and Mobile Menu Button */}
        <div className="flex items-center gap-4">
          {/* Wallet Connect Button */}
          <div className="hidden md:flex">
             <WalletConnectButton variant="navbar" showMessage={false} />
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-sui-navy">
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden px-6 pt-2 pb-4 space-y-1 sm:px-3 bg-white">
          <Link href="/explore" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-sui-navy hover:bg-gray-50 hover:underline underline-offset-4">
            Explore
          </Link>
          <Link href="/about" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-sui-navy hover:bg-gray-50 hover:underline underline-offset-4">
            About
          </Link>
          <Link href="/create" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-sui-navy hover:bg-gray-50 hover:underline underline-offset-4">
            Create
          </Link>
           {/* Mobile Wallet Button */}
           <div className="block md:hidden px-3 py-2">
              <WalletConnectButton variant="navbar" showMessage={false} />
           </div>
        </div>
      )}
    </header>
  )
}
