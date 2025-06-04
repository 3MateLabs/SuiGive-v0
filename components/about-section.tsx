"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import AnimationWrapper from "./animation-wrapper"

export default function AboutSection() {
  return (
    <section id="about" className="flex px-4 sm:px-6 lg:px-8 sui-blue-bg py-12">
      <div className="max-w-[90%] mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <AnimationWrapper id="about">
            <div className="inline-block rounded-lg bg-sui-navy px-3 py-1 text-sm text-white mb-4">About SuiGives</div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 sui-navy-text">
              Revolutionizing Crowdfunding with Web3 Technology
            </h2>
            <p className="text-gray-700 mb-6">
              SuiGives is pioneering a new era of crowdfunding by leveraging Sui blockchain technology to create a
              transparent, secure, and community-driven platform. Our mission is to empower creators, innovators, and
              changemakers by connecting them directly with supporters who believe in their vision.
            </p>
            <p className="text-gray-700 mb-6">
              Founded in 2023, we've already helped fund over 200 projects across healthcare, education, technology, and
              community development. Our platform eliminates traditional barriers and ensures that every contribution
              makes a meaningful impact.
            </p>
            <Button className="rounded-full px-6 py-2 bg-sui-navy text-white hover:bg-sui-navy/90">
              Learn More About SuiGives
            </Button>
          </AnimationWrapper>

          <AnimationWrapper id="about" className="relative h-[400px] rounded-xl overflow-hidden shadow-lg" delay={0.3}>
            <Image src="https://media.istockphoto.com/id/1428262436/vector/crowdfunding-isolated-cartoon-vector-illustrations.jpg?s=612x612&w=0&k=20&c=354FblurcDwrEvmneMTuZrzHNBa4o7K3RTXmfPnI-3A=" alt="About SuiGives" fill className="object-cover" />
          </AnimationWrapper>
        </div>
      </div>
    </section>
  )
}
