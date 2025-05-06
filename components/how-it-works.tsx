"use client"

import { Wallet, Upload, Users, CheckCircle } from "lucide-react"
import AnimationWrapper from "./animation-wrapper"

export default function HowItWorks() {
  const steps = [
    {
      icon: <Wallet className="h-8 w-8" />,
      title: "Connect Your Wallet",
      description:
        "Link your Sui wallet to our platform to start contributing to projects or create your own fundraising campaign.",
    },
    {
      icon: <Upload className="h-8 w-8" />,
      title: "Create or Support",
      description:
        "Launch your own project with detailed information or browse existing campaigns to support causes you care about.",
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Community Engagement",
      description:
        "Engage with the community, share updates, and build a network of supporters passionate about your cause.",
    },
    {
      icon: <CheckCircle className="h-8 w-8" />,
      title: "Transparent Tracking",
      description:
        "Track the progress of your contributions or project funding with complete transparency on the Sui blockchain.",
    },
  ]

  return (
    <section id="how-it-works" className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <AnimationWrapper
            id="how-it-works"
            className="text-3xl md:text-4xl font-inter font-bold mb-4 sui-navy-text"
          >
            How It Works
          </AnimationWrapper>

          <AnimationWrapper id="how-it-works" className="text-gray-600 max-w-2xl mx-auto font-inter" delay={0.2}>
            Our platform makes it easy to create, fund, and track projects with complete transparency and security on
            the Sui blockchain.
          </AnimationWrapper>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <AnimationWrapper
              key={index}
              id="how-it-works"
              className="bg-white rounded-xl p-6 flex flex-col items-center text-center shadow-sm border"
              animationClass="panel-slide-in"
              delay={index * 0.15}
            >
              <div className="bg-sui-blue p-4 rounded-full mb-4">{step.icon}</div>
              <h3 className="text-xl font-inter font-bold mb-2 sui-navy-text">{step.title}</h3>
              <p className="text-gray-600 font-inter">{step.description}</p>
            </AnimationWrapper>
          ))}
        </div>
      </div>
    </section>
  )
}
