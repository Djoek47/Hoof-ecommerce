"use client"

import { useCart } from "@/context/cart-context";
import { CartItem } from "@/types/cart";

export default function CartPage() {
  const { state, clearCart } = useCart();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Shopping Cart</h1>
      
      {state.items.length === 0 ? (
        <p>Your cart is empty</p>
      ) : (
        <>
          <div className="space-y-4">
            {state.items.map((item: CartItem) => (
              <div key={item.id} className="flex items-center gap-4 p-4 border rounded">
                <img 
                  src={item.image1} 
                  alt={item.name} 
                  className="w-24 h-24 object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-gray-600">${item.price}</p>
                  <p className="text-gray-600">Quantity: {item.quantity}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 flex justify-between items-center">
            <button
              onClick={clearCart}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
            >
              Clear Cart
            </button>
            
            <div className="text-xl font-bold">
              Total: ${state.items.reduce((sum: number, item: CartItem) => sum + (item.price * item.quantity), 0).toFixed(2)}
            </div>
          </div>
        </>
      )}
    </div>
  );
} 