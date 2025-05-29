import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';
import { CartState } from '@/types/cart';
import { storage } from '@/lib/storage';

const CART_COOKIE_NAME = 'cart_session_id';
const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const BUCKET_NAME = 'djt45test';

export type CartIdentifier = {
  type: 'guest' | 'wallet';
  id: string;
};

export async function getCartIdentifier(walletId?: string): Promise<CartIdentifier> {
  if (walletId) {
    return {
      type: 'wallet',
      id: walletId
    };
  }

  const cookieStore = await cookies();
  let cartSessionId = cookieStore.get(CART_COOKIE_NAME)?.value;

  if (!cartSessionId) {
    cartSessionId = uuidv4();
    const cookie: ResponseCookie = {
      name: CART_COOKIE_NAME,
      value: cartSessionId,
      maxAge: CART_COOKIE_MAX_AGE,
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    };
    cookieStore.set(cookie);
  }

  return {
    type: 'guest',
    id: cartSessionId
  };
}

export function getCartPath(identifier: CartIdentifier): string {
  const basePath = identifier.type === 'wallet' ? 'wallets' : 'guests';
  return `${basePath}/${identifier.id}/cart.json`;
}

export async function validateCartSession(sessionId: string): Promise<boolean> {
  const cookieStore = await cookies();
  const storedSessionId = cookieStore.get(CART_COOKIE_NAME)?.value;
  return storedSessionId === sessionId;
}

export async function migrateGuestCartToWallet(guestSessionId: string, walletId: string): Promise<void> {
  try {
    // Get guest cart path
    const guestIdentifier: CartIdentifier = { type: 'guest', id: guestSessionId };
    const guestPath = getCartPath(guestIdentifier);
    
    // Get wallet cart path
    const walletIdentifier: CartIdentifier = { type: 'wallet', id: walletId };
    const walletPath = getCartPath(walletIdentifier);

    console.log(`[migrateGuestCartToWallet] Attempting to fetch guest cart from: ${BUCKET_NAME}/${guestPath}`);
    // Fetch guest cart using the storage library
    const guestFile = storage.bucket(BUCKET_NAME).file(guestPath);
    const [guestExists] = await guestFile.exists();

    let guestCart: CartState;

    if (!guestExists) {
      console.log('[migrateGuestCartToWallet] No guest cart to migrate');
      return;
    } else {
      console.log(`[migrateGuestCartToWallet] Guest cart file found: ${guestPath}. Downloading...`);
      const [guestFileContents] = await guestFile.download();
      try {
        guestCart = JSON.parse(guestFileContents.toString());
        console.log('[migrateGuestCartToWallet] Successfully parsed guest cart JSON.');
      } catch (parseError) {
        console.error('[migrateGuestCartToWallet] Error parsing guest cart JSON:', parseError);
        throw new Error('Failed to parse guest cart data'); // Throw error if guest cart is unreadable
      }
    }

    console.log(`[migrateGuestCartToWallet] Attempting to fetch wallet cart from: ${BUCKET_NAME}/${walletPath}`);
    // Fetch existing wallet cart using the storage library if any
    const walletFile = storage.bucket(BUCKET_NAME).file(walletPath);
    const [walletExists] = await walletFile.exists();
    
    let walletCart: CartState;

    if (walletExists) {
      console.log(`[migrateGuestCartToWallet] Wallet cart file found: ${walletPath}. Downloading...`);
      const [walletFileContents] = await walletFile.download();
      try {
        walletCart = JSON.parse(walletFileContents.toString());
        console.log('[migrateGuestCartToWallet] Successfully parsed wallet cart JSON.');
      } catch (parseError) {
        console.error('[migrateGuestCartToWallet] Error parsing wallet cart JSON:', parseError);
        // If parsing fails, treat as if no wallet cart exists
        walletCart = { items: [], isOpen: false, cartUrl: `https://storage.googleapis.com/${BUCKET_NAME}/${walletPath}` };
      }
      
      // If wallet cart exists, merge items
      const mergedItems = [...walletCart.items];

      // Add items from guest cart, combining quantities for same items
      guestCart.items.forEach(guestItem => {
        const existingItemIndex = mergedItems.findIndex(item => item.id === guestItem.id);
        if (existingItemIndex > -1) {
          mergedItems[existingItemIndex].quantity += guestItem.quantity;
        } else {
          mergedItems.push(guestItem);
        }
      });

      walletCart.items = mergedItems;
    } else {
      // If no wallet cart exists, use guest cart
      walletCart = guestCart;
    }

    // Upload merged cart to wallet location
    await fetch('/api/cart/storage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...walletCart,
        cartUrl: `https://storage.googleapis.com/${BUCKET_NAME}/${walletPath}`
      })
    });

    // Clear guest cart
    await fetch('/api/cart/storage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [],
        isOpen: false,
        cartUrl: `https://storage.googleapis.com/${BUCKET_NAME}/${guestPath}`
      })
    });

  } catch (error) {
    console.error('Error migrating guest cart to wallet:', error);
    throw error;
  }
} 