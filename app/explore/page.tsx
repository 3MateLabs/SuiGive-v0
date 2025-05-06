import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Heart } from "lucide-react"
import { projects } from "@/data/projects"

export default function ExplorePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <section className="w-full bg-gradient-to-b from-[#d6eaff] to-white py-10 px-4">
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-2xl md:text-3xl font-bold mb-2 sui-navy-text">Explore Crowdfunding <span className="inline-block">🖱️</span></h1>
            <p className="text-gray-600 mb-6">For Dreams, Needs, and the Moments That Matter Most.</p>
            <div className="flex justify-center mb-8">
              <input
                type="text"
                placeholder="Search for projects, causes, or keywords..."
                className="w-full max-w-lg px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sui-navy bg-white shadow-sm"
              />
            </div>
            <div className="flex gap-2 justify-center mb-2">
              <button className="px-4 py-2 rounded-full bg-sui-navy text-white font-medium text-sm">Featured</button>
              <button className="px-4 py-2 rounded-full bg-gray-200 text-gray-800 font-medium text-sm">Newest</button>
              <button className="px-4 py-2 rounded-full bg-gray-200 text-gray-800 font-medium text-sm">Near me</button>
            </div>
          </div>
        </section>
        <section className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid md:grid-cols-3 gap-8">
            {/* First card is larger */}
            <div className="md:col-span-3 flex justify-center mb-8">
              <div className="bg-white rounded-2xl shadow-lg p-6 max-w-xl w-full relative border-2 border-[#e3f0fa]" style={{boxShadow: '0 8px 32px 0 rgba(0, 60, 120, 0.10)'}}>
                <div className="absolute -top-5 left-5 bg-white rounded-full p-2 shadow-md border"><Heart className="h-6 w-6 text-sui-navy" /></div>
                <h2 className="font-bold text-lg mb-2 sui-navy-text">{projects[0].title}</h2>
                <div className="relative h-48 w-full mb-4 rounded-xl overflow-hidden">
                  <Image src={projects[0].image} alt={projects[0].title} fill className="object-cover" />
                </div>
                <div className="w-full h-3 rounded-full bg-gray-200 mb-2">
                  <div className={`h-3 rounded-full ${projects[0].color}`} style={{width: `${projects[0].progress}%`}}></div>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>Target: $5,000</span>
                  <a href={`/donate/${projects[0].id}`}>
                    <Button className="rounded-full px-4 py-2 text-sm bg-sui-navy text-white hover:bg-sui-navy/90 flex items-center">Donate Now</Button>
                  </a>
                </div>
              </div>
            </div>
            {/* Other cards */}
            {projects.slice(1).map((project, idx) => (
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
      </main>
      <Footer />
    </div>
  )
} 