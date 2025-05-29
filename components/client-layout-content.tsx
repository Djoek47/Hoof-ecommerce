"use client";

import type { ReactNode } from "react";
import { ThirdwebProvider, ConnectButton, darkTheme } from "thirdweb/react";
import { useActiveAccount } from "thirdweb/react";
import { CartProvider } from "@/components/providers/cart-provider";
import { SplashScreen } from "@/components/splash-screen";
import { Logo } from "@/components/logo";
import { CustomCursor } from "@/components/custom-cursor";
import Image from "next/image"; // Assuming Image might be used in footer/logo
import Link from "next/link"; // Assuming Link might be used in footer/logo
import { useEffect } from "react";
import { useCart } from "@/context/cart-context";

// Import the client object - adjust path if necessary based on where it's defined relative to this file
// If client is defined in app/layout.tsx and exported, this import should work: 
import { client } from "@/app/layout";

// Define a custom theme based on the dark theme
export const customTheme = darkTheme({
  colors: {
    // Customize button colors to match the project's yellow theme
    accentButtonBg: "#F59E0B", // Approximate yellow-500
    accentButtonText: "#0E1116", // Approximate dark-900
  },
});

// Create a wrapper component to handle wallet connection
function WalletCartSync() {
  const account = useActiveAccount();
  const { setWalletId } = useCart();

  useEffect(() => {
    if (account?.address) {
      console.log('Setting wallet ID:', account.address);
      setWalletId(account.address);
    } else {
      console.log('Clearing wallet ID');
      setWalletId(undefined);
    }
  }, [account, setWalletId]);

  return null;
}

export default function ClientLayoutContent({ children }: { children: ReactNode }) {
  return (
    <ThirdwebProvider>
      <CartProvider>
        <WalletCartSync />
        <SplashScreen />
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-10 pointer-events-none">
          <Logo />
        </div>
        {children}
        <footer className="w-full py-6 px-4 bg-dark-600 text-gray-400 border-t border-yellow-500/20">
          <div className="container mx-auto text-center">
            <p className="mb-4">&copy; 2023 Faberland. All rights reserved.</p>
            <div className="flex items-center justify-center">
              <span className="text-xs text-gray-500 mr-2">Powered by</span>
              <Link
                href="https://faberland.vercel.app/"
                className="flex items-center hover:opacity-80 transition-opacity"
              >
                <div className="relative w-6 h-6">
                  <Image src="/v1-logo.png" alt="Visser Studios" fill className="object-contain" />
                </div>
                <span className="text-xs text-gray-500 ml-1">Visser Studios</span>
              </Link>
            </div>
          </div>
        </footer>
        <CustomCursor />
      </CartProvider>
    </ThirdwebProvider>
  );
} 