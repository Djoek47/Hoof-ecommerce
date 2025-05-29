import { NextRequest, NextResponse } from 'next/server';
import { getCartIdentifier, getCartPath } from '@/lib/cart-utils';
import { uploadFile } from '@/lib/storage';
import { CartState } from '@/types/cart';
import { storage } from '@/lib/storage';

const BUCKET_NAME = 'djt45test';

// Empty cart template
const EMPTY_CART: CartState = {
  items: [],
  isOpen: false,
  cartUrl: ''
};

export async function POST(req: NextRequest) {
  try {
    const { id }: { id: number } = await req.json();
    const walletId = req.nextUrl.searchParams.get('walletId');

    if (typeof id !== 'number') {
      return NextResponse.json({ message: 'Invalid item ID provided.' }, { status: 400 });
    }

    // Get cart identifier and path
    const identifier = await getCartIdentifier(walletId || undefined);
    const cartPath = getCartPath(identifier);

    // Fetch current cart
    console.log(`[remove] Attempting to fetch cart from: ${BUCKET_NAME}/${cartPath}`);
    const file = storage.bucket(BUCKET_NAME).file(cartPath);
    const [exists] = await file.exists();

    let cart: CartState;

    if (!exists) {
      console.log(`[remove] Cart file not found: ${cartPath}. Returning empty cart.`);
      cart = { ...EMPTY_CART };
    } else {
      console.log(`[remove] Cart file found: ${cartPath}. Downloading...`);
      const [fileContents] = await file.download();
      try {
        cart = JSON.parse(fileContents.toString());
        console.log('[remove] Successfully parsed cart JSON.');
      } catch (parseError) {
        console.error('[remove] Error parsing cart JSON:', parseError);
        cart = { ...EMPTY_CART };
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

    return NextResponse.json({
      ...cart,
      cartUrl: `https://storage.googleapis.com/${BUCKET_NAME}/${cartPath}`
    });

  } catch (error) {
    console.error('Error removing item from cart:', error);
    return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
  }
} 