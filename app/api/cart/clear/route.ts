import { NextRequest, NextResponse } from 'next/server';
import * as Iron from '@hapi/iron';
import { serialize, parse } from 'cookie';
import { uploadFile } from '@/lib/storage';
import { CartState, CartIdentifier } from '@/types/cart';
import { getCartIdentifier, getCartPath } from '@/lib/cart-utils';
import { storage } from '@/lib/storage';

const SESSION_SECRET = process.env.SESSION_SECRET as string;
const COOKIE_NAME = 'app_session';
const BUCKET_NAME = 'djt45test';

// Helper function to seal (encrypt) data
async function sealData(data: any) {
  return Iron.seal(data, SESSION_SECRET, Iron.defaults);
}

// Helper function to unseal (decrypt) data (although not strictly needed for clearing, good to have)
async function unsealData(sealedData: string) {
  try {
    return await Iron.unseal(sealedData, SESSION_SECRET, Iron.defaults);
  } catch (error) {
    return null;
  }
}

// Empty cart template
const EMPTY_CART: CartState = {
  items: [],
  isOpen: false,
  cartUrl: ''
};

export async function POST(req: NextRequest) {
  try {
    const walletId = req.nextUrl.searchParams.get('walletId');

    // ** Require walletId **
    if (!walletId) {
      return NextResponse.json({ message: 'Wallet not connected. Cannot clear server cart.' }, { status: 400 });
    }

    // Get cart identifier (will only return wallet type now)
    const identifier = await getCartIdentifier(walletId);

     // If getCartIdentifier returns undefined, it means walletId was missing (should be caught above, but as a safeguard)
    if (!identifier) {
         return NextResponse.json({ message: 'Invalid wallet identifier.' }, { status: 400 });
    }

    const cartPath = getCartPath(identifier);

    // Clear the cart by uploading an empty cart state for the wallet
    console.log(`[clear] Attempting to clear cart for wallet: ${cartPath}`);
    await uploadFile(
      Buffer.from(JSON.stringify(EMPTY_CART)),
      cartPath,
      'application/json'
    );

     // Fetch the updated cart data to return the latest state including the cartIdentifier
    const updatedCart = await fetchCartData(identifier);

    return NextResponse.json(updatedCart);

  } catch (error) {
    console.error('Error clearing cart:', error);
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