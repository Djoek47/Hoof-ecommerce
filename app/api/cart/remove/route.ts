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
    const { id }: { id: number } = await req.json();
    const walletId = req.nextUrl.searchParams.get('walletId');

    // ** Require walletId **
    if (!walletId) {
      return NextResponse.json({ message: 'Wallet not connected. Cannot remove from server cart.' }, { status: 400 });
    }

    if (typeof id !== 'number') {
      return NextResponse.json({ message: 'Invalid item ID provided.' }, { status: 400 });
    }

    // Get cart identifier (will only return wallet type now)
    const identifier = await getCartIdentifier(walletId);

    // If getCartIdentifier returns undefined, it means walletId was missing (should be caught above, but as a safeguard)
    if (!identifier) {
         return NextResponse.json({ message: 'Invalid wallet identifier.' }, { status: 400 });
    }

    const cartPath = getCartPath(identifier);

    // Fetch current cart for the wallet
    console.log(`[remove] Attempting to fetch cart from: ${BUCKET_NAME}/${cartPath}`);
    const file = storage.bucket(BUCKET_NAME).file(cartPath);
    const [exists] = await file.exists();

    let cart: CartState;

    if (!exists) {
       console.log(`[remove] Cart file not found for wallet: ${cartPath}. Nothing to remove.`);
       return NextResponse.json({ ...EMPTY_CART, cartIdentifier: identifier }); // Return empty cart if it doesn't exist
    } else {
      console.log(`[remove] Cart file found for wallet: ${cartPath}. Downloading...`);
      const [fileContents] = await file.download();
      try {
        cart = JSON.parse(fileContents.toString());
        console.log('[remove] Successfully parsed wallet cart JSON.');
      } catch (parseError) {
        console.error('[remove] Error parsing wallet cart JSON:', parseError);
        // If parsing fails, return an error
         return NextResponse.json({ message: 'Failed to load wallet cart.' }, { status: 500 });
      }
    }

    // Remove item from the cart
    cart.items = cart.items.filter((item) => item.id !== id);

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
    console.error('Error removing item from cart:', error);
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