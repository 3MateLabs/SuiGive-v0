"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DollarSign, Heart, Share2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { projects } from "@/data/projects"

const similarProjects = [
  {
    id: 2,
    title: "Help Ruru Arcade",
    image: "https://pbs.twimg.com/profile_images/1905766835519418368/ppyyNHS9_400x400.jpg",
    progress: 76,
    target: 5000,
    color: "bg-green-500",
  },
  {
    id: 3,
    title: "SuiOnCampus Funding",
    image: "https://pbs.twimg.com/profile_banners/1800057780176338944/1735411752/1500x500",
    progress: 17,
    target: 5000,
    color: "bg-red-500",
  },
  {
    id: 4,
    title: "SuiPlay Grant",
    image: "https://pbs.twimg.com/media/Gp7hNaFawAADKyA?format=jpg&name=4096x4096",
    progress: 47,
    target: 5000,
    color: "bg-yellow-400",
  },
  {
    id: 5,
    title: "Clean Water for All",
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80",
    progress: 22,
    target: 5000,
    color: "bg-red-500",
  },
  {
    id: 6,
    title: "Solar Village Project",
    image: "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=600&q=80",
    progress: 17,
    target: 5000,
    color: "bg-red-500",
  },
  {
    id: 7,
    title: "Art for Hope Initiative",
    image: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=600&q=80",
    progress: 70,
    target: 5000,
    color: "bg-green-500",
  },
]

export default function DonatePage() {
  const router = useRouter()
  const { id } = useParams()
  const [project, setProject] = useState<any>(null)
  const [donationAmount, setDonationAmount] = useState("50")
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pageLoaded, setPageLoaded] = useState(false)

  useEffect(() => {
    // Find the project based on the ID
    const projectId = Number(id)
    const foundProject = projects.find((p) => p.id === projectId)
    setProject(foundProject)

    
    setPageLoaded(true)

    
    window.scrollTo(0, 0)
  }, [id])

  const handleDonate = () => {
    setIsSubmitting(true)

    
    setTimeout(() => {
      setIsSubmitting(false)
      alert(`Thank you for your donation of ${donationAmount} SUI to ${project?.title}!`)
      router.push("/")
    }, 1500)
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sui-navy"></div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${pageLoaded ? "page-enter" : "opacity-0"}`}>
      <Navbar />

      <main className="container max-w-5xl py-8 px-4">
        <Link
          href="/"
          className="inline-flex items-center text-sm font-medium mb-6 text-gray-600 hover:text-sui-navy transition-colors page-transition"
        >
          Back to Home
        </Link>

        <div className="grid md:grid-cols-5 gap-8">
          {/* Project details - 3 columns */}
          <div className="md:col-span-3 space-y-6">
            <div className="bg-white rounded-xl overflow-hidden shadow-sm">
              <div className="relative h-64 w-full">
                <Image src={project.image || "/placeholder.svg"} alt={project.title} fill className="object-cover" />
                <div className="absolute top-4 left-4 bg-white rounded-full p-3">
                  <span className="text-2xl">{project.emoji}</span>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-center text-sm text-gray-500 mb-2">
                  <span className="bg-gray-100 rounded-full px-3 py-1">{project.category}</span>
                  <span className="mx-2">•</span>
                  <span>{project.daysLeft} days left</span>
                </div>

                <h1 className="text-2xl md:text-3xl font-bold mb-4 sui-navy-text">{project.title}</h1>

                <p className="text-gray-700 mb-6">{project.description}</p>

                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">{project.progress}% Funded</span>
                    <span>
                      {project.raised} / {project.goal} SUI
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: `${project.progress}%` }}></div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600 pt-4 border-t">
                  <div>
                    <span className="font-medium">{project.backers}</span> backers
                  </div>
                  <div>
                    Organized by <span className="font-medium">{project.organizer}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-4 sui-navy-text">About This Project</h2>
              <p className="text-gray-700 mb-4">
                Every contribution makes a difference. By supporting this project, you're not just donating funds -
                you're becoming part of a community effort to create positive change.
              </p>
              <p className="text-gray-700">
                All donations are securely processed through the Sui blockchain, ensuring transparency and
                accountability. You can track exactly how your contribution is being used.
              </p>
            </div>
          </div>

          {/* Donation form - 2 columns */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm sticky top-24">
              <h2 className="text-xl font-bold mb-6 sui-navy-text">Make a Donation</h2>

              <div className="space-y-4 mb-6">
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium mb-1">
                    Donation Amount (SUI)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="amount"
                      type="number"
                      value={donationAmount}
                      onChange={(e) => setDonationAmount(e.target.value)}
                      className="pl-10 text-lg font-medium"
                    />
                  </div>
                </div>

                <div className="flex space-x-2">
                  {[10, 50, 100, 500].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setDonationAmount(amount.toString())}
                      className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                        donationAmount === amount.toString()
                          ? "bg-sui-navy text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {amount} SUI
                    </button>
                  ))}
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="anonymous"
                    checked={isAnonymous}
                    onChange={() => setIsAnonymous(!isAnonymous)}
                    className="h-4 w-4 text-sui-navy rounded border-gray-300"
                  />
                  <label htmlFor="anonymous" className="ml-2 text-sm text-gray-700">
                    Donate anonymously
                  </label>
                </div>
              </div>

              <Button
                onClick={handleDonate}
                disabled={isSubmitting}
                className="w-full py-6 bg-sui-navy text-white hover:bg-sui-navy/90 rounded-lg flex items-center justify-center"
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Heart className="mr-2 h-5 w-5" />
                    Donate {donationAmount} SUI
                  </>
                )}
              </Button>

              <div className="mt-4 flex justify-center">
                <button className="flex items-center text-sm text-gray-600 hover:text-sui-navy transition-colors">
                  <Share2 className="mr-1 h-4 w-4" />
                  Share this project
                </button>
              </div>

              <div className="mt-6 text-xs text-center text-gray-500">
                By donating, you agree to our terms of service and privacy policy. All transactions are secure and
                processed on the Sui blockchain.
              </div>
            </div>
          </div>
        </div>
      </main>

      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-8">Similar Crowdfunds</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {similarProjects.map((project) => (
            <div key={project.id} className="bg-white rounded-2xl shadow-lg p-4 relative border border-gray-200 flex flex-col" style={{boxShadow: '0 4px 16px 0 rgba(0, 60, 120, 0.08)'}}>
              <div className="absolute -top-4 left-4 bg-white rounded-full p-2 shadow border"><Heart className="h-5 w-5 text-sui-navy" /></div>
              <h3 className="font-bold text-base mb-2 sui-navy-text">{project.title}</h3>
              <div className="relative h-32 w-full mb-3 rounded-xl overflow-hidden">
                <Image src={project.image} alt={project.title} fill className="object-cover" />
              </div>
              <div className="w-full h-2 rounded-full bg-gray-200 mb-2">
                <div className={`h-2 rounded-full ${project.color}`} style={{width: `${project.progress}%`}}></div>
              </div>
              <div className="flex justify-between items-center text-xs mt-auto">
                <span>Target: $5,000</span>
                <a href={`/donate/${project.id}`}>
                  <Button className="rounded-full px-3 py-1 text-xs bg-sui-navy text-white hover:bg-sui-navy/90 flex items-center">Donate Now</Button>
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />

    </div>
  )
}
