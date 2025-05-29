"use client"

import Image from "next/image"
import { Minus, Plus, X } from "lucide-react"
import { useCart } from "@/context/cart-context"
import type { CartItem as CartItemType } from "@/types/cart"
import { useState } from "react"

interface CartItemProps {
  item: CartItemType
}

export function CartItem({ item }: CartItemProps) {
  const { removeItem, updateQuantity } = useCart()
  const [imageError, setImageError] = useState(false)

  const handleIncrement = () => {
    updateQuantity(item.id, item.quantity + 1)
  }

  const handleDecrement = () => {
    if (item.quantity > 1) {
      updateQuantity(item.id, item.quantity - 1)
    } else {
      removeItem(item.id)
    }
  }

  const handleImageError = () => {
    setImageError(true)
  }

  return (
    <div className="flex items-center py-4 border-b border-gray-700">
      <div className="relative h-16 w-16 rounded overflow-hidden flex-shrink-0 bg-dark-700">
        {!imageError ? (
          <Image 
            src={item.image1} 
            alt={item.name} 
            fill 
            className="object-cover"
            onError={handleImageError}
            sizes="64px"
            priority
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <span className="text-xs">No image</span>
          </div>
        )}
      </div>
      <div className="ml-4 flex-grow">
        <h4 className="text-sm font-medium text-gray-100">{item.name}</h4>
        <p className="text-sm text-gray-400">${item.price.toFixed(2)}</p>
      </div>
      <div className="flex items-center space-x-2">
        <button onClick={handleDecrement} className="p-1 rounded-full bg-dark-700 hover:bg-dark-600 transition-colors">
          <Minus className="h-3 w-3 text-gray-300" />
        </button>
        <span className="text-sm text-gray-300 w-6 text-center">{item.quantity}</span>
        <button onClick={handleIncrement} className="p-1 rounded-full bg-dark-700 hover:bg-dark-600 transition-colors">
          <Plus className="h-3 w-3 text-gray-300" />
        </button>
      </div>
      <button
        onClick={() => removeItem(item.id)}
        className="ml-4 p-1 rounded-full bg-dark-700 hover:bg-dark-600 transition-colors"
      >
        <X className="h-4 w-4 text-gray-300" />
      </button>
    </div>
  )
}
