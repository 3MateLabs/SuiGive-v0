"use client"

import { useInView } from "@/hooks/use-in-view"
import { Star } from "lucide-react"
import Image from "next/image"

export default function ReviewsSection() {
  const { ref, inView } = useInView()

  const reviews = [
    {
      id: 1,
      name: "Sele.sui",
      role: "Project Creator",
      image: "/avatar1.jpg",
      content:
        "3MateLabs has transformed how I approach fundraising. The transparency and direct connection with supporters has been invaluable for my healthcare initiative.",
      rating: 5,
    },
    {
      id: 2,
      name: "Cyberx.sui",
      role: "Community Supporter",
      image: "/avatar2.jpg",
      content:
        "I love being able to track exactly where my contributions go and seeing the real-time impact. The platform is intuitive and the community is incredibly supportive.",
      rating: 5,
    },
    {
      id: 3,
      name: "Ruru.sui",
      role: "Tech Entrepreneur",
      image: "/avatar3.jpg",
      content:
        "As someone deeply involved in Web3, I appreciate the technical excellence and security of the 3MateLabs platform. It sets a new standard for crowdfunding.",
      rating: 4,
    },
  ]

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div ref={ref} className={`max-w-7xl mx-auto animate-on-scroll ${inView ? "visible" : ""}`}>
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our Community Says</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Hear from project creators and supporters who have experienced the power of our platform.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {reviews.map((review) => (
            <div key={review.id} className="glassmorphism rounded-xl p-6">
              <div className="flex items-center mb-4">
                <div className="relative w-12 h-12 rounded-full overflow-hidden mr-4">
                  <Image src={review.image || "/placeholder.svg"} alt={review.name} fill className="object-cover" />
                </div>
                <div>
                  <h3 className="font-bold">{review.name}</h3>
                  <p className="text-sm text-gray-600">{review.role}</p>
                </div>
              </div>

              <p className="text-gray-700 mb-4">{review.content}</p>

              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
