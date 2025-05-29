import { CheckoutForm } from "@/components/checkout/checkout-form"

export default function CheckoutPage() {
  return (
    <div className="min-h-screen pt-24 pb-16 bg-dark-900">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-100">Checkout</h1>
        <CheckoutForm />
      </div>
    </div>
  )
}
