"use client"

import { useState } from "react"
import { CheckCircle } from "lucide-react"
import type { ShippingMethod } from "@/types/checkout"

interface DeliveryStepProps {
  onSubmit: (method: ShippingMethod) => void
  onBack: () => void
  initialData: ShippingMethod | null
}

export function DeliveryStep({ onSubmit, onBack, initialData }: DeliveryStepProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>(initialData?.id || "standard")

  const shippingMethods: ShippingMethod[] = [
    {
      id: "standard",
      name: "Standard Shipping",
      description: "Delivery in 5-7 business days",
      price: 5.99,
      estimatedDelivery: "5-7 business days",
    },
    {
      id: "express",
      name: "Express Shipping",
      description: "Delivery in 2-3 business days",
      price: 12.99,
      estimatedDelivery: "2-3 business days",
    },
    {
      id: "overnight",
      name: "Overnight Shipping",
      description: "Next business day delivery",
      price: 24.99,
      estimatedDelivery: "Next business day",
    },
  ]

  const handleSubmit = () => {
    const method = shippingMethods.find((m) => m.id === selectedMethod)
    if (method) {
      onSubmit(method)
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6 text-gray-100">Delivery Method</h2>

      <div className="space-y-4 mb-8">
        {shippingMethods.map((method) => (
          <div
            key={method.id}
            className={`p-4 border rounded-md cursor-pointer transition-colors ${
              selectedMethod === method.id
                ? "border-yellow-500 bg-yellow-500/10"
                : "border-gray-600 hover:border-gray-500"
            }`}
            onClick={() => setSelectedMethod(method.id)}
          >
            <div className="flex items-center">
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${
                  selectedMethod === method.id ? "border-yellow-500 bg-yellow-500 text-dark-900" : "border-gray-400"
                }`}
              >
                {selectedMethod === method.id && <CheckCircle className="w-4 h-4" />}
              </div>

              <div className="flex-grow">
                <div className="flex justify-between">
                  <h3 className="font-medium text-gray-100">{method.name}</h3>
                  <span className="font-medium text-gray-100">${method.price.toFixed(2)}</span>
                </div>
                <p className="text-sm text-gray-400">{method.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-3 bg-dark-700 text-gray-300 font-medium rounded-md hover:bg-dark-600 transition-colors"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="flex-1 py-3 bg-yellow-500 text-dark-900 font-medium rounded-md hover:bg-yellow-600 transition-colors"
        >
          Continue to Payment
        </button>
      </div>
    </div>
  )
}
