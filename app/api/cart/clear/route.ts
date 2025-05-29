import { NextRequest, NextResponse } from 'next/server';
import * as Iron from '@hapi/iron';
import { serialize, parse } from 'cookie';
import { uploadFile } from '@/lib/storage';
import { CartState } from '@/types/cart';

const SESSION_SECRET = process.env.SESSION_SECRET as string;
const COOKIE_NAME = 'app_session';

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

// Use the same cart filename as storage route
const CART_FILENAME = 'carts/cart.json';

// Empty cart template
const EMPTY_CART: CartState = {
  items: [],
  isOpen: false,
  cartUrl: `https://storage.googleapis.com/djt45test/${CART_FILENAME}`
};

export async function POST() {
  try {
    console.log('Clearing cart...');
    
    // Upload empty cart
    await uploadFile(
      Buffer.from(JSON.stringify(EMPTY_CART)),
      CART_FILENAME,
      'application/json'
    );
    
    console.log('Successfully cleared cart');
    return NextResponse.json(EMPTY_CART);
  } catch (error) {
    console.error('Error clearing cart:', error);
    return NextResponse.json(EMPTY_CART);
  }
} 