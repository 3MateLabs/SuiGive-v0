"use client"
import Image from "next/image"

export default function HowItWorksSection() {
  return (
    <section className="w-full bg-white px-4 py-12">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
        <p className="text-gray-600 mb-12 max-w-3xl mx-auto">
          Our platform makes it easy to create, fund, and track projects with complete transparency and security on the Sui blockchain.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Step 1: Connect Your Wallet */}
          <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100">
            <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              {/* Placeholder for Icon 1 */}
              <Image src="/how-works-wallet.png" alt="Connect Wallet Icon" width={24} height={24} />
            </div>
            <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
            <p className="text-sm text-gray-600">
              Link your Sui wallet to our platform to start contributing to projects or create
              your own fundraising campaign.
            </p>
          </div>

          {/* Step 2: Create or Support */}
          <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100">
            <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
               {/* Placeholder for Icon 2 */}
               <Image src="/how-works-timeline.png" alt="Create Project Icon" width={24} height={24} />
            </div>
            <h3 className="text-lg font-semibold mb-2">Create or Support</h3>
            <p className="text-sm text-gray-600">
              Launch your own project with detailed information or browse existing
              campaigns to support causes you care about.
            </p>
          </div>

          {/* Step 3: Community Engagement */}
          <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100">
            <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
               {/* Placeholder for Icon 3 */}
               <Image src="/how-works-share.png" alt="Share Campaign Icon" width={24} height={24} />
            </div>
            <h3 className="text-lg font-semibold mb-2">Community Engagement</h3>
            <p className="text-sm text-gray-600">
              Engage with the community, share updates, and build a network of
              supporters passionate about your cause.
            </p>
          </div>

          {/* Step 4: Transparent Tracking */}
          <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100">
            <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
               {/* Placeholder for Icon 4 */}
               <Image src="/how-works-funds.png" alt="Receive Funds Icon" width={24} height={24} />
            </div>
            <h3 className="text-lg font-semibold mb-2">Transparent Tracking</h3>
            <p className="text-sm text-gray-600">
              Track the progress of your contributions or project funding with
              complete transparency on the Sui blockchain.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
} 