"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X, ChevronDown, Plus } from "lucide-react"

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold sui-navy-text">SuiGives</span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            <Link href="/create" className="flex items-center text-sm font-medium sui-navy-text py-2 px-3 rounded-md hover:bg-gray-100">
              Start a new crowdfund
            </Link>
            <Link href="/dashboard?tab=donations">
              <Button className="bg-sui-navy text-white hover:bg-sui-navy/90 rounded-md flex items-center">
                <Plus className="mr-1 h-4 w-4" />
                Donations
              </Button>
            </Link>
            <Link href="/how-it-works" className="flex items-center text-sm font-medium sui-navy-text py-2 px-3 rounded-md hover:bg-gray-100">
              How it works?
            </Link>
          </nav>

          <div className="hidden md:block">
            <Link href="/setup">
              <Button className="rounded-full bg-sui-navy text-white hover:bg-sui-navy/90 px-6">Get Started</Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 focus:outline-none"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              href="/create"
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-100"
              onClick={() => setIsMenuOpen(false)}
            >
              Start a new crowdfund
            </Link>
            <Link
              href="/dashboard?tab=donations"
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-100"
              onClick={() => setIsMenuOpen(false)}
            >
              Donations
            </Link>
            <Link
              href="/how-it-works"
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-100"
              onClick={() => setIsMenuOpen(false)}
            >
              How it works?
            </Link>
            <div className="mt-4 px-3">
              <Link href="/setup">
                <Button className="w-full rounded-full bg-sui-navy text-white hover:bg-sui-navy/90">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
