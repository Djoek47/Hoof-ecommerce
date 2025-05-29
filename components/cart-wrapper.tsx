"use client"

import type { ReactNode } from "react"
import { CartIcon } from "@/components/cart-icon"
import { CartDrawer } from "@/components/cart/cart-drawer"
import { ConnectButton } from "thirdweb/react";
import { client } from "@/app/layout";
import { customTheme } from "@/components/client-layout-content";

export function CartWrapper({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="fixed top-4 left-4 z-50">
        <ConnectButton client={client} theme={customTheme} />
      </div>
      <div className="fixed top-4 right-4 z-50">
        <CartIcon />
      </div>
      <CartDrawer />
      {children}
    </>
  )
}
