import Navbar from "@/components/navbar"
import Hero from "@/components/hero"
import NewestEvents from "@/components/newest-events"
import AboutSection from "@/components/about-section"
import HowItWorksSection from "@/components/how-it-works"
import CompletedCrowdfunds from "@/components/completed-crowdfunds"
import Footer from "@/components/footer"
import DashboardChartsWrapper from "@/components/DashboardChartsWrapper"

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <NewestEvents />
      <DashboardChartsWrapper />
      <AboutSection />
      <HowItWorksSection />
      <CompletedCrowdfunds />
      <Footer />
    </div>
  )
}
