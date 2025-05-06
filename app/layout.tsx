import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import WalletProviderClient from "@/components/WalletProviderClient"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: "SuiGives | Web3 Crowdfunding Platform",
  description:
    "Empowering the Sui community to come together, unite their efforts, raise support, and create a lasting impact for the ecosystem.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <WalletProviderClient>
            {children}
          </WalletProviderClient>
        </ThemeProvider>
      </body>
    </html>
  )
}


import './globals.css'