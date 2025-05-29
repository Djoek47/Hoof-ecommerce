"use client"

import { CheckCircle } from "lucide-react"

interface ConfirmationStepProps {
  orderNumber: string
  onBackToShop: () => void
}

export function ConfirmationStep({ orderNumber, onBackToShop }: ConfirmationStepProps) {
  return (
    <div className="text-center py-8">
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 rounded-full bg-yellow-500 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-dark-900" />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-gray-100 mb-2">Order Confirmed!</h2>
      <p className="text-gray-300 mb-6">Thank you for your purchase. Your order has been received.</p>

      <div className="bg-dark-700 p-4 rounded-md inline-block mb-8">
        <p className="text-sm text-gray-400">Order Number</p>
        <p className="text-lg font-medium text-yellow-500">{orderNumber}</p>
      </div>

      <div className="space-y-4">
        <p className="text-gray-300">
          We've sent a confirmation email with your order details and tracking information.
        </p>
        <p className="text-gray-300">
          Your digital items will be available in your Faberland metaverse account within 24 hours.
        </p>
      </div>

      <div className="mt-8">
        <button
          onClick={onBackToShop}
          className="px-8 py-3 bg-yellow-500 text-dark-900 font-medium rounded-md hover:bg-yellow-600 transition-colors"
        >
          Continue Shopping
        </button>
      </div>
    </div>
  )
}
