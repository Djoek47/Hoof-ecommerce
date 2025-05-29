"use client"
import { useForm } from "react-hook-form"
import { CreditCard, Lock } from "lucide-react"
import type { PaymentDetails } from "@/types/checkout"

interface PaymentStepProps {
  onSubmit: (data: PaymentDetails) => void
  onBack: () => void
  initialData: PaymentDetails | null
}

export function PaymentStep({ onSubmit, onBack, initialData }: PaymentStepProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<PaymentDetails>({
    defaultValues: initialData || {
      cardNumber: "",
      nameOnCard: "",
      expiryDate: "",
      cvv: "",
    },
  })

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    return (
      value
        .replace(/\s/g, "")
        .match(/.{1,4}/g)
        ?.join(" ")
        .substr(0, 19) || ""
    )
  }

  const cardNumber = watch("cardNumber")

  // Determine card type based on first digits
  const getCardType = (number: string) => {
    const cleaned = number.replace(/\D/g, "")
    if (cleaned.startsWith("4")) return "Visa"
    if (/^5[1-5]/.test(cleaned)) return "Mastercard"
    if (/^3[47]/.test(cleaned)) return "American Express"
    if (/^6(?:011|5)/.test(cleaned)) return "Discover"
    return null
  }

  const cardType = getCardType(cardNumber)

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6 text-gray-100">Payment Information</h2>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center text-gray-300">
          <Lock className="w-4 h-4 mr-2" />
          <span className="text-sm">Secure Payment</span>
        </div>

        <div className="flex items-center space-x-2">
          <div className="w-10 h-6 bg-gray-700 rounded"></div>
          <div className="w-10 h-6 bg-gray-700 rounded"></div>
          <div className="w-10 h-6 bg-gray-700 rounded"></div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-300 mb-1">
            Card Number *
          </label>
          <div className="relative">
            <input
              id="cardNumber"
              type="text"
              className={`w-full pl-10 pr-4 py-2 bg-dark-700 border ${
                errors.cardNumber ? "border-red-500" : "border-gray-600"
              } rounded-md text-gray-100 focus:outline-none focus:ring-1 focus:ring-yellow-500`}
              placeholder="1234 5678 9012 3456"
              {...register("cardNumber", {
                required: "Card number is required",
                onChange: (e) => {
                  e.target.value = formatCardNumber(e.target.value)
                },
                validate: (value) => {
                  const cleaned = value.replace(/\s/g, "")
                  return (cleaned.length >= 13 && cleaned.length <= 19) || "Invalid card number"
                },
              })}
            />
            <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            {cardType && <span className="absolute right-3 top-2 text-sm text-gray-400">{cardType}</span>}
          </div>
          {errors.cardNumber && <p className="mt-1 text-sm text-red-500">{errors.cardNumber.message}</p>}
        </div>

        <div>
          <label htmlFor="nameOnCard" className="block text-sm font-medium text-gray-300 mb-1">
            Name on Card *
          </label>
          <input
            id="nameOnCard"
            type="text"
            className={`w-full px-4 py-2 bg-dark-700 border ${
              errors.nameOnCard ? "border-red-500" : "border-gray-600"
            } rounded-md text-gray-100 focus:outline-none focus:ring-1 focus:ring-yellow-500`}
            {...register("nameOnCard", { required: "Name on card is required" })}
          />
          {errors.nameOnCard && <p className="mt-1 text-sm text-red-500">{errors.nameOnCard.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-300 mb-1">
              Expiry Date (MM/YY) *
            </label>
            <input
              id="expiryDate"
              type="text"
              className={`w-full px-4 py-2 bg-dark-700 border ${
                errors.expiryDate ? "border-red-500" : "border-gray-600"
              } rounded-md text-gray-100 focus:outline-none focus:ring-1 focus:ring-yellow-500`}
              placeholder="MM/YY"
              {...register("expiryDate", {
                required: "Expiry date is required",
                pattern: {
                  value: /^(0[1-9]|1[0-2])\/([0-9]{2})$/,
                  message: "Invalid format (MM/YY)",
                },
              })}
            />
            {errors.expiryDate && <p className="mt-1 text-sm text-red-500">{errors.expiryDate.message}</p>}
          </div>

          <div>
            <label htmlFor="cvv" className="block text-sm font-medium text-gray-300 mb-1">
              CVV *
            </label>
            <input
              id="cvv"
              type="text"
              className={`w-full px-4 py-2 bg-dark-700 border ${
                errors.cvv ? "border-red-500" : "border-gray-600"
              } rounded-md text-gray-100 focus:outline-none focus:ring-1 focus:ring-yellow-500`}
              maxLength={4}
              {...register("cvv", {
                required: "CVV is required",
                pattern: {
                  value: /^[0-9]{3,4}$/,
                  message: "CVV must be 3 or 4 digits",
                },
              })}
            />
            {errors.cvv && <p className="mt-1 text-sm text-red-500">{errors.cvv.message}</p>}
          </div>
        </div>

        <div className="pt-4 flex gap-4">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 py-3 bg-dark-700 text-gray-300 font-medium rounded-md hover:bg-dark-600 transition-colors"
          >
            Back
          </button>
          <button
            type="submit"
            className="flex-1 py-3 bg-yellow-500 text-dark-900 font-medium rounded-md hover:bg-yellow-600 transition-colors"
          >
            Review Order
          </button>
        </div>
      </form>
    </div>
  )
}
