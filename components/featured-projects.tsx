"use client"

import { useInView } from "@/hooks/use-in-view"

export default function FeaturedProjects() {
  const { ref, inView } = useInView()

  const projects = [
    { id: 1, name: "Healthcare Initiative" },
    { id: 2, name: "Education Fund" },
    { id: 3, name: "Clean Energy Project" },
    { id: 4, name: "Community Development" },
    { id: 5, name: "Tech Innovation" },
    { id: 6, name: "Arts & Culture" },
  ]

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8">
      <div ref={ref} className={`max-w-7xl mx-auto animate-on-scroll ${inView ? "visible" : ""}`}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="glassmorphism rounded-lg p-4 h-24 flex items-center justify-center text-center"
            >
              <span className="font-medium">{project.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
