"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"
import { useCart } from "@/context/cart-context"
import { CartItem } from "@/components/cart/cart-item"
import { Button } from "@/components/ui/button"
import { calculateCartTotal } from "@/lib/cart"

export function CartDrawer() {
  const router = useRouter()
  const { state, closeCart } = useCart()
  const { items, isOpen } = state

  // Close cart when pressing escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart()
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      // Prevent scrolling when cart is open
      document.body.style.overflow = "hidden"
      // Add blur class to main content
      document.getElementById("main-content")?.classList.add("blur-effect")
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = ""
      // Remove blur class when cart is closed
      document.getElementById("main-content")?.classList.remove("blur-effect")
    }
  }, [isOpen, closeCart])

  const handleCheckout = () => {
    closeCart()
    router.push("/checkout")
  }

  if (!isOpen) return null

  const total = calculateCartTotal(items)

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-70 backdrop-blur-sm"
        onClick={closeCart}
        aria-hidden="true"
      ></div>

      {/* Cart drawer */}
      <div className="relative w-full max-w-md bg-dark-800 shadow-xl flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-medium text-gray-100">Your Cart</h2>
          <button
            onClick={closeCart}
            className="p-2 rounded-full bg-yellow-500 hover:bg-yellow-600 transition-colors"
            aria-label="Close cart"
          >
            <X className="h-5 w-5 text-dark-900" />
          </button>
        </div>

        <div className="flex-grow overflow-auto p-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-gray-400 mb-4">Your cart is empty</p>
              <Button onClick={closeCart} variant="outline">
                Continue Shopping
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <CartItem key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="p-4 border-t border-gray-700">
            <div className="flex justify-between mb-4">
              <span className="text-gray-300">Subtotal</span>
              <span className="text-gray-100 font-medium">${total.toFixed(2)}</span>
            </div>
            <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-dark-900" onClick={handleCheckout}>
              Checkout
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
