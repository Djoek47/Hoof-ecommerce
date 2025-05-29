import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import type React from "react"
import { createThirdwebClient } from "thirdweb";
import ClientLayoutContent from "@/components/client-layout-content";
import { HeadLoader } from "@/components/head-loader";

const inter = Inter({ subsets: ["latin"] })

export const client = createThirdwebClient({ clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID! });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className={`${inter.className} bg-dark-900 text-gray-100`}>
        <HeadLoader />
        <ClientLayoutContent>
          {children}
        </ClientLayoutContent>
      </body>
    </html>
  )
}
