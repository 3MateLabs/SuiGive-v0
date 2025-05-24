"use client"

import { type ReactNode, useEffect } from "react"

interface ScrollAnimationProviderProps {
  children: ReactNode
}

export default function ScrollAnimationProvider({ children }: ScrollAnimationProviderProps) {
  useEffect(() => {
    const handleScroll = () => {
      const elements = document.querySelectorAll(".animate-on-scroll")

      elements.forEach((element) => {
        const rect = element.getBoundingClientRect()
        const isVisible =
          rect.top <= (window.innerHeight || document.documentElement.clientHeight) * 0.8 && rect.bottom >= 0

        if (isVisible) {
          element.classList.add("visible")
        }
      })
    }

    // Initial check
    handleScroll()

    // Add scroll event listener
    window.addEventListener("scroll", handleScroll)

    // Clean up
    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  return <>{children}</>
}
