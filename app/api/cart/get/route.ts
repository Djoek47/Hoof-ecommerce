import { NextRequest, NextResponse } from 'next/server';
import * as Iron from '@hapi/iron';
import { parse } from 'cookie';
import { CartItem } from '@/types/cart';

const SESSION_SECRET = process.env.SESSION_SECRET as string;
const COOKIE_NAME = 'app_session';

// Helper function to unseal (decrypt) data
async function unsealData(sealedData: string) {
  try {
    return await Iron.unseal(sealedData, SESSION_SECRET, Iron.defaults);
  } catch (error) {
    // Handle invalid or expired seals
    return null;
  }
}

export async function GET(req: NextRequest) {
  if (!SESSION_SECRET) {
    return NextResponse.json({ message: 'Server session secret not configured.' }, { status: 500 });
  }

  try {
    const cookies = parse(req.headers.get('Cookie') || '');
    const sealedCart = cookies[COOKIE_NAME];

    let cart = { items: [] as CartItem[] };

    if (sealedCart) {
      const unsealedCart = await unsealData(sealedCart);
      if (unsealedCart) {
        cart = unsealedCart as { items: CartItem[] };
      }
    }

    return NextResponse.json(cart);

  } catch (error) {
    console.error('Error getting cart:', error);
    return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
  }
} 