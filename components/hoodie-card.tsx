"use client"

import Image from "next/image"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useCart } from "@/context/cart-context"
import { ShoppingCart } from "lucide-react"

interface HoodieCardProps {
  id: number
  name: string
  price: number
  image1: string
  image2: string
}

export function HoodieCard({ id, name, price, image1, image2 }: HoodieCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const { addItem } = useCart()

  const handleAddToCart = () => {
    addItem({
      id,
      name,
      price,
      image: image1,
      quantity: 1,
    })
  }

  return (
    <div className="bg-dark-800 rounded-lg overflow-hidden group">
      <div
        className="relative aspect-square"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Image
          src={isHovered ? image2 : image1}
          alt={name}
          fill
          className="object-cover transition-opacity duration-300"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
        />
        <div className="absolute top-2 right-2">
          <Badge className="bg-yellow-500 text-dark-900 hover:bg-yellow-600">Metaverse Item</Badge>
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-100 group-hover:text-yellow-500 transition-colors">{name}</h3>
        <p className="text-gray-400 mb-4">${price.toFixed(2)}</p>
        <div className="flex gap-2">
          <Button
            className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-dark-900 border-none"
            onClick={handleAddToCart}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  )
}
