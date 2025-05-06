"use client"

import { Button } from "@/components/ui/button"
import Image from "next/image"
import { MousePointer, Star } from "lucide-react"
import { useEffect, useState } from "react"
import AnimationWrapper from "./animation-wrapper"
import Link from "next/link"

export default function Hero() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <section className="sui-blue-bg py-16 md:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Floating cards - smaller size */}


      {/* Freedom banner */}
      <AnimationWrapper className="max-w-xs mx-auto mb-8">
        <div className="bg-black text-white rounded-full py-2 px-4 flex items-center justify-center pulse">
          <Star className="h-4 w-4 mr-2 fill-white" />
          <span className="text-sm">Fund with Freedom!</span>
          <Star className="h-4 w-4 ml-2 fill-white" />
        </div>
      </AnimationWrapper>

      <div className="max-w-4xl mx-auto text-center relative z-20">
        <AnimationWrapper
          className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 sui-navy-text font-inter"
          delay={0.2}
          animationClass="fade-up"
        >
          <h1>
            Crowdfunding by the community,
            <br />
            for the community
          </h1>
        </AnimationWrapper>

        <AnimationWrapper
          className="text-lg md:text-l sui-navy-text mb-10 max-w-5xl mx-auto font-thin"
          delay={0.4}
          animationClass="fade-up"
        >
          Empowering the Sui community to come together, unite their efforts, raise support, and create a lasting impact
          for the ecosystem, one contribution at a time, driving innovation and growth within the Sui network.
        </AnimationWrapper>

        <AnimationWrapper className="flex justify-center" delay={0.6} animationClass="fade-up">
          <Link href="/explore" className="page-transition">
            <Button className="rounded-full px-8 py-6 text-lg bg-white text-sui-navy hover:bg-gray-100 flex items-center shadow-neon-button">
              Explore Crowdfunding
              <MousePointer className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </AnimationWrapper>


      </div>
    </section>
  )
}
