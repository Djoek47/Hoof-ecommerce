import { NextRequest, NextResponse } from 'next/server';
import { getCartIdentifier, getCartPath } from '@/lib/cart-utils';
import { uploadFile } from '@/lib/storage';
import { CartState } from '@/types/cart';
import { hoodies } from '@/data/products';
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
    const { id, quantity }: { id: number; quantity: number } = await req.json();
    const walletId = req.nextUrl.searchParams.get('walletId');

    if (typeof id !== 'number' || typeof quantity !== 'number' || quantity <= 0) {
      return NextResponse.json({ message: 'Invalid item ID or quantity provided.' }, { status: 400 });
    }

    // Find the product in your product data
    const productToAdd = hoodies.find(hoodie => hoodie.id === id);

    if (!productToAdd) {
      return NextResponse.json({ message: 'Product not found.' }, { status: 404 });
    }

    // Get cart identifier and path
    const identifier = await getCartIdentifier(walletId || undefined);
    const cartPath = getCartPath(identifier);

    // Fetch current cart
    console.log(`[add] Attempting to fetch cart from: ${BUCKET_NAME}/${cartPath}`);
    const file = storage.bucket(BUCKET_NAME).file(cartPath);
    const [exists] = await file.exists();

    let cart: CartState;

    if (!exists) {
      console.log(`[add] Cart file not found: ${cartPath}. Returning empty cart.`);
      cart = { ...EMPTY_CART };
    } else {
      console.log(`[add] Cart file found: ${cartPath}. Downloading...`);
      const [fileContents] = await file.download();
      try {
        cart = JSON.parse(fileContents.toString());
        console.log('[add] Successfully parsed cart JSON.');
      } catch (parseError) {
        console.error('[add] Error parsing cart JSON:', parseError);
        cart = { ...EMPTY_CART };
      }
    }

    // Create the cart item with full product details
    const item = {
      id: productToAdd.id,
      name: productToAdd.name,
      price: productToAdd.price,
      quantity: quantity,
      image1: productToAdd.image1,
      image2: productToAdd.image2,
    };

    // Add or update item in the cart
    const existingItemIndex = cart.items.findIndex((cartItem) => cartItem.id === item.id);

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += item.quantity;
    } else {
      cart.items.push(item);
    }

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
    console.error('Error adding item to cart:', error);
    return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
  }
} 