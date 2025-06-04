"use client"
import Image from "next/image"

export default function HowItWorksSection() {
  return (
    <section className="w-full bg-white py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">How SuiGives Works</h2>
          <div className="text-xs md:text-sm text-gray-500 font-light max-w-xl mx-auto">SuiGives makes it easy to create, fund and track projects with security and complete transparency on the Sui Blockchain</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Step 1 */}
          <div className="flex flex-col items-center text-center">
            <Image src="/how-works-wallet.png" alt="Connect Wallet" width={80} height={80} className="mb-4 rounded-lg object-contain" />
            <div className="text-lg font-semibold mb-1">Connect your Wallet</div>
            <div className="text-xs md:text-sm text-gray-500 font-light">Securely connect your Sui wallet to receive funds and enable transparent transactions.</div>
          </div>
          {/* Step 2 */}
          <div className="flex flex-col items-center text-center">
            <Image src="/how-works-timeline.png" alt="Create Project" width={80} height={80} className="mb-4 rounded-lg object-contain" />
            <div className="text-lg font-semibold mb-1">Create your project</div>
            <div className="text-xs md:text-sm text-gray-500 font-light">Set your funding goal, add details, and launch your project with ease.</div>
          </div>
          {/* Step 3 */}
          <div className="flex flex-col items-center text-center">
            <Image src="/how-works-share.png" alt="Share Campaign" width={80} height={80} className="mb-4 rounded-lg object-contain" />
            <div className="text-lg font-semibold mb-1">Share your campaign</div>
            <div className="text-xs md:text-sm text-gray-500 font-light">Promote your project to the Sui community and beyond for maximum reach.</div>
          </div>
          {/* Step 4 */}
          <div className="flex flex-col items-center text-center">
            <Image src="/how-works-funds.png" alt="Receive Funds" width={80} height={80} className="mb-4 rounded-lg object-contain" />
            <div className="text-lg font-semibold mb-1">Receive & manage funds</div>
            <div className="text-xs md:text-sm text-gray-500 font-light">Track your progress and receive funds directly to your wallet securely.</div>
          </div>
        </div>
        <div className="flex justify-center mt-10">
          <a href="/how-it-works" className="px-6 py-2 rounded-full bg-[#0a2233] text-white font-semibold text-sm hover:bg-[#18344a] transition">Learn more</a>
        </div>
      </div>
    </section>
  )
} 