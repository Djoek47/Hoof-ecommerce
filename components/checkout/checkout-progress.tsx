"use client"

import { CheckCircle } from "lucide-react"

interface CheckoutProgressProps {
  currentStep: string
}

export function CheckoutProgress({ currentStep }: CheckoutProgressProps) {
  const steps = [
    { id: "shipping", label: "Shipping" },
    { id: "delivery", label: "Delivery" },
    { id: "payment", label: "Payment" },
    { id: "review", label: "Review" },
    { id: "confirmation", label: "Confirmation" },
  ]

  const currentIndex = steps.findIndex((step) => step.id === currentStep)

  return (
    <div className="relative">
      <div className="hidden sm:flex justify-between items-center mb-8">
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex
          const isCurrent = index === currentIndex

          return (
            <div key={step.id} className="flex flex-col items-center relative z-10">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isCompleted
                    ? "bg-yellow-500 text-dark-900"
                    : isCurrent
                      ? "bg-yellow-500/20 text-yellow-500 border border-yellow-500"
                      : "bg-dark-700 text-gray-400"
                }`}
              >
                {isCompleted ? <CheckCircle className="w-5 h-5" /> : <span>{index + 1}</span>}
              </div>
              <span className={`mt-2 text-sm ${isCompleted || isCurrent ? "text-yellow-500" : "text-gray-400"}`}>
                {step.label}
              </span>
            </div>
          )
        })}

        {/* Progress line */}
        <div className="absolute top-4 left-0 w-full h-0.5 bg-dark-700 -z-10">
          <div
            className="h-full bg-yellow-500 transition-all duration-300"
            style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Mobile view */}
      <div className="sm:hidden mb-6">
        <div className="flex items-center justify-center">
          <span className="text-yellow-500 font-medium">
            Step {currentIndex + 1} of {steps.length}: {steps[currentIndex].label}
          </span>
        </div>
        <div className="mt-4 h-1 w-full bg-dark-700">
          <div
            className="h-full bg-yellow-500 transition-all duration-300"
            style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}
