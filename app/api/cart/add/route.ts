import { NextRequest, NextResponse } from 'next/server';
import { getCartIdentifier, getCartPath } from '@/lib/cart-utils';
import { uploadFile } from '@/lib/storage';
import { CartState, CartIdentifier } from '@/types/cart';
import { hoodies } from '@/data/products';
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
      return NextResponse.json({ message: 'Wallet not connected. Cannot add to server cart.' }, { status: 400 });
    }

    if (typeof id !== 'number' || typeof quantity !== 'number' || quantity <= 0) {
      return NextResponse.json({ message: 'Invalid item ID or quantity provided.' }, { status: 400 });
    }

    const productToAdd = hoodies.find(hoodie => hoodie.id === id);

    if (!productToAdd) {
      return NextResponse.json({ message: 'Product not found.' }, { status: 404 });
    }

    // Get cart identifier (will only return wallet type now)
    const identifier = await getCartIdentifier(walletId);
    
    // If getCartIdentifier returns undefined, it means walletId was missing (should be caught above, but as a safeguard)
    if (!identifier) {
         return NextResponse.json({ message: 'Invalid wallet identifier.' }, { status: 400 });
    }

    const cartPath = getCartPath(identifier);

    // Fetch current cart for the wallet
    console.log(`[add] Attempting to fetch cart from: ${BUCKET_NAME}/${cartPath}`);
    const file = storage.bucket(BUCKET_NAME).file(cartPath);
    const [exists] = await file.exists();

    let cart: CartState;

    if (!exists) {
      console.log(`[add] Cart file not found for wallet: ${cartPath}. Initializing new cart.`);
      cart = { ...EMPTY_CART }; // Initialize empty cart if it doesn't exist for this wallet
    } else {
      console.log(`[add] Cart file found for wallet: ${cartPath}. Downloading...`);
      const [fileContents] = await file.download();
      try {
        cart = JSON.parse(fileContents.toString());
        console.log('[add] Successfully parsed wallet cart JSON.');
      } catch (parseError) {
        console.error('[add] Error parsing wallet cart JSON:', parseError);
        // If parsing fails, return an error or initialize an empty cart
         return NextResponse.json({ message: 'Failed to load wallet cart.' }, { status: 500 });
        // Or: cart = { ...EMPTY_CART };
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

     // Fetch the updated cart data to return the latest state including the cartIdentifier
    const updatedCart = await fetchCartData(identifier);

    return NextResponse.json(updatedCart);

  } catch (error) {
    console.error('Error adding item to cart:', error);
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