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
    <header className="sticky top-0 z-50 bg-white border-b">
      <div className="w-full max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Left: Logo */}
        <Link href="/" className="text-2xl font-bold sui-navy-text">SuiGives</Link>
        {/* Center: Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link href="/how-it-works" className="text-base font-medium sui-navy-text hover:underline">How it works</Link>
          <Link href="/dashboard" className="text-base font-medium sui-navy-text hover:underline">Dashboard</Link>
          <Link href="/mint" className="text-base font-medium sui-navy-text hover:underline">Mint</Link>
          <Link href="/admin" className="text-base font-medium sui-navy-text hover:underline">Admin</Link>
        </nav>
        {/* Right: Search, Create Campaign, Wallet */}
        <div className="flex items-center space-x-4">
          <button className="p-2 rounded-full hover:bg-gray-100">
            <Search className="h-5 w-5 text-sui-navy" />
          </button>
          <Link href="/create">
            <button className="bg-sui-navy text-white rounded-full px-5 py-2 font-medium hover:bg-sui-navy/90 transition">Create Campaign</button>
          </Link>
          <WalletConnectButton variant="navbar" showMessage={false} />
        </div>
      </div>
    </header>
  )
}
