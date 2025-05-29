import { NextRequest, NextResponse } from 'next/server';
import { getCartIdentifier, migrateGuestCartToWallet } from '@/lib/cart-utils';

export async function POST(req: NextRequest) {
  try {
    const { walletId } = await req.json();
    
    if (!walletId) {
      return NextResponse.json({ error: 'Wallet ID is required' }, { status: 400 });
    }

    // Get current guest session ID
    const guestIdentifier = await getCartIdentifier();
    if (guestIdentifier.type !== 'guest') {
      return NextResponse.json({ error: 'No guest cart to migrate' }, { status: 400 });
    }

    // Migrate the cart
    await migrateGuestCartToWallet(guestIdentifier.id, walletId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error migrating cart:', error);
    return NextResponse.json({ error: 'Failed to migrate cart' }, { status: 500 });
  }
} 