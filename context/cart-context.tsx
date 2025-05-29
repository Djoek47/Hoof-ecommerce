"use client"

import { createContext, useContext, useReducer, useEffect, type ReactNode, useState, useCallback } from "react"
import type { CartItem, CartState, CartIdentifier } from "@/types/cart"
import { hoodies } from "@/data/products"
import { getApiUrl } from '@/lib/config';

// Define actions that update state based on server response (still used for wallet state)
type CartAction =
  | { type: "HYDRATE"; payload: CartState }
  | { type: "SET_CART_URL"; payload: string } // This might not be needed anymore
  | { type: "UPDATE_CART"; payload: CartState }

interface CartContextType {
  state: CartState // This state will represent either the local or server cart, including isOpen
  addItem: (item: { id: number; quantity: number }) => Promise<void>
  removeItem: (id: number) => Promise<void>
  updateQuantity: (id: number, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  toggleCart: () => void
  closeCart: () => void
  fetchCart: () => Promise<void>
  setWalletId: (walletId: string | undefined) => void
  // Expose local cart items and migration function
  localCartItems: CartItem[]; // Still expose for checking if migration is needed
  migrateLocalCartToWallet: () => Promise<void>;
  currentWalletId: string | undefined; // Expose wallet ID
}

// Initial state for the combined state
const initialState: CartState = {
  items: [],
  isOpen: false,
  cartUrl: '' // May not be relevant for local cart
}

const CartContext = createContext<CartContextType | undefined>(undefined)

// Reducer for server-side cart state (when wallet is connected)
function serverCartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "HYDRATE":
      return { ...state, ...action.payload } // Hydrate with server data
    case "SET_CART_URL": // This might not be strictly needed anymore
      return { ...state, cartUrl: action.payload }
    case "UPDATE_CART":
      // When updating from server, keep the current isOpen state
      return { ...state, ...action.payload, isOpen: state.isOpen };
    default:
      return state
  }
}

// Helper to get local cart from localStorage
function getLocalCart(): CartItem[] {
  try {
    const localCart = localStorage.getItem('localCart');
    // Ensure parsed data is an array and its items have at least an 'id' property
    const parsedCart = localCart ? JSON.parse(localCart) : [];
    if (Array.isArray(parsedCart) && parsedCart.every(item => item && typeof item === 'object' && 'id' in item)) {
      return parsedCart as CartItem[];
    }
    console.error('Invalid local storage cart format.');
    return [];

  } catch (error) {
    console.error('Error reading local storage cart:', error);
    return [];
  }
}

// Helper to save local cart to localStorage
function saveLocalCart(cartItems: CartItem[]) {
  try {
    localStorage.setItem('localCart', JSON.stringify(cartItems));
  } catch (error) {
    console.error('Error saving local storage cart:', error);
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [currentWalletId, setCurrentWalletId] = useState<string | undefined>(undefined);
  // Manage cart items directly with useState when no wallet is connected
  const [localCartItems, setLocalCartItems] = useState<CartItem[]>([]);
  // Manage the server-side cart state (when wallet is connected)
  const [serverCartState, serverCartDispatch] = useReducer(serverCartReducer, initialState);
  // Manage the isOpen state separately
  const [isCartOpen, setIsCartOpen] = useState(initialState.isOpen);
   // Combined state to expose
  const [state, setState] = useState<CartState>(initialState);

  // Effect to load local cart from storage on mount
  useEffect(() => {
    if (!currentWalletId) {
      setLocalCartItems(getLocalCart());
    }
  }, [currentWalletId]); // Rerun if wallet ID changes (to potentially clear local cart)

  // Effect to update combined state when local or server state changes, including isOpen
  useEffect(() => {
    if (currentWalletId) {
      // When wallet is connected, combine server state with current isCartOpen
      setState({ ...serverCartState, isOpen: isCartOpen });
    } else {
      // When no wallet, combine local items with initialState and current isCartOpen
      setState({ ...initialState, items: localCartItems, isOpen: isCartOpen });
    }
  }, [currentWalletId, localCartItems, serverCartState, isCartOpen]); // Depend on all relevant state pieces

  // Function to fetch cart from cloud storage (only when wallet is connected)
  const fetchCart = useCallback(async () => {
    if (!currentWalletId) {
      console.log('fetchCart: No wallet connected, not fetching from server.');
      return;
    }
    try {
      const url = new URL(getApiUrl('/cart/storage'));
      url.searchParams.set('walletId', currentWalletId);
      // Add a cache-busting timestamp
      url.searchParams.set('timestamp', Date.now().toString());

      const response = await fetch(url.toString(), {
        credentials: 'include'
      });

      if (!response.ok) {
        // If 400, it means walletId might be invalid or server expects different format now
        if (response.status === 400) {
           console.error('Invalid wallet ID provided to server cart storage GET.');
           // Handle this case, maybe clear walletId or show an error
           // setCurrentWalletId(undefined); // Or handle externally
        }
        throw new Error('Failed to fetch wallet cart');
      }

      const data = await response.json();
      serverCartDispatch({ type: "UPDATE_CART", payload: data });
    } catch (error) {
      console.error('Error fetching wallet cart:', error);
      // Optionally reset server cart state on error
      // serverCartDispatch({ type: "UPDATE_CART", payload: initialState });
    }
  }, [currentWalletId]); // Depend on currentWalletId

  // Effect to fetch cart when wallet ID changes (only if walletId is defined)
  useEffect(() => {
    let isMounted = true;

    const loadCart = async () => {
      if (isMounted && currentWalletId) { // Only fetch if mounted and walletId exists
        console.log('useEffect: wallet ID set, fetching wallet cart', currentWalletId);
        await fetchCart();
      }
    };

    loadCart();

    return () => {
      isMounted = false;
    };
  }, [fetchCart, currentWalletId]);

  // Function to add item (handles local or server cart)
  const addItem = async (item: { id: number; quantity: number }) => {
    if (!currentWalletId) {
      // Add to local storage cart
      const currentItems = getLocalCart();
      const existingItemIndex = currentItems.findIndex((cartItem) => cartItem.id === item.id);
      let newItems;
      if (existingItemIndex > -1) {
        newItems = [...currentItems];
        newItems[existingItemIndex].quantity += item.quantity;
      } else {
        // Need product details for local storage item
        const productToAdd = hoodies.find(product => product.id === item.id);
        if (!productToAdd) {
           console.error(`Product with id ${item.id} not found for local cart.`);
           return;
        }
         newItems = [...currentItems, { ...productToAdd, quantity: item.quantity }];
      }
      saveLocalCart(newItems);
      setLocalCartItems(newItems);
    } else {
      // Add to server cart
      try {
        const url = new URL(getApiUrl('/cart/add'));
        url.searchParams.set('walletId', currentWalletId);

        const response = await fetch(url.toString(), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(item),
          credentials: 'include'
        });

        if (!response.ok) {
          // If 400, walletId might be invalid
           if (response.status === 400) {
               console.error('Invalid wallet ID provided to server cart add endpoint.');
               // Handle this case, e.g., disconnect wallet
               // setCurrentWalletId(undefined); // Or handle externally
           }
          throw new Error(`Error adding item to wallet cart: ${response.statusText}`);
        }

        const data = await response.json();
        serverCartDispatch({ type: "UPDATE_CART", payload: data });
      } catch (error) {
        console.error("Failed to add item to wallet cart:", error);
      }
    }
  };

  // Function to remove item (handles local or server cart)
  const removeItem = async (id: number) => {
     if (!currentWalletId) {
       // Remove from local storage cart
       const currentItems = getLocalCart();
       const newItems = currentItems.filter(item => item.id !== id);
       saveLocalCart(newItems);
       setLocalCartItems(newItems);
     } else {
      // Remove from server cart
      try {
        const url = new URL(getApiUrl('/cart/remove'));
        url.searchParams.set('walletId', currentWalletId);

        const response = await fetch(url.toString(), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id }),
          credentials: 'include'
        });

        if (!response.ok) {
           // If 400, walletId might be invalid
           if (response.status === 400) {
               console.error('Invalid wallet ID provided to server cart remove endpoint.');
               // Handle this case, e.g., disconnect wallet
               // setCurrentWalletId(undefined); // Or handle externally
           }
          throw new Error(`Error removing item from wallet cart: ${response.statusText}`);
        }

        const data = await response.json();
        serverCartDispatch({ type: "UPDATE_CART", payload: data });
      } catch (error) {
        console.error("Failed to remove item from wallet cart:", error);
      }
     }
  };

  // Function to update quantity (handles local or server cart)
  const updateQuantity = async (id: number, quantity: number) => {
    if (!currentWalletId) {
      // Update quantity in local storage cart
      const currentItems = getLocalCart();
      const existingItemIndex = currentItems.findIndex((cartItem) => cartItem.id === id);
      if (existingItemIndex > -1) {
        const newItems = [...currentItems];
        if (quantity <= 0) {
           newItems.splice(existingItemIndex, 1);
        } else {
           newItems[existingItemIndex].quantity = quantity;
        }
        saveLocalCart(newItems);
        setLocalCartItems(newItems);
      } else {
          console.log(`Item with id ${id} not found in local cart for quantity update.`);
      }
    } else {
      // Update quantity in server cart
      try {
        const url = new URL(getApiUrl('/cart/update-quantity'));
        url.searchParams.set('walletId', currentWalletId);

        const response = await fetch(url.toString(), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id, quantity }),
          credentials: 'include'
        });

        if (!response.ok) {
          // If item not found on server, it might have been removed elsewhere
          if (response.status === 404) {
             console.log(`Item with id ${id} not found on server cart for quantity update.`);
             // Optionally refetch server cart to sync state
             fetchCart();
             return;
          }
           // If 400, walletId might be invalid
           if (response.status === 400) {
               console.error('Invalid wallet ID provided to server cart update endpoint.');
               // Handle this case, e.g., disconnect wallet
               // setCurrentWalletId(undefined); // Or handle externally
           }
          throw new Error(`Error updating quantity in wallet cart: ${response.statusText}`);
        }

        const data = await response.json();
        serverCartDispatch({ type: "UPDATE_CART", payload: data });
      } catch (error) {
        console.error("Failed to update quantity in wallet cart:", error);
      }
    }
  };

  // Function to clear cart (handles local or server cart)
  const clearCart = async () => {
    if (!currentWalletId) {
      // Clear local storage cart
      saveLocalCart([]);
      setLocalCartItems([]);
    } else {
      // Clear server cart
      try {
        const url = new URL(getApiUrl('/cart/clear'));
        url.searchParams.set('walletId', currentWalletId);

        const response = await fetch(url.toString(), {
          method: "POST",
          credentials: 'include'
        });

        if (!response.ok) {
           // If 400, walletId might be invalid
           if (response.status === 400) {
               console.error('Invalid wallet ID provided to server cart clear endpoint.');
               // Handle this case, e.g., disconnect wallet
               // setCurrentWalletId(undefined); // Or handle externally
           }
          throw new Error(`Error clearing wallet cart: ${response.statusText}`);
        }

        const data = await response.json();
        serverCartDispatch({ type: "UPDATE_CART", payload: data });
      } catch (error) {
        console.error("Failed to clear wallet cart:", error);
      }
    }
  };

  const toggleCart = () => {
     setIsCartOpen(prevState => !prevState);
  };

  const closeCart = () => {
      setIsCartOpen(false);
  };

  // Function to migrate local cart to wallet cart
  const migrateLocalCartToWallet = useCallback(async () => {
     if (!currentWalletId || localCartItems.length === 0) {
        console.log('Migration not needed or not possible.');
        return;
     }

     console.log('Initiating local cart migration to wallet...');
     try {
        const url = new URL(getApiUrl('/cart/migrate-local'));
        url.searchParams.set('walletId', currentWalletId);

        const response = await fetch(url.toString(), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ items: localCartItems }),
          credentials: 'include'
        });

        if (!response.ok) {
           // If 400, walletId might be invalid
           if (response.status === 400) {
               console.error('Invalid wallet ID provided to server cart migrate endpoint.');
               // Handle this case, e.g., disconnect wallet
               // setCurrentWalletId(undefined); // Or handle externally
           }
          throw new Error(`Error migrating local cart: ${response.statusText}`);
        }

        console.log('Local cart migration successful.');
        // Clear local storage after successful migration
        saveLocalCart([]);
        setLocalCartItems([]);
        // Fetch the merged server cart state to update the UI
        fetchCart();

     } catch (error) {
       console.error('Failed to migrate local cart:', error);
       // Decide how to handle migration errors (e.g., leave items in local storage, show error message)
     }
  }, [currentWalletId, localCartItems, fetchCart]); // Dependencies for useCallback

  // Function to set wallet ID
  const setWalletId = (walletId: string | undefined) => {
    const previousWalletId = currentWalletId;
    setCurrentWalletId(walletId);

    // If disconnecting wallet, clear server cart state and load local cart
    if (!walletId && previousWalletId) {
       serverCartDispatch({ type: "UPDATE_CART", payload: initialState });
       setLocalCartItems(getLocalCart());
    }
    // Migration is manual
  };

  // New effect for periodic cart fetching when closed and wallet is connected
  useEffect(() => {
    const intervalTime = 5000; // Fetch every 5 seconds
    let intervalId: NodeJS.Timeout | null = null;

    // Only poll if wallet is connected and cart is closed
    // And only if the cart is managed server-side (i.e., wallet is connected)
    // Use isCartOpen to determine if the cart UI is closed
    if (!isCartOpen && currentWalletId) {
      // Start polling if cart is closed
      console.log('Starting wallet cart polling...');
      intervalId = setInterval(() => {
        console.log('Polling for wallet cart updates...');
        fetchCart();
      }, intervalTime);
    } else {
       // Clear interval if cart is opened or wallet is not connected
      if (intervalId) {
        console.log('Stopping wallet cart polling...');
        clearInterval(intervalId);
        intervalId = null;
      }
    }

    // Clean up interval on component unmount or dependencies change
    return () => {
      if (intervalId) {
        console.log('Cleaning up wallet cart polling interval...');
        clearInterval(intervalId);
      }
    };
  }, [isCartOpen, fetchCart, currentWalletId]); // Depend on isCartOpen, fetchCart function, and wallet ID

  return (
    <CartContext.Provider
      value={{
        state: { ...state, isOpen: isCartOpen }, // Pass the combined state including isCartOpen
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        toggleCart,
        closeCart,
        fetchCart,
        setWalletId,
        // Expose new values
        localCartItems,
        migrateLocalCartToWallet,
        currentWalletId,
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
