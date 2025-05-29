"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ShippingStep } from "@/components/checkout/shipping-step"
import { DeliveryStep } from "@/components/checkout/delivery-step"
import { PaymentStep } from "@/components/checkout/payment-step"
import { ReviewStep } from "@/components/checkout/review-step"
import { ConfirmationStep } from "@/components/checkout/confirmation-step"
import { CheckoutProgress } from "@/components/checkout/checkout-progress"
import { CheckoutLoading } from "@/components/checkout/checkout-loading"
import { useCart } from "@/context/cart-context"
import type { ShippingAddress, ShippingMethod, PaymentDetails, CheckoutState } from "@/types/checkout"

export function CheckoutForm() {
  const router = useRouter()
  const { state: cartState, clearCart } = useCart()
  const [isLoading, setIsLoading] = useState(false)
  const [checkoutState, setCheckoutState] = useState<CheckoutState>({
    step: "shipping",
    shippingAddress: null,
    shippingMethod: null,
    paymentDetails: null,
  })

  const handleShippingSubmit = (address: ShippingAddress) => {
    // Simulate loading when moving between steps
    setIsLoading(true)
    setTimeout(() => {
      setCheckoutState((prev) => ({
        ...prev,
        step: "delivery",
        shippingAddress: address,
      }))
      setIsLoading(false)
      window.scrollTo(0, 0)
    }, 1500)
  }

  const handleDeliverySubmit = (method: ShippingMethod) => {
    setIsLoading(true)
    setTimeout(() => {
      setCheckoutState((prev) => ({
        ...prev,
        step: "payment",
        shippingMethod: method,
      }))
      setIsLoading(false)
      window.scrollTo(0, 0)
    }, 1500)
  }

  const handlePaymentSubmit = (payment: PaymentDetails) => {
    setIsLoading(true)
    setTimeout(() => {
      setCheckoutState((prev) => ({
        ...prev,
        step: "review",
        paymentDetails: payment,
      }))
      setIsLoading(false)
      window.scrollTo(0, 0)
    }, 1500)
  }

  const handleReviewSubmit = () => {
    setIsLoading(true)
    setTimeout(() => {
      // Generate a random order number
      const orderNumber = `FB-${Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0")}`

      setCheckoutState((prev) => ({
        ...prev,
        step: "confirmation",
        orderNumber,
      }))

      // Clear the cart after successful order
      clearCart()
      setIsLoading(false)
      window.scrollTo(0, 0)
    }, 2000)
  }

  const handleBackToShop = () => {
    router.push("/")
  }

  const goBack = () => {
    setIsLoading(true)
    setTimeout(() => {
      setCheckoutState((prev) => ({
        ...prev,
        step:
          prev.step === "delivery"
            ? "shipping"
            : prev.step === "payment"
              ? "delivery"
              : prev.step === "review"
                ? "payment"
                : prev.step,
      }))
      setIsLoading(false)
      window.scrollTo(0, 0)
    }, 1000)
  }

  // If cart is empty and not in confirmation step, redirect to home
  if (cartState.items.length === 0 && checkoutState.step !== "confirmation") {
    return (
      <div className="max-w-3xl mx-auto bg-dark-800 rounded-lg p-8 text-center">
        <h2 className="text-xl font-semibold mb-4 text-gray-100">Your cart is empty</h2>
        <p className="text-gray-300 mb-6">Add some items to your cart before proceeding to checkout.</p>
        <button
          onClick={handleBackToShop}
          className="px-6 py-2 bg-yellow-500 text-dark-900 rounded-md hover:bg-yellow-600 transition-colors"
        >
          Back to Shop
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <CheckoutLoading isLoading={isLoading} />
      <CheckoutProgress currentStep={checkoutState.step} />

      <div className="mt-8 bg-dark-800 rounded-lg p-6 md:p-8">
        {checkoutState.step === "shipping" && (
          <ShippingStep onSubmit={handleShippingSubmit} initialData={checkoutState.shippingAddress} />
        )}

        {checkoutState.step === "delivery" && (
          <DeliveryStep onSubmit={handleDeliverySubmit} onBack={goBack} initialData={checkoutState.shippingMethod} />
        )}

        {checkoutState.step === "payment" && (
          <PaymentStep onSubmit={handlePaymentSubmit} onBack={goBack} initialData={checkoutState.paymentDetails} />
        )}

        {checkoutState.step === "review" && (
          <ReviewStep
            checkoutData={checkoutState}
            cartItems={cartState.items}
            onSubmit={handleReviewSubmit}
            onBack={goBack}
          />
        )}

        {checkoutState.step === "confirmation" && (
          <ConfirmationStep orderNumber={checkoutState.orderNumber || ""} onBackToShop={handleBackToShop} />
        )}
      </div>
    </div>
  )
}
