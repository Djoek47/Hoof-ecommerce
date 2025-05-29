"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface CheckoutLoadingProps {
  isLoading: boolean
}

export function CheckoutLoading({ isLoading }: CheckoutLoadingProps) {
  const [progress, setProgress] = useState(0)
  const [matrixText, setMatrixText] = useState("")

  useEffect(() => {
    if (!isLoading) {
      setProgress(0)
      return
    }

    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$#@%"
    let interval: NodeJS.Timeout
    let matrixInterval: NodeJS.Timeout

    // Matrix text effect
    matrixInterval = setInterval(() => {
      const randomText = Array(8)
        .fill(0)
        .map(() => characters.charAt(Math.floor(Math.random() * characters.length)))
        .join("")
      setMatrixText(randomText)
    }, 50)

    // Progress bar animation
    interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 1
      })
    }, 30)

    return () => {
      clearInterval(interval)
      clearInterval(matrixInterval)
    }
  }, [isLoading])

  if (!isLoading) return null

  return (
    <div
      className={cn(
        "fixed inset-0 z-[60] flex flex-col items-center justify-center bg-dark-900 transition-opacity duration-500",
      )}
    >
      <div className="relative w-48 h-48 mb-8">
        <Image src="/logo.png" alt="Faberstore" fill className="object-contain" priority />
      </div>

      {/* Matrix-style loading text */}
      <div className="font-mono text-white mb-4 h-6">{`LOADING_FABERCART: ${matrixText}`}</div>

      {/* Progress bar container */}
      <div className="w-64 h-1 bg-dark-400 rounded-full overflow-hidden">
        <div className="h-full bg-yellow-500 transition-all duration-100 ease-out" style={{ width: `${progress}%` }} />
      </div>

      {/* Progress percentage */}
      <div className="mt-2 font-mono text-sm text-white">{`${progress}%`}</div>

      {/* V1 Studio logo */}
      <div className="absolute bottom-4 right-4 w-12 h-12 opacity-70">
        <Image src="/v1-logo.png" alt="V1 Studio" fill className="object-contain" />
      </div>
    </div>
  )
}
