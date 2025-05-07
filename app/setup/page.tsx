"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ConnectButton, useCurrentWallet } from "@mysten/dapp-kit"

const regions = [
  { code: "CN", name: "China", flag: "🇨🇳" },
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "NG", name: "Nigeria", flag: "🇳🇬" },
  // Add more as needed
]

const fundraisingReasons = [
  "Funerals and Memorials",
  "Technology and Consultation",
  "Healthcare",
  "Marriage/Charity",
  "Enterprises",
  "Environment",
  "Music",
  "Arts",
]

export default function SetupPage() {
  const [step, setStep] = useState(1)
  const [displayName, setDisplayName] = useState("")
  const [image, setImage] = useState<File | null>(null)
  const [region, setRegion] = useState(regions[0])
  const [socials, setSocials] = useState({ twitter: "", discord: "" })
  const [theme, setTheme] = useState("light")
  const [reasons, setReasons] = useState<string[]>([])
  const [wallet, setWallet] = useState("")
  const router = useRouter()
  const { currentWallet } = useCurrentWallet()

  // For image preview
  const imageUrl = image ? URL.createObjectURL(image) : null

  function handleReasonToggle(reason: string) {
    setReasons((prev) =>
      prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]
    )
  }

  useEffect(() => {
    if (currentWallet && currentWallet.accounts && currentWallet.accounts.length > 0) {
      const walletAddress = currentWallet.accounts[0].address
      setWallet(walletAddress)
      if (typeof window !== "undefined") {
        localStorage.setItem("suiWallet", walletAddress)
      }
      router.push("/dashboard")
    }
  }, [currentWallet, router])

  return (
    <div className="min-h-screen w-full flex flex-row">
      {/* Left: SuiGives branding */}
      <div className="hidden md:flex flex-col items-center justify-center w-1/2 bg-gradient-to-br from-[#0a2a4d] to-[#1a3c5d]">
        <h2 className="text-5xl text-white font-bold mb-4">SuiGives</h2>
        <p className="text-white text-xl text-center">Decentralized crowdfunding on the Sui Blockchain</p>
      </div>

      {/* Right: Steps */}
      <div className="w-full md:w-1/2 flex flex-col justify-center min-h-screen px-8">
        <div className="max-w-lg w-full mx-auto">
          {/* Stepper Progress */}
          <div className="mb-6 text-xs text-gray-500">
            Step {step} of 7
            <div className="w-full h-2 bg-gray-200 rounded mt-2">
              <div className="h-2 bg-green-500 rounded transition-all" style={{ width: `${(step / 7) * 100}%` }}></div>
            </div>
          </div>

          {/* Step 1: Display Name & Image */}
          {step === 1 && (
            <>
              <h3 className="text-lg font-bold mb-2 text-gray-400">Account Setup</h3>
              <h2 className="text-2xl font-bold mb-2">Set your Display and Image</h2>
              <p className="mb-6 text-gray-500">Follow the simple steps below to start using SuiGives</p>
              <label className="block text-xs text-gray-500 mb-1 mt-4">SET DISPLAY NAME</label>
              <input
                type="text"
                placeholder="Eason.sui"
                className="w-full border rounded px-4 py-3 mb-1"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
              />
              <div className="text-xs text-gray-400 mb-4">Don't have a SuiNS? Get one <a href="#" className="text-blue-600 underline">here</a></div>
              <label className="block text-xs text-gray-500 mb-1 mt-4">SET PROFILE IMAGE</label>
              <div className="w-full border rounded flex flex-col items-center justify-center py-8 mb-2">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="setup-image-upload"
                  onChange={e => setImage(e.target.files?.[0] || null)}
                />
                <label htmlFor="setup-image-upload" className="cursor-pointer inline-block px-6 py-2 border rounded bg-sui-navy text-white hover:bg-sui-navy/90 mb-2">
                  Upload Image
                </label>
                {imageUrl && <img src={imageUrl} alt="Preview" className="rounded-full mt-2 w-16 h-16 object-cover" />}
                <div className="text-xs text-gray-400 mt-2">Drag and drop your image or click <span className="text-blue-600 underline">here</span> to browse.</div>
              </div>
              <div className="flex justify-between mt-8">
                <div />
                <button className="bg-sui-navy text-white px-8 py-2 rounded-full" onClick={() => setStep(2)}>Next &rarr;</button>
              </div>
            </>
          )}

          {/* Step 2: Region */}
          {step === 2 && (
            <>
              <h3 className="text-lg font-bold mb-2 text-gray-400">Account Setup</h3>
              <h2 className="text-2xl font-bold mb-2">Select Region</h2>
              <p className="mb-6 text-gray-500">Where exactly in the world are you located?</p>
              <label className="block text-xs text-gray-500 mb-1 mt-4">SELECT REGION</label>
              <select
                className="w-full border rounded px-4 py-3 mb-8"
                value={region.code}
                onChange={e => setRegion(regions.find(r => r.code === e.target.value) || regions[0])}
              >
                {regions.map(r => (
                  <option key={r.code} value={r.code}>{r.flag} {r.name}</option>
                ))}
              </select>
              <div className="flex justify-between mt-8">
                <button className="text-sui-navy px-4 py-2" onClick={() => setStep(1)}>&larr; Back</button>
                <button className="bg-sui-navy text-white px-8 py-2 rounded-full" onClick={() => setStep(3)}>Next &rarr;</button>
              </div>
            </>
          )}

          {/* Step 3: Socials */}
          {step === 3 && (
            <>
              <h3 className="text-lg font-bold mb-2 text-gray-400">Account Setup</h3>
              <h2 className="text-2xl font-bold mb-2">Link your socials</h2>
              <p className="mb-6 text-gray-500">Connect your social media handles to the platform</p>
              <label className="block text-xs text-gray-500 mb-1 mt-4">X (Formerly Twitter)</label>
              <input
                type="text"
                placeholder="Not entered"
                className="w-full border rounded px-4 py-3 mb-4"
                value={socials.twitter}
                onChange={e => setSocials(s => ({ ...s, twitter: e.target.value }))}
              />
              <label className="block text-xs text-gray-500 mb-1 mt-4">Discord</label>
              <input
                type="text"
                placeholder="Not entered"
                className="w-full border rounded px-4 py-3 mb-4"
                value={socials.discord}
                onChange={e => setSocials(s => ({ ...s, discord: e.target.value }))}
              />
              <div className="flex justify-between mt-8">
                <button className="text-sui-navy px-4 py-2" onClick={() => setStep(2)}>&larr; Back</button>
                <button className="bg-sui-navy text-white px-8 py-2 rounded-full" onClick={() => setStep(4)}>Next &rarr;</button>
              </div>
            </>
          )}

          {/* Step 4: Theme */}
          {step === 4 && (
            <>
              <h3 className="text-lg font-bold mb-2 text-gray-400">Account Setup</h3>
              <h2 className="text-2xl font-bold mb-2">Choose Preferred Theme</h2>
              <div className="flex gap-4 mb-6 mt-6">
                <button
                  className={`flex-1 border rounded px-4 py-3 text-lg ${theme === "light" ? "border-sui-navy bg-gray-50" : ""}`}
                  onClick={() => setTheme("light")}
                >
                  Light Mode
                </button>
                <button
                  className={`flex-1 border rounded px-4 py-3 text-lg ${theme === "dark" ? "border-sui-navy bg-black text-white" : ""}`}
                  onClick={() => setTheme("dark")}
                >
                  Dark Mode
                </button>
              </div>
              <div className="flex justify-between mt-8">
                <button className="text-sui-navy px-4 py-2" onClick={() => setStep(3)}>&larr; Back</button>
                <button className="bg-sui-navy text-white px-8 py-2 rounded-full" onClick={() => setStep(5)}>Next &rarr;</button>
              </div>
            </>
          )}

          {/* Step 5: Fundraising Reasons */}
          {step === 5 && (
            <>
              <h3 className="text-lg font-bold mb-2 text-gray-400">Account Setup</h3>
              <h2 className="text-2xl font-bold mb-2">Reason(s) for fundraising?</h2>
              <p className="mb-6 text-gray-500">Select up to three options in this section</p>
              <div className="flex flex-wrap gap-2 mb-6">
                {fundraisingReasons.map(reason => (
                  <button
                    key={reason}
                    type="button"
                    className={`px-4 py-2 border rounded-full text-sm ${reasons.includes(reason) ? "bg-sui-navy text-white border-sui-navy" : "bg-white"}`}
                    onClick={() => handleReasonToggle(reason)}
                  >
                    {reason}
                  </button>
                ))}
              </div>
              <div className="flex justify-between mt-8">
                <button className="text-sui-navy px-4 py-2" onClick={() => setStep(4)}>&larr; Back</button>
                <button className="bg-sui-navy text-white px-8 py-2 rounded-full" onClick={() => setStep(6)}>Finish &rarr;</button>
              </div>
            </>
          )}

          {/* Step 6: Success (now step 7 is wallet connect) */}
          {step === 6 && (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="mb-6">
                <svg width="64" height="64" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#22c55e"/><path d="M7 13l3 3 7-7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Almost done!</h3>
              <p className="text-gray-600 mb-4 text-center">Now, connect your Sui Wallet to complete your account setup.</p>
              <button className="bg-sui-navy text-white px-8 py-3 rounded-full mt-2 text-lg" onClick={() => setStep(7)}>
                Connect Sui Wallet
              </button>
            </div>
          )}

          {/* Step 7: Connect Wallet */}
          {step === 7 && (
            <div className="flex flex-col items-center justify-center h-full">
              <h2 className="text-2xl font-bold mb-4">Connect your Sui Wallet</h2>
              <p className="text-gray-500 mb-6">Connect your Sui wallet to complete your setup and access your dashboard.</p>
              <ConnectButton />
              {currentWallet && currentWallet.accounts && currentWallet.accounts.length > 0 && (
                <div className="mt-4 text-green-600 font-medium">Wallet connected: {currentWallet.accounts[0].address}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 