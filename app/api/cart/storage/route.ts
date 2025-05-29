import { NextRequest, NextResponse } from 'next/server';
import { getCartIdentifier, getCartPath } from '@/lib/cart-utils';
import { uploadFile } from '@/lib/storage';
import { CartState } from '@/types/cart';
import { storage } from '@/lib/storage'; // Import the storage instance

// Empty cart template
const EMPTY_CART: CartState = {
  items: [],
  isOpen: false,
  cartUrl: ''
};

const BUCKET_NAME = 'djt45test';

export async function GET(req: NextRequest) {
  try {
    // Get wallet ID from query params if available
    const walletId = req.nextUrl.searchParams.get('walletId');
    const identifier = await getCartIdentifier(walletId || undefined);
    const cartPath = getCartPath(identifier);

    console.log(`[GET /storage] Attempting to fetch cart from: ${BUCKET_NAME}/${cartPath}`);

    // Fetch cart from storage using the storage library
    const file = storage.bucket(BUCKET_NAME).file(cartPath);
    const [exists] = await file.exists();

    let cart: CartState;

    if (!exists) {
      console.log(`[GET /storage] Cart file not found: ${cartPath}. Returning empty cart.`);
      // If cart doesn't exist, return empty cart
      cart = { ...EMPTY_CART };
    } else {
      console.log(`[GET /storage] Cart file found: ${cartPath}. Downloading...`);
      const [fileContents] = await file.download();
      try {
        cart = JSON.parse(fileContents.toString());
        console.log('[GET /storage] Successfully parsed cart JSON.');
      } catch (parseError) {
        console.error('[GET /storage] Error parsing cart JSON:', parseError);
        // If parsing fails, return empty cart to avoid errors
        cart = { ...EMPTY_CART };
      }
    }

    return NextResponse.json({
      ...cart,
      cartUrl: `https://storage.googleapis.com/${BUCKET_NAME}/${cartPath}` // Still provide the URL for reference
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
    const identifier = await getCartIdentifier(walletId || undefined);
    const cartPath = getCartPath(identifier);
    
    // Validate the request body
    const cart: CartState = await req.json();
    
    // Upload the cart to storage
    await uploadFile(
      Buffer.from(JSON.stringify(cart)),
      cartPath,
      'application/json'
    );

    return NextResponse.json({
      ...cart,
      cartUrl: `https://storage.googleapis.com/${BUCKET_NAME}/${cartPath}`
    });
  } catch (error) {
    console.error('Error storing cart:', error);
    return NextResponse.json({ error: 'Failed to store cart' }, { status: 500 });
  }
} 