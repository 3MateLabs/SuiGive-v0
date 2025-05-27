"use client"

import { ArrowRight, CheckCircle, Clock } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import AnimationWrapper from "./animation-wrapper"

export default function CompletedCrowdfunds() {
  const completedProjects = [
    {
      id: 1,
      title: "Community Garden Project",
      description: "Successfully funded a community garden in downtown area, creating green space for local residents.",
      image: "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=600&q=80",
      completedDate: "March 15, 2025",
      raised: "$15,000",
      goal: "$12,000",
      progress: 125,
      backers: 87,
    },
    {
      id: 2,
      title: "Children's Hospital Equipment",
      description: "Funded new medical equipment for the pediatric ward at St. Mary's Hospital.",
      image: "https://images.unsplash.com/photo-1504439468489-c8920d796a29?auto=format&fit=crop&w=600&q=80",
      completedDate: "February 28, 2025",
      raised: "$32,500",
      goal: "$30,000",
      progress: 108,
      backers: 215,
    },
    {
      id: 3,
      title: "Disaster Relief Fund",
      description: "Emergency funding for families affected by recent flooding in coastal regions.",
      image: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=600&q=80",
      completedDate: "January 20, 2025",
      raised: "$45,000",
      goal: "$40,000",
      progress: 112,
      backers: 342,
    },
  ]

  return (
    <section id="completed-crowdfunds" className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-everett font-bold sui-navy-text">Completed Crowdfunds</h2>
          <Link href="#" className="flex items-center text-sm font-medium sui-navy-text">
            View all successful projects <ArrowRight className="ml-1 h-4 w-4 arrow-bounce" />
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {completedProjects.map((project, index) => (
            <AnimationWrapper
              key={project.id}
              id="completed-crowdfunds"
              className="bg-white rounded-lg overflow-hidden border shadow-sm"
              animationClass="panel-slide-in"
              delay={index * 0.2}
            >
              <div className="relative">
                <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Funded Successfully
                </div>
                <div className="relative h-48 w-full">
                  <Image src={project.image || "/placeholder.svg"} alt={project.title} fill className="object-cover" priority />
                </div>
              </div>

              <div className="p-4">
                <h3 className="text-xl font-everett font-bold mb-2">{project.title}</h3>
                <p className="text-sm text-gray-700 mb-4">{project.description}</p>

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-green-600">{project.progress}% Funded</span>
                    <span>Goal: {project.goal}</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill bg-green-500"
                      style={{ width: `${Math.min(project.progress, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm text-gray-600 border-t pt-4">
                  <div>
                    <span className="font-medium">{project.backers}</span> backers
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>Completed on {project.completedDate}</span>
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
