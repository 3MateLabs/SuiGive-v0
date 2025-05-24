"use client"
import Image from "next/image"
import Link from "next/link"

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Top nav */}
      <div className="w-full max-w-6xl mx-auto pt-6 px-4">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">&larr; Back to Home</Link>
      </div>
      {/* Heading */}
      <div className="w-full max-w-2xl mx-auto text-center mt-4 mb-2 px-4">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">How SuiGives Works</h1>
        <div className="text-xs md:text-sm text-gray-500 font-light mb-2">SuiGives makes it easy to create, fund and track projects with security and complete transparency<br />on the Sui Blockchain</div>
      </div>
      {/* Steps */}
      <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 mt-8 px-4">
        {/* Step 1 */}
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="flex-1">
            <div className="text-xl font-bold mb-2">1. Connect your Wallet</div>
            <div className="text-xs md:text-sm text-gray-500 font-light mb-4">Connect your Sui wallet to receive funds directly. Our platform leverages blockchain technology to ensure secure, transparent transactions with minimal fees.</div>
            <ul className="space-y-2 mb-2">
              <li className="flex items-center text-sm text-gray-700"><span className="text-green-500 mr-2">✔</span> Secure wallet integration</li>
              <li className="flex items-center text-sm text-gray-700"><span className="text-green-500 mr-2">✔</span> Transparent transaction history</li>
              <li className="flex items-center text-sm text-gray-700"><span className="text-green-500 mr-2">✔</span> Lower fees compared to traditional platforms</li>
            </ul>
          </div>
          <div className="flex-shrink-0 w-full md:w-48 flex justify-center items-center">
            <Image src="/how-works-wallet.png" alt="Connect Wallet" width={180} height={180} className="rounded-lg object-contain" />
          </div>
        </div>
        {/* Step 2 */}
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="flex-shrink-0 w-full md:w-48 flex justify-center items-center order-2 md:order-1">
            <Image src="/how-works-timeline.png" alt="Project Timeline" width={180} height={180} className="rounded-lg object-contain" />
          </div>
          <div className="flex-1 order-1 md:order-2">
            <div className="text-xl font-bold mb-2">2. Create your project</div>
            <div className="text-xs md:text-sm text-gray-500 font-light mb-4">To create your crowdfunding project, fill in all the necessary details including your funding goal, project description, timeline, and add compelling images or videos to showcase your idea.</div>
            <ul className="space-y-2 mb-2">
              <li className="flex items-center text-sm text-gray-700"><span className="text-green-500 mr-2">✔</span> Easy-to-use project creation interface</li>
              <li className="flex items-center text-sm text-gray-700"><span className="text-green-500 mr-2">✔</span> Multiple category options for your project</li>
              <li className="flex items-center text-sm text-gray-700"><span className="text-green-500 mr-2">✔</span> Customizable funding goals and timelines</li>
            </ul>
          </div>
        </div>
        {/* Step 3 */}
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="flex-1">
            <div className="text-xl font-bold mb-2">3. Share your campaign</div>
            <div className="text-xs md:text-sm text-gray-500 font-light mb-4">Once your project is live, share it with your network and the wider Sui community. Use our built-in social sharing tools to maximize your project's reach.</div>
            <ul className="space-y-2 mb-2">
              <li className="flex items-center text-sm text-gray-700"><span className="text-green-500 mr-2">✔</span> Integrated social media sharing</li>
              <li className="flex items-center text-sm text-gray-700"><span className="text-green-500 mr-2">✔</span> Project discovery features on our platform</li>
              <li className="flex items-center text-sm text-gray-700"><span className="text-green-500 mr-2">✔</span> Community engagement tools</li>
            </ul>
          </div>
          <div className="flex-shrink-0 w-full md:w-48 flex justify-center items-center">
            <Image src="/how-works-share.png" alt="Share Campaign" width={180} height={180} className="rounded-lg object-contain" />
          </div>
        </div>
        {/* Step 4 */}
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="flex-shrink-0 w-full md:w-48 flex justify-center items-center order-2 md:order-1">
            <Image src="/how-works-funds.png" alt="Receive Funds" width={180} height={180} className="rounded-lg object-contain" />
          </div>
          <div className="flex-1 order-1 md:order-2">
            <div className="text-xl font-bold mb-2">4. Receive and manage funds</div>
            <div className="text-xs md:text-sm text-gray-500 font-light mb-4">As contributions come in, you'll see real-time updates on your funding progress. Funds are securely held and transferred directly to your wallet when your campaign reaches its goal or deadline.</div>
            <ul className="space-y-2 mb-2">
              <li className="flex items-center text-sm text-gray-700"><span className="text-green-500 mr-2">✔</span> Real-time funding updates</li>
              <li className="flex items-center text-sm text-gray-700"><span className="text-green-500 mr-2">✔</span> Secure fund management</li>
              <li className="flex items-center text-sm text-gray-700"><span className="text-green-500 mr-2">✔</span> Transparent distribution of funds</li>
            </ul>
          </div>
        </div>
      </div>
      {/* Call to action */}
      <div className="w-full max-w-2xl mx-auto text-center mt-12 mb-8 px-4">
        <div className="italic text-gray-600 mb-4">Ready to start your project?</div>
        <Link href="/create">
          <button className="px-8 py-3 rounded-full bg-[#0a2233] text-white font-semibold text-lg hover:bg-[#18344a] transition">Start a new crowdfund</button>
        </Link>
      </div>
      {/* Footer */}
      <footer className="bg-[#0a2233] text-white py-12 mt-auto">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="text-2xl font-bold mb-2">SuiGives</div>
            <div className="text-sm text-gray-300 mb-4">Learn ipsum dolor sit amet, consectetur adipiscing elit. Etiam euismod tempor dolor, id sodales leo dictum sit amet. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</div>
          </div>
          <div>
            <div className="font-semibold mb-2">Quick Links</div>
            <ul className="space-y-1 text-sm text-gray-300">
              <li>Fundraising Tips</li>
              <li>Fundraising Tips</li>
              <li>Fundraising Tips</li>
              <li>Fundraising Tips</li>
            </ul>
          </div>
          <div>
            <div className="font-semibold mb-2">Resources</div>
            <ul className="space-y-1 text-sm text-gray-300">
              <li>Fundraising Tips</li>
              <li>Fundraising Tips</li>
              <li>Fundraising Tips</li>
              <li>Fundraising Tips</li>
              <li>Fundraising Tips</li>
            </ul>
          </div>
          <div>
            <div className="font-semibold mb-2">About</div>
            <ul className="space-y-1 text-sm text-gray-300">
              <li>Fundraising Tips</li>
              <li>Fundraising Tips</li>
              <li>Fundraising Tips</li>
              <li>Fundraising Tips</li>
              <li>Fundraising Tips</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  )
} 