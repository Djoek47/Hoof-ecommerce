export interface ShippingAddress {
  firstName: string
  lastName: string
  address1: string
  address2?: string
  city: string
  state: string
  zipCode: string
  country: string
  phone: string
}

export interface ShippingMethod {
  id: string
  name: string
  description: string
  price: number
  estimatedDelivery: string
}

export interface PaymentDetails {
  cardNumber: string
  nameOnCard: string
  expiryDate: string
  cvv: string
}

export interface CheckoutState {
  step: "shipping" | "delivery" | "payment" | "review" | "confirmation"
  shippingAddress: ShippingAddress | null
  shippingMethod: ShippingMethod | null
  paymentDetails: PaymentDetails | null
  orderNumber?: string
}
