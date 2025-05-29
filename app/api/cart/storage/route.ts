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

export async function GET(req: NextRequest) {
  try {
    // Get wallet ID from query params if available
    const walletId = req.nextUrl.searchParams.get('walletId');

    // ** Require walletId for GET requests to server storage **
    if (!walletId) {
        // If no walletId, return an empty cart and indicate no server-side cart is loaded
        console.log('[GET /storage] No wallet ID provided. Returning empty cart.');
        return NextResponse.json({ ...EMPTY_CART, message: 'No wallet connected.' });
    }

    const identifier = await getCartIdentifier(walletId);

     // If getCartIdentifier returns undefined, it means walletId was missing (should be caught above, but as a safeguard)
    if (!identifier) {
         return NextResponse.json({ message: 'Invalid wallet identifier.' }, { status: 400 });
    }

    const cartPath = getCartPath(identifier);

    console.log(`[GET /storage] Attempting to fetch cart from: ${BUCKET_NAME}/${cartPath}`);

    // Fetch cart from storage using the storage library
    const file = storage.bucket(BUCKET_NAME).file(cartPath);
    const [exists] = await file.exists();

    let cart: CartState;

    if (!exists) {
      console.log(`[GET /storage] Cart file not found for wallet: ${cartPath}. Returning empty cart.`);
      // If cart doesn't exist for this wallet, return empty cart
      cart = { ...EMPTY_CART };
    } else {
      console.log(`[GET /storage] Cart file found for wallet: ${cartPath}. Downloading...`);
      const [fileContents] = await file.download();
      try {
        cart = JSON.parse(fileContents.toString());
        console.log('[GET /storage] Successfully parsed wallet cart JSON.');
      } catch (parseError) {
        console.error('[GET /storage] Error parsing wallet cart JSON:', parseError);
        // If parsing fails, return an error or an empty cart
         return NextResponse.json({ message: 'Failed to load wallet cart.' }, { status: 500 });
        // Or: cart = { ...EMPTY_CART };
      }
    }

    return NextResponse.json({
      ...cart,
      cartUrl: `https://storage.googleapis.com/${BUCKET_NAME}/${cartPath}`,
      cartIdentifier: identifier,
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get wallet ID from query params if available
    const walletId = req.nextUrl.searchParams.get('walletId');

     // ** Require walletId for POST requests to server storage **
    if (!walletId) {
        return NextResponse.json({ message: 'Wallet not connected. Cannot save to server cart.' }, { status: 400 });
    }

    const identifier = await getCartIdentifier(walletId);
    
    // If getCartIdentifier returns undefined, it means walletId was missing (should be caught above, but as a safeguard)
    if (!identifier) {
         return NextResponse.json({ message: 'Invalid wallet identifier.' }, { status: 400 });
    }

    const cartPath = getCartPath(identifier);
    
    // Validate the request body
    const cart: CartState = await req.json();
    
    // Upload the cart to storage
    await uploadFile(
      Buffer.from(JSON.stringify(cart)),
      cartPath,
      'application/json'
    );

     // Fetch the updated cart data to return the latest state including the cartIdentifier
    const updatedCart = await fetchCartData(identifier);

    return NextResponse.json(updatedCart);

  } catch (error) {
    console.error('Error storing cart:', error);
    return NextResponse.json({ error: 'Failed to store cart' }, { status: 500 });
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