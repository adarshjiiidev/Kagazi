"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-black/95 backdrop-blur-sm border-b border-white/10" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="text-2xl lg:text-3xl font-bold text-white hover:text-gray-300 transition-colors">
            KAGAZI
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8 lg:space-x-12">
            <Link href="#features" className="text-white hover:text-gray-300 transition-colors font-medium">
              FEATURES
            </Link>
            <Link href="#about" className="text-white hover:text-gray-300 transition-colors font-medium">
              ABOUT
            </Link>
            <Link href="#testimonials" className="text-white hover:text-gray-300 transition-colors font-medium">
              REVIEWS
            </Link>
            <Link href="/auth/login" className="text-white hover:text-gray-300 transition-colors font-medium">
              LOGIN
            </Link>
            <Button asChild className="bg-white text-black hover:bg-gray-200 font-bold px-6 py-2">
              <Link href="/auth/register">GET STARTED</Link>
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-white hover:text-gray-300 transition-colors"
            aria-label="Toggle mobile menu"
          >
            <div className="w-6 h-6 flex flex-col justify-center items-center">
              <span
                className={`block w-6 h-0.5 bg-current transition-all duration-300 ${
                  isMobileMenuOpen ? "rotate-45 translate-y-0.5" : "-translate-y-1"
                }`}
              />
              <span
                className={`block w-6 h-0.5 bg-current transition-all duration-300 ${
                  isMobileMenuOpen ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`block w-6 h-0.5 bg-current transition-all duration-300 ${
                  isMobileMenuOpen ? "-rotate-45 -translate-y-0.5" : "translate-y-1"
                }`}
              />
            </div>
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden transition-all duration-300 overflow-hidden ${
            isMobileMenuOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <nav className="py-4 space-y-4 border-t border-white/10">
            <Link
              href="#features"
              className="block text-white hover:text-gray-300 transition-colors font-medium py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              FEATURES
            </Link>
            <Link
              href="#about"
              className="block text-white hover:text-gray-300 transition-colors font-medium py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              ABOUT
            </Link>
            <Link
              href="#testimonials"
              className="block text-white hover:text-gray-300 transition-colors font-medium py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              REVIEWS
            </Link>
            <Link
              href="/auth/login"
              className="block text-white hover:text-gray-300 transition-colors font-medium py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              LOGIN
            </Link>
            <Button asChild className="bg-white text-black hover:bg-gray-200 font-bold w-full mt-4">
              <Link href="/auth/register" onClick={() => setIsMobileMenuOpen(false)}>
                GET STARTED
              </Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  )
}
