"use client"

import { useEffect, useState, type ReactNode } from "react"

interface AnimationWrapperProps {
  children: ReactNode
  id?: string
  className?: string
  animationClass?: string
  delay?: number
}

export default function AnimationWrapper({
  children,
  id,
  className = "",
  animationClass = "fade-in",
  delay = 0,
}: AnimationWrapperProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight * 0.8
      const element = id ? document.getElementById(id) : null
      const sectionPosition = element?.offsetTop || 0

      if (scrollPosition > sectionPosition || !id) {
        setIsVisible(true)
      }
    }

    window.addEventListener("scroll", handleScroll)
    // Initial check
    handleScroll()

    return () => window.removeEventListener("scroll", handleScroll)
  }, [id])

  const delayStyle = delay ? { animationDelay: `${delay}s` } : {}

  return (
    <div className={`${className} ${isVisible ? animationClass : "opacity-0"}`} style={delayStyle}>
      {children}
    </div>
  )
}
