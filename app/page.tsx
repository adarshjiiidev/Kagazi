"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AuthAwareHeader } from "@/components/AuthAwareHeader"
import Link from "next/link"

export default function HomePage() {
  const [scrollY, setScrollY] = useState(0)
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set())

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set([...prev, entry.target.id]))
          }
        })
      },
      { threshold: 0.1 },
    )

    const sections = document.querySelectorAll("[data-section]")
    sections.forEach((section) => observer.observe(section))

    return () => observer.disconnect()
  }, [])

  const features = [
    {
      title: "REAL-TIME TRADING",
      description:
        "Experience live market conditions with real-time data feeds and instant order execution simulation.",
    },
    {
      title: "PORTFOLIO TRACKING",
      description: "Monitor your virtual investments with comprehensive analytics and performance metrics.",
    },
    {
      title: "RISK MANAGEMENT",
      description: "Learn proper risk management techniques with built-in tools and educational resources.",
    },
    {
      title: "MARKET ANALYSIS",
      description: "Access advanced charting tools and technical indicators for informed decision making.",
    },
  ]

  const testimonials = [
    {
      name: "ALEX CHEN",
      role: "DAY TRADER",
      content: "KAGAZI TRANSFORMED MY TRADING SKILLS. THE REALISTIC SIMULATION PREPARED ME FOR REAL MARKETS.",
    },
    {
      name: "SARAH JOHNSON",
      role: "INVESTMENT ANALYST",
      content: "THE BEST PAPER TRADING PLATFORM I'VE USED. COMPREHENSIVE TOOLS AND EXCELLENT INTERFACE.",
    },
    {
      name: "MIKE RODRIGUEZ",
      role: "PORTFOLIO MANAGER",
      content: "PERFECT FOR TESTING STRATEGIES. THE ANALYTICS ARE PROFESSIONAL-GRADE AND INCREDIBLY DETAILED.",
    },
    {
      name: "EMMA WATSON",
      role: "FINANCIAL ADVISOR",
      content: "I RECOMMEND KAGAZI TO ALL MY CLIENTS. IT'S THE SAFEST WAY TO LEARN TRADING.",
    },
  ]

  const stats = [
    { number: "50K+", label: "ACTIVE TRADERS" },
    { number: "1M+", label: "TRADES EXECUTED" },
    { number: "99.9%", label: "UPTIME" },
    { number: "24/7", label: "MARKET ACCESS" },
  ]

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <AuthAwareHeader scrollY={scrollY} />

      {/* Hero Section */}
      <section
        className="min-h-screen flex items-center justify-center relative overflow-hidden"
        data-section
        id="hero"
      >
        <div className="container mx-auto px-4 text-center">
          <div
            className={`transform transition-all duration-1000 ${
              visibleSections.has("hero") ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"
            }`}
          >
            <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tighter">
              MASTER THE
              <br />
              <span className="text-white">MARKETS</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto leading-relaxed">
              PRACTICE TRADING WITH VIRTUAL MONEY. LEARN WITHOUT RISK. PERFECT YOUR STRATEGY BEFORE INVESTING REAL
              CAPITAL.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="lg" className="bg-white text-black hover:bg-gray-200 text-lg px-8 py-4">
                  START FREE TRIAL
                </Button>
              </Link>
              <Link href="#features">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-black text-lg px-8 py-4 bg-transparent"
                >
                  LEARN MORE
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white text-black" data-section id="features">
        <div className="container mx-auto px-4">
          <div
            className={`text-center mb-16 transform transition-all duration-1000 delay-200 ${
              visibleSections.has("features") ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"
            }`}
          >
            <h2 className="text-5xl font-black mb-6">POWERFUL FEATURES</h2>
            <p className="text-xl max-w-2xl mx-auto">EVERYTHING YOU NEED TO BECOME A SUCCESSFUL TRADER</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className={`bg-black text-white border-0 transform transition-all duration-700 hover:scale-105 ${
                  visibleSections.has("features") ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"
                }`}
                style={{ transitionDelay: `${400 + index * 100}ms` }}
              >
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
                  <p className="text-gray-300 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-black" data-section id="stats">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className={`text-center transform transition-all duration-700 ${
                  visibleSections.has("stats") ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="text-4xl md:text-6xl font-black mb-2">{stat.number}</div>
                <div className="text-gray-400 text-lg">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-white text-black" data-section id="about">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div
              className={`transform transition-all duration-1000 ${
                visibleSections.has("about") ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"
              }`}
            >
              <h2 className="text-5xl font-black mb-8">WHY CHOOSE KAGAZI?</h2>
              <p className="text-xl leading-relaxed mb-8">
                KAGAZI PROVIDES THE MOST REALISTIC PAPER TRADING EXPERIENCE AVAILABLE. OUR PLATFORM USES REAL MARKET
                DATA AND ADVANCED SIMULATION TECHNOLOGY TO GIVE YOU THE CONFIDENCE YOU NEED BEFORE TRADING WITH REAL
                MONEY.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                WHETHER YOU'RE A COMPLETE BEGINNER OR AN EXPERIENCED TRADER LOOKING TO TEST NEW STRATEGIES, KAGAZI
                OFFERS THE TOOLS AND ENVIRONMENT YOU NEED TO SUCCEED IN TODAY'S MARKETS.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-black" data-section id="testimonials">
        <div className="container mx-auto px-4">
          <div
            className={`text-center mb-16 transform transition-all duration-1000 ${
              visibleSections.has("testimonials") ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"
            }`}
          >
            <h2 className="text-5xl font-black mb-6">WHAT TRADERS SAY</h2>
            <p className="text-xl text-gray-400">REAL FEEDBACK FROM REAL TRADERS</p>
          </div>

          {/* Horizontal Scrolling Testimonials */}
          <div className="overflow-x-auto pb-4">
            <div className="flex space-x-6 w-max">
              {testimonials.map((testimonial, index) => (
                <Card
                  key={index}
                  className={`bg-white text-black border-0 w-80 flex-shrink-0 transform transition-all duration-700 hover:scale-105 ${
                    visibleSections.has("testimonials") ? "translate-x-0 opacity-100" : "translate-x-20 opacity-0"
                  }`}
                  style={{ transitionDelay: `${index * 150}ms` }}
                >
                  <CardContent className="p-8">
                    <p className="text-lg mb-6 leading-relaxed">"{testimonial.content}"</p>
                    <div>
                      <div className="font-bold text-xl">{testimonial.name}</div>
                      <div className="text-gray-600">{testimonial.role}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white text-black" data-section id="contact">
        <div className="container mx-auto px-4 text-center">
          <div
            className={`transform transition-all duration-1000 ${
              visibleSections.has("contact") ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"
            }`}
          >
            <h2 className="text-5xl font-black mb-6">READY TO START?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              JOIN THOUSANDS OF TRADERS WHO HAVE IMPROVED THEIR SKILLS WITH KAGAZI
            </p>
            <Link href="/auth/signup">
              <Button size="lg" className="bg-black text-white hover:bg-gray-800 text-lg px-12 py-4">
                GET STARTED NOW
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-12 border-t border-white/10">
        <div className="container mx-auto px-4 text-center">
          <div className="text-2xl font-bold mb-4">KAGAZI</div>
          <p className="text-gray-400">© 2024 KAGAZI. ALL RIGHTS RESERVED.</p>
        </div>
      </footer>
    </div>
  )
}
