import { NextRequest, NextResponse } from 'next/server';
import { getCartIdentifier, getCartPath } from '@/lib/cart-utils';
import { uploadFile } from '@/lib/storage';
import { CartState, CartIdentifier } from '@/types/cart';
import { storage } from '@/lib/storage';

const BUCKET_NAME = 'djt45test';

// Empty cart template - primarily for initialization or errors
const EMPTY_CART: CartState = {
  items: [],
  isOpen: false,
  cartUrl: ''
};

export async function POST(req: NextRequest) {
  try {
    const { id, quantity }: { id: number; quantity: number } = await req.json();
    const walletId = req.nextUrl.searchParams.get('walletId');

    // ** Require walletId **
    if (!walletId) {
      return NextResponse.json({ message: 'Wallet not connected. Cannot update server cart.' }, { status: 400 });
    }

    if (typeof id !== 'number' || typeof quantity !== 'number' || quantity < 0) { // Allow quantity 0 to remove item
      return NextResponse.json({ message: 'Invalid item ID or quantity provided.' }, { status: 400 });
    }

    // Get cart identifier (will only return wallet type now)
    const identifier = await getCartIdentifier(walletId);

    // If getCartIdentifier returns undefined, it means walletId was missing (should be caught above, but as a safeguard)
    if (!identifier) {
         return NextResponse.json({ message: 'Invalid wallet identifier.' }, { status: 400 });
    }

    const cartPath = getCartPath(identifier);

    // Fetch current cart for the wallet
    console.log(`[update-quantity] Attempting to fetch cart from: ${BUCKET_NAME}/${cartPath}`);
    const file = storage.bucket(BUCKET_NAME).file(cartPath);
    const [exists] = await file.exists();

    let cart: CartState;

    if (!exists) {
       console.log(`[update-quantity] Cart file not found for wallet: ${cartPath}. Cannot update item quantity.`);
       return NextResponse.json({ message: 'Wallet cart not found.' }, { status: 404 });
    } else {
      console.log(`[update-quantity] Cart file found for wallet: ${cartPath}. Downloading...`);
      const [fileContents] = await file.download();
      try {
        cart = JSON.parse(fileContents.toString());
        console.log('[update-quantity] Successfully parsed wallet cart JSON.');
      } catch (parseError) {
        console.error('[update-quantity] Error parsing wallet cart JSON:', parseError);
        // If parsing fails, return an error
         return NextResponse.json({ message: 'Failed to load wallet cart.' }, { status: 500 });
      }
    }

    // Find the item in the cart
    const existingItemIndex = cart.items.findIndex((cartItem) => cartItem.id === id);

    if (existingItemIndex > -1) {
      if (quantity <= 0) {
        // Remove item if quantity is 0 or less
        cart.items.splice(existingItemIndex, 1);
      } else {
        // Update quantity
        cart.items[existingItemIndex].quantity = quantity;
      }
    } else {
      // If item not found in cart, return 404
       console.log(`[update-quantity] Item with ID ${id} not found in wallet cart.`);
       return NextResponse.json({ message: 'Item not found in cart.' }, { status: 404 });
    }

    // Upload updated cart
    await uploadFile(
      Buffer.from(JSON.stringify(cart)),
      cartPath,
      'application/json'
    );

     // Fetch the updated cart data to return the latest state including the cartIdentifier
    const updatedCart = await fetchCartData(identifier);

    return NextResponse.json(updatedCart);

  } catch (error) {
    console.error('Error updating item quantity in cart:', error);
    return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
  }
}

// Helper function to fetch cart data after an update
async function fetchCartData(identifier: Required<CartIdentifier>): Promise<CartState & { cartIdentifier: CartIdentifier }> {
    const cartPath = getCartPath(identifier);
    const file = storage.bucket(BUCKET_NAME).file(cartPath);
    const [fileContents] = await file.download();
    const cart = JSON.parse(fileContents.toString());
    return { ...cart, cartIdentifier: identifier };
} 