"use client"

import type { ReactNode } from "react"

interface WalletProviderProps {
  children: ReactNode
}

// Simplified wallet provider that doesn't actually connect to any wallet
export default function WalletProvider({ children }: WalletProviderProps) {
  return <>{children}</>
}
