"use client"

import { ArrowRight, Clock, DollarSign } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import AnimationWrapper from "./animation-wrapper"

export default function NewestEvents() {
  const events = [
    {
      id: 1,
      title: "Vehicle Repair Funding",
      description:
        "This healthcare funding event is aimed at helping kids in Africa suffering polio and who do not have access to vaccination.",
      image: "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=600&q=80",
      daysAgo: 3,
      progress: 35,
    },
    {
      id: 2,
      title: "HealthCare Crowdfund for Alex",
      description:
        "This healthcare funding event is aimed at helping kids in Africa suffering polio and who do not have access to vaccination.",
      image: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=600&q=80",
      daysAgo: 3,
      progress: 62,
    },
    {
      id: 3,
      title: "Stray Dogs Crowdfund",
      description:
        "This healthcare funding event is aimed at helping kids in Africa suffering polio and who do not have access to vaccination.",
      image: "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?auto=format&fit=crop&w=600&q=80",
      daysAgo: 3,
      progress: 78,
    },
  ]

  return (
    <section id="newest-events" className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <AnimationWrapper animationClass="fade-right">
            <h2 className="text-3xl font-everett font-bold sui-navy-text">Newest Crowdfunding Events</h2>
          </AnimationWrapper>
          <AnimationWrapper animationClass="fade-left">
            <Link
              href="#"
              className="flex items-center text-sm font-medium sui-navy-text hover:text-sui-navy/70 transition-colors"
            >
              See all <ArrowRight className="ml-1 h-4 w-4 arrow-bounce" />
            </Link>
          </AnimationWrapper>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((event, index) => (
            <AnimationWrapper
              key={event.id}
              id="newest-events"
              className="bg-white rounded-lg overflow-hidden border shadow-sm hover:shadow-md transition-shadow duration-300"
              animationClass="fade-up"
              delay={index * 0.2}
            >
              <div className="p-6">
                
                <h3 className="text-xl font-everett font-bold mb-2">{event.title}</h3>
                <p className="text-sm text-gray-500 font-light mb-4">{event.description}</p>
              </div>

              <div className="relative h-48 w-full">
                <Image src={event.image || "/placeholder.svg"} alt={event.title} fill className="object-cover" />
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{event.progress}% Funded</span>
                    <span>Goal: 100%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: `${event.progress}%` }}></div>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4">
                  <Link href={`/donate/${event.id}`} className="page-transition">
                    <Button className="bg-sui-navy text-white hover:bg-sui-navy/90 rounded-md flex items-center transition-transform hover:scale-105">
                      <DollarSign className="mr-1 h-4 w-4" />
                      Donate Now
                    </Button>
                  </Link>

                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>Posted {event.daysAgo} days ago</span>
                  </div>
                </div>
              </div>
            </AnimationWrapper>
          ))}
        </div>
      </div>
    </section>
  )
}
