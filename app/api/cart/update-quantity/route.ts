import { NextRequest, NextResponse } from 'next/server';
import { getCartIdentifier, getCartPath } from '@/lib/cart-utils';
import { uploadFile } from '@/lib/storage';
import { CartState } from '@/types/cart';
import { storage } from '@/lib/storage'; // Import the storage instance

const BUCKET_NAME = 'djt45test';

// Empty cart template
const EMPTY_CART: CartState = {
  items: [],
  isOpen: false,
  cartUrl: ''
};

export async function POST(req: NextRequest) {
  try {
    const { id, quantity }: { id: number; quantity: number } = await req.json();
    const walletId = req.nextUrl.searchParams.get('walletId');

    console.log(`[update-quantity] Received request: id=${id}, quantity=${quantity}, walletId=${walletId}`);

    if (typeof id !== 'number' || typeof quantity !== 'number' || quantity < 0) {
      return NextResponse.json({ message: 'Invalid item ID or quantity provided.' }, { status: 400 });
    }

    // Get cart identifier and path
    const identifier = await getCartIdentifier(walletId || undefined);
    const cartPath = getCartPath(identifier);

    // Fetch current cart
    console.log(`[update-quantity] Attempting to fetch cart from: ${BUCKET_NAME}/${cartPath}`);
    const file = storage.bucket(BUCKET_NAME).file(cartPath);
    const [exists] = await file.exists();

    let cart: CartState;

    if (!exists) {
      console.log(`[update-quantity] Cart file not found: ${cartPath}. Returning empty cart.`);
      cart = { ...EMPTY_CART };
    } else {
      console.log(`[update-quantity] Cart file found: ${cartPath}. Downloading...`);
      const [fileContents] = await file.download();
      try {
        cart = JSON.parse(fileContents.toString());
        console.log('[update-quantity] Successfully parsed cart JSON.');
      } catch (parseError) {
        console.error('[update-quantity] Error parsing cart JSON:', parseError);
        cart = { ...EMPTY_CART };
      }
    }

    console.log('[update-quantity] Fetched cart state:', JSON.stringify(cart));

    // Find the item to update
    const itemIndex = cart.items.findIndex(item => item.id === id);

    console.log('[update-quantity] Item index found:', itemIndex);

    if (itemIndex === -1) {
      // If item not found and quantity is 0, return success (nothing to do)
      if (quantity === 0) {
        return NextResponse.json({
          ...cart,
          cartUrl: `https://storage.googleapis.com/${BUCKET_NAME}/${cartPath}`
        });
      }
      // If item not found and quantity > 0, return 404
      return NextResponse.json({ message: 'Item not found in cart.' }, { status: 404 });
    }

    // Update or remove item
    if (quantity === 0) {
      // Remove item if quantity is 0
      cart.items.splice(itemIndex, 1);
      console.log(`[update-quantity] Removed item with id ${id}.`);
    } else {
      // Update quantity
      cart.items[itemIndex].quantity = quantity;
      console.log(`[update-quantity] Updated quantity for item id ${id} to ${quantity}.`);
    }

    console.log('[update-quantity] Cart state after update:', JSON.stringify(cart));

    // Upload updated cart
    console.log('[update-quantity] Calling uploadFile...');
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
    console.error('Error updating item quantity in cart:', error);
    return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
  }
} 