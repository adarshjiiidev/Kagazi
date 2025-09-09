import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Space_Grotesk } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { SessionProvider } from "@/components/SessionProvider"
import { Suspense } from "react"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700", "800", "900"],
})

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "Kagazi - Paper Trading Platform",
  description: "Professional paper trading platform for learning and practice",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${inter.variable} ${spaceGrotesk.variable} antialiased`}>
        <Suspense fallback={null}>
          <SessionProvider>
            <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
              {children}
            </ThemeProvider>
          </SessionProvider>
        </Suspense>
        <Analytics />
      </body>
    </html>
  )
}
