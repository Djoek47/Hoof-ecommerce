"use client"

import { ShoppingCart } from "lucide-react"
import { useState } from "react"
import { useCart } from "@/context/cart-context"
import { calculateItemsCount } from "@/lib/cart"

export function CartIcon() {
  const [isClicked, setIsClicked] = useState(false)
  const { state, toggleCart } = useCart()
  const itemCount = calculateItemsCount(state.items)

  const handleClick = () => {
    setIsClicked(true)
    setTimeout(() => setIsClicked(false), 300) // Reset after animation
    toggleCart()
  }

  return (
    <button
      onClick={handleClick}
      className={`p-2 rounded-full bg-yellow-500 hover:bg-yellow-600 transition-colors duration-200 relative ${
        isClicked ? "animate-click" : ""
      }`}
      aria-label="Open cart"
    >
      <ShoppingCart className="w-6 h-6 text-dark-900" />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-dark-900 text-yellow-500 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border border-yellow-500">
          {itemCount}
        </span>
      )}
    </button>
  )
}
