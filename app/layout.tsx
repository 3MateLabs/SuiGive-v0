import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import SuiProviders from "@/components/SuiProviders"
import { Toaster } from "react-hot-toast"
// API Monitor removed for production

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
          <SuiProviders>
            <Toaster position="top-center" />
            {children}
            {/* API Monitor removed for production */}
          </SuiProviders>
        </ThemeProvider>
      </body>
    </html>
  )
}