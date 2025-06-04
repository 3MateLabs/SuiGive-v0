import Navbar from "@/components/navbar"
import Hero from "@/components/hero"
import NewestEvents from "@/components/newest-events"
import AboutSection from "@/components/about-section"
import HowItWorksSection from "@/components/how-it-works"
import CompletedCrowdfunds from "@/components/completed-crowdfunds"
import Footer from "@/components/footer"
import DashboardChartsWrapper from "@/components/DashboardChartsWrapper"
import TopDonors from "@/components/TopDonors"

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <NewestEvents />
      <DashboardChartsWrapper />
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold mb-8 text-center sui-navy-text">Top Donors</h2>
        <TopDonors />
      </div>
      <AboutSection />
      <HowItWorksSection />
      <CompletedCrowdfunds />
      <Footer />
    </div>
  )
}
