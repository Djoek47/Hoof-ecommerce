import { NextRequest, NextResponse } from 'next/server';
import { getCartIdentifier, getCartPath } from '@/lib/cart-utils';
import { uploadFile } from '@/lib/storage';
import { CartState, CartItem, CartIdentifier } from '@/types/cart';
import { storage } from '@/lib/storage';
import { hoodies } from '@/data/products';

const BUCKET_NAME = 'djt45test';

// Empty cart template
const EMPTY_CART: CartState = {
  items: [],
  isOpen: false,
  cartUrl: ''
};

export async function POST(req: NextRequest) {
  try {
    const { items: localCartItems }: { items: CartItem[] } = await req.json();
    const walletId = req.nextUrl.searchParams.get('walletId');

    // ** Require walletId for migration **
    if (!walletId) {
      return NextResponse.json({ message: 'Wallet ID required for migration.' }, { status: 400 });
    }

    // Get the wallet cart identifier
    const walletIdentifier = await getCartIdentifier(walletId);

     // If getCartIdentifier returns undefined, it means walletId was missing (should be caught above, but as a safeguard)
    if (!walletIdentifier || walletIdentifier.type !== 'wallet') {
         return NextResponse.json({ message: 'Invalid wallet identifier for migration.' }, { status: 400 });
    }

    const walletCartPath = getCartPath(walletIdentifier);

    // Fetch the user's existing wallet cart
    console.log(`[migrate-local] Attempting to fetch wallet cart from: ${BUCKET_NAME}/${walletCartPath}`);
    const file = storage.bucket(BUCKET_NAME).file(walletCartPath);
    const [exists] = await file.exists();

    let walletCart: CartState;

    if (!exists) {
      console.log(`[migrate-local] Wallet cart file not found: ${walletCartPath}. Initializing with local cart items.`);
      // If no wallet cart exists, start with the local cart items
      walletCart = { ...EMPTY_CART, items: localCartItems };
    } else {
      console.log(`[migrate-local] Wallet cart file found: ${walletCartPath}. Downloading and merging.`);
      const [fileContents] = await file.download();
      try {
        walletCart = JSON.parse(fileContents.toString());
        console.log('[migrate-local] Successfully parsed wallet cart JSON.');

        // Merge local cart items into the wallet cart
        localCartItems.forEach(localItem => {
          const existingItemIndex = walletCart.items.findIndex(walletItem => walletItem.id === localItem.id);
          if (existingItemIndex > -1) {
            walletCart.items[existingItemIndex].quantity += localItem.quantity;
          } else {
            walletCart.items.push(localItem);
          }
        });

      } catch (parseError) {
        console.error('[migrate-local] Error parsing wallet cart JSON:', parseError);
        // If parsing fails, return an error
         return NextResponse.json({ message: 'Failed to load existing wallet cart for migration.' }, { status: 500 });
      }
    }

    // Upload the merged cart to the wallet location
    await uploadFile(
      Buffer.from(JSON.stringify(walletCart)),
      walletCartPath,
      'application/json'
    );

     // Fetch the updated cart data to return the latest state including the cartIdentifier
    const updatedCart = await fetchCartData(walletIdentifier);

    return NextResponse.json(updatedCart);

  } catch (error) {
    console.error('Error migrating local cart:', error);
    return NextResponse.json({ message: 'Internal server error during migration.' }, { status: 500 });
  }
}

// Helper function to fetch cart data after an update (can be shared)
async function fetchCartData(identifier: Required<CartIdentifier>): Promise<CartState & { cartIdentifier: CartIdentifier }> {
    const cartPath = getCartPath(identifier);
    const file = storage.bucket(BUCKET_NAME).file(cartPath);
    const [fileContents] = await file.download();
    const cart = JSON.parse(fileContents.toString());
    return { ...cart, cartIdentifier: identifier };
} 