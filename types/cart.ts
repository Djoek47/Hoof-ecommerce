export interface CartItem {
  id: number
  name: string
  price: number
  image1: string;
  image2: string;
  quantity: number
}

export interface CartState {
  items: CartItem[]
  isOpen: boolean
  cartUrl?: string
}

export interface CartIdentifier {
  type: 'guest' | 'wallet';
  id: string;
}
