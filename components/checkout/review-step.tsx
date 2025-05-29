"use client"

import Image from "next/image"
import { calculateCartTotal } from "@/lib/cart"
import type { CheckoutState } from "@/types/checkout"
import type { CartItem } from "@/types/cart"

interface ReviewStepProps {
  checkoutData: CheckoutState
  cartItems: CartItem[]
  onSubmit: () => void
  onBack: () => void
}

export function ReviewStep({ checkoutData, cartItems, onSubmit, onBack }: ReviewStepProps) {
  const { shippingAddress, shippingMethod } = checkoutData

  if (!shippingAddress || !shippingMethod) {
    return <div>Missing required information</div>
  }

  const subtotal = calculateCartTotal(cartItems)
  const shippingCost = shippingMethod.price
  const tax = subtotal * 0.08 // 8% tax rate
  const total = subtotal + shippingCost + tax

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6 text-gray-100">Review Your Order</h2>

      <div className="space-y-6">
        {/* Shipping Information */}
        <div className="bg-dark-700 p-4 rounded-md">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium text-gray-100">Shipping Address</h3>
          </div>
          <div className="text-sm text-gray-300">
            <p>
              {shippingAddress.firstName} {shippingAddress.lastName}
            </p>
            <p>{shippingAddress.address1}</p>
            {shippingAddress.address2 && <p>{shippingAddress.address2}</p>}
            <p>
              {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}
            </p>
            <p>{shippingAddress.country}</p>
            <p>{shippingAddress.phone}</p>
          </div>
        </div>

        {/* Delivery Method */}
        <div className="bg-dark-700 p-4 rounded-md">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium text-gray-100">Delivery Method</h3>
            <span className="text-gray-300">${shippingMethod.price.toFixed(2)}</span>
          </div>
          <div className="text-sm text-gray-300">
            <p>{shippingMethod.name}</p>
            <p>{shippingMethod.description}</p>
          </div>
        </div>

        {/* Payment Information */}
        <div className="bg-dark-700 p-4 rounded-md">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium text-gray-100">Payment Information</h3>
          </div>
          <div className="text-sm text-gray-300">
            <p>•••• •••• •••• {checkoutData.paymentDetails?.cardNumber.slice(-4)}</p>
            <p>{checkoutData.paymentDetails?.nameOnCard}</p>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-dark-700 p-4 rounded-md">
          <h3 className="font-medium text-gray-100 mb-4">Order Summary</h3>

          <div className="space-y-4 mb-4">
            {cartItems.map((item) => (
              <div key={item.id} className="flex items-center">
                <div className="relative h-16 w-16 rounded overflow-hidden flex-shrink-0">
                  <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                </div>
                <div className="ml-4 flex-grow">
                  <h4 className="text-sm font-medium text-gray-100">{item.name}</h4>
                  <p className="text-xs text-gray-400">Quantity: {item.quantity}</p>
                </div>
                <div className="text-sm text-gray-300">${(item.price * item.quantity).toFixed(2)}</div>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-600 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-300">Subtotal</span>
              <span className="text-gray-100">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-300">Shipping</span>
              <span className="text-gray-100">${shippingCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-300">Tax</span>
              <span className="text-gray-100">${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-medium pt-2 border-t border-gray-600">
              <span className="text-gray-100">Total</span>
              <span className="text-yellow-500">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-4">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-3 bg-dark-700 text-gray-300 font-medium rounded-md hover:bg-dark-600 transition-colors"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          className="flex-1 py-3 bg-yellow-500 text-dark-900 font-medium rounded-md hover:bg-yellow-600 transition-colors"
        >
          Place Order
        </button>
      </div>
    </div>
  )
}
