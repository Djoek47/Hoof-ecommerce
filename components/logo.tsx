"use client"

import { useState, useEffect } from "react"
import Image from "next/image"

export function Logo() {
  const [blurAmount, setBlurAmount] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      // Calculate blur based on scroll position (0-8px blur)
      const scrollY = window.scrollY
      const maxBlur = 8
      const scrollThreshold = 300

      const newBlurAmount = Math.min(maxBlur, (scrollY / scrollThreshold) * maxBlur)
      setBlurAmount(newBlurAmount)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div
      className="relative w-24 h-24 transition-all duration-200"
      style={{
        filter: `blur(${blurAmount}px)`,
        opacity: blurAmount > 0 ? Math.max(0.6, 1 - blurAmount / 10) : 1,
      }}
    >
      <Image src="/logo.png" alt="Faberstore" fill className="object-contain" priority />
    </div>
  )
}
