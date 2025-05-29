"use client"

import { createContext, useContext, useReducer, useEffect, type ReactNode, useState, useCallback } from "react"
import type { CartItem, CartState } from "@/types/cart"
import { hoodies } from "@/data/products"
import { getApiUrl } from '@/lib/config';

// Define actions that update state based on server response
type CartAction =
  | { type: "HYDRATE"; payload: CartState }
  | { type: "TOGGLE_CART" }
  | { type: "CLOSE_CART" }
  | { type: "SET_CART_URL"; payload: string }
  | { type: "UPDATE_CART"; payload: CartState }

interface CartContextType {
  state: CartState
  addItem: (item: { id: number; quantity: number }) => Promise<void>
  removeItem: (id: number) => Promise<void>
  updateQuantity: (id: number, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  toggleCart: () => void
  closeCart: () => void
  fetchCart: () => Promise<void>
  setWalletId: (walletId: string | undefined) => void
}

const initialState: CartState = {
  items: [],
  isOpen: false,
  cartUrl: ''
}

const CartContext = createContext<CartContextType | undefined>(undefined)

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "HYDRATE":
      return { ...state, ...action.payload }
    case "TOGGLE_CART":
      return { ...state, isOpen: !state.isOpen }
    case "CLOSE_CART":
      return { ...state, isOpen: false }
    case "SET_CART_URL":
      return { ...state, cartUrl: action.payload }
    case "UPDATE_CART":
      return { ...state, ...action.payload }
    default:
      return state
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState)
  const [currentWalletId, setCurrentWalletId] = useState<string | undefined>(undefined);

  // Function to store cart in cloud storage
  const storeCart = useCallback(async (cart: CartState) => {
    try {
      const url = new URL(getApiUrl('/cart/storage'));
      if (currentWalletId) {
        url.searchParams.set('walletId', currentWalletId);
      }

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cart),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to store cart: ${response.status}`);
      }

      const data = await response.json();
      dispatch({ type: "SET_CART_URL", payload: data.cartUrl });
    } catch (error) {
      console.error('Error storing cart:', error);
    }
  }, [currentWalletId]);

  // Function to fetch cart from cloud storage
  const fetchCart = useCallback(async () => {
    try {
      const url = new URL(getApiUrl('/cart/storage'));
      if (currentWalletId) {
        url.searchParams.set('walletId', currentWalletId);
      }
      // Add a cache-busting timestamp
      url.searchParams.set('timestamp', Date.now().toString());

      const response = await fetch(url.toString(), {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch cart');
      }

      const data = await response.json();
      dispatch({ type: "UPDATE_CART", payload: data });
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  }, [currentWalletId]);

  // Effect to fetch cart when wallet ID changes
  useEffect(() => {
    console.log('useEffect: wallet ID changed, fetching cart', currentWalletId);
    fetchCart();
  }, [fetchCart, currentWalletId]);

  const addItem = async (item: { id: number; quantity: number }) => {
    try {
      const url = new URL(getApiUrl('/cart/add'));
      if (currentWalletId) {
        url.searchParams.set('walletId', currentWalletId);
      }

      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(item),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Error adding item: ${response.statusText}`);
      }

      const data = await response.json();
      dispatch({ type: "UPDATE_CART", payload: data });
    } catch (error) {
      console.error("Failed to add item:", error);
    }
  };

  const removeItem = async (id: number) => {
    try {
      const url = new URL(getApiUrl('/cart/remove'));
      if (currentWalletId) {
        url.searchParams.set('walletId', currentWalletId);
      }

      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Error removing item: ${response.statusText}`);
      }

      const data = await response.json();
      dispatch({ type: "UPDATE_CART", payload: data });
    } catch (error) {
      console.error("Failed to remove item:", error);
    }
  };

  const updateQuantity = async (id: number, quantity: number) => {
    try {
      const url = new URL(getApiUrl('/cart/update-quantity'));
      if (currentWalletId) {
        url.searchParams.set('walletId', currentWalletId);
      }

      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, quantity }),
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 404) {
          // If item not found, just return without error
          return;
        }
        throw new Error(`Error updating quantity: ${response.statusText}`);
      }

      const data = await response.json();
      dispatch({ type: "UPDATE_CART", payload: data });
    } catch (error) {
      console.error("Failed to update quantity:", error);
    }
  };

  const clearCart = async () => {
    try {
      const url = new URL(getApiUrl('/cart/clear'));
      if (currentWalletId) {
        url.searchParams.set('walletId', currentWalletId);
      }

      const response = await fetch(url.toString(), {
        method: "POST",
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Error clearing cart: ${response.statusText}`);
      }

      const data = await response.json();
      dispatch({ type: "UPDATE_CART", payload: data });
    } catch (error) {
      console.error("Failed to clear cart:", error);
    }
  };

  const toggleCart = () => {
    dispatch({ type: "TOGGLE_CART" });
  };

  const closeCart = () => {
    dispatch({ type: "CLOSE_CART" });
  };

  const setWalletId = (walletId: string | undefined) => {
    setCurrentWalletId(walletId);
  };

  // New effect for periodic cart fetching when closed
  useEffect(() => {
    const intervalTime = 5000; // Fetch every 5 seconds
    let intervalId: NodeJS.Timeout | null = null;

    if (!state.isOpen) {
      // Start polling if cart is closed
      intervalId = setInterval(() => {
        console.log('Polling for cart updates...');
        fetchCart();
      }, intervalTime);
    } else if (intervalId) {
      // Clear interval if cart is opened
      clearInterval(intervalId);
      intervalId = null;
    }

    // Clean up interval on component unmount or dependencies change
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [state.isOpen, fetchCart]); // Rerun effect if cart open state or fetchCart function changes

  return (
    <CartContext.Provider
      value={{
        state,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        toggleCart,
        closeCart,
        fetchCart,
        setWalletId
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
