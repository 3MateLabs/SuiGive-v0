"use client"

import Footer from "@/components/footer"
import Link from "next/link"
import { useState, useRef, useEffect } from "react"

const categories = [
  "Community Project",
  "Personal Fundraiser",
  "Charity Campaign",
  "Business Startup",
]

export default function CreateCrowdfundPage() {
  const [selectedCategory, setSelectedCategory] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside)
    } else {
      document.removeEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showDropdown])

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-1">
        <div className="max-w-2xl mx-auto py-12 px-4">
          <Link href="/" className="text-gray-600 text-sm mb-8 inline-block"> Back to Home</Link>
          <h1 className="text-3xl font-bold mb-10">Start a new crowdfund</h1>

          <form className="space-y-8" onSubmit={e => e.preventDefault()}>
            <div>
              <label className="block font-medium mb-2">Project Title</label>
              <input type="text" placeholder="Enter project title" className="w-full border rounded px-4 py-2" />
            </div>

            <div>
              <label className="block font-medium mb-2">Category</label>
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  className="w-full border rounded px-4 py-2 text-left flex justify-between items-center"
                  onClick={() => setShowDropdown((v) => !v)}
                >
                  {selectedCategory || "Select a Category"}
                  <span className="ml-2">▼</span>
                </button>
                {showDropdown && (
                  <div className="absolute left-0 right-0 bg-white border rounded mt-1 z-10">
                    {categories.map((cat) => (
                      <div
                        key={cat}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setSelectedCategory(cat)
                          setShowDropdown(false)
                        }}
                      >
                        {cat}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <textarea
                className="w-full border rounded px-4 py-2 min-h-[120px]"
                placeholder="Describe your project and why people should fund it."
              />
            </div>

            <div>
              <label className="block font-medium mb-2">Fundraise Duration</label>
              <input type="text" className="w-full border rounded px-4 py-2" />
            </div>

            <div>
              <label className="block font-medium mb-2">Upload cover image</label>
              <div className="w-full border rounded px-4 py-8 text-center bg-gray-50">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="cover-image-upload"
                  ref={fileInputRef}
                  onChange={e => setCoverImage(e.target.files?.[0] || null)}
                />
                <label htmlFor="cover-image-upload" className="cursor-pointer block">
                  Drag and drop your image or click <span className="text-blue-600 underline" onClick={e => {e.preventDefault();fileInputRef.current?.click();}}>here</span> to browse.
                </label>
                <button
                  type="button"
                  className="mt-4 px-6 py-2 border rounded bg-white hover:bg-gray-100"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Browse Files
                </button>
                {coverImage && <div className="mt-2 text-sm">Selected: {coverImage.name}</div>}
              </div>
            </div>

            <div>
              <label className="block font-medium mb-2">Destination Wallet</label>
              <input type="text" placeholder="Enter your Sui Wallet address" className="w-full border rounded px-4 py-2" />
            </div>

            <div className="flex flex-col items-center mt-8">
              <button
                type="submit"
                className="w-full max-w-xs rounded-full bg-sui-navy text-white py-3 text-lg font-medium hover:bg-sui-navy/90"
              >
                Create Crowdfund
              </button>
              <span className="text-xs text-gray-500 mt-2">Tip: Review your inputs properly before clicking on "Create Crowdfund"</span>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  )
} 