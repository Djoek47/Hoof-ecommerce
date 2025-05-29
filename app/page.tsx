import { Button } from "@/components/ui/button"
import { HoodieCard } from "@/components/hoodie-card"
import { AutoSliderBanner } from "@/components/auto-slider-banner"
import { CartWrapper } from "@/components/cart-wrapper"
import Image from "next/image"
import Link from "next/link"
import { hoodies } from "@/data/products";

export default function Home() {
  return (
    <CartWrapper>
      <main id="main-content" className="flex min-h-screen flex-col items-center justify-between">
        <AutoSliderBanner />

        {/* Product Section */}
        <section id="product-section" className="w-full py-12 md:py-24 bg-dark-900">
          <div className="container mx-auto px-4">
            <h2 className="mb-8 text-3xl font-bold text-center text-gray-100 relative z-20">Metaverse Collection</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {hoodies.map((hoodie) => (
                <HoodieCard key={hoodie.id} {...hoodie} />
              ))}
            </div>
          </div>
        </section>

        {/* Brand Accent Section */}
        <section className="w-full py-16 bg-dark-800 relative z-20">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-block p-1 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg mb-8">
              <h3 className="text-2xl font-bold bg-dark-900 px-6 py-3 rounded-md">Metaverse to Reality</h3>
            </div>
            <p className="max-w-2xl mx-auto text-gray-300 mb-8">
              Bring your Faberland identity into the real world with our premium merchandise. Each piece connects to
              your digital assets in the metaverse.
            </p>
            <div className="flex justify-center gap-4">
              <div className="w-16 h-1 bg-yellow-500 rounded-full"></div>
              <div className="w-4 h-1 bg-yellow-500/50 rounded-full"></div>
              <div className="w-2 h-1 bg-yellow-500/30 rounded-full"></div>
            </div>
          </div>
        </section>

        {/* Second Banner Section - Fixed */}
        <section className="w-full bg-dark-900 relative">
          <div className="h-[500px] w-full relative overflow-hidden">
            {/* Video Background */}
            <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
              <source
                src="https://cdn.pixabay.com/vimeo/328218457/digital-20048.mp4?width=1280&hash=e9a5a1d7c72e0c2a9f4c5e4c1b9e3c0c0c0c0c0c"
                type="video/mp4"
              />
              Your browser does not support the video tag.
            </video>

            {/* Fallback Image (in case video doesn't load) */}
            <div className="absolute inset-0 z-0">
              <Image
                src="https://i.pinimg.com/originals/14/f4/35/14f435eaaf8d107cca5055ce150eaf47.gif"
                alt="Metaverse Banner"
                fill
                className="object-cover"
                priority
              />
            </div>

            {/* Content Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center p-6 z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 text-center">
                Connect Your Digital Identity
              </h2>
              <p className="text-lg text-gray-300 mb-6 text-center max-w-2xl">
                Unlock exclusive in-game items and experiences with every purchase
              </p>
              <Link href="https://faberland.vercel.app/">
                <Button className="bg-yellow-500 hover:bg-yellow-600 text-dark-900">Explore Faberland</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Metaverse Connection Section */}
        <section className="w-full py-16 bg-dark-800 relative z-20">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="md:w-1/2">
                <h3 className="text-2xl font-bold mb-4 text-yellow-500">Connect Your Digital Identity</h3>
                <p className="text-gray-300 mb-6">
                  Each Faberstore item comes with a unique QR code that connects to your Faberland avatar. Unlock
                  exclusive in-game items and experiences with your purchase.
                </p>
                <Link href="https://faberland.vercel.app/">
                  <Button className="bg-yellow-500 hover:bg-yellow-600 text-dark-900">Learn More</Button>
                </Link>
              </div>
              <div className="md:w-1/2 bg-dark-700 p-6 rounded-lg border border-yellow-500/20">
                <div className="aspect-video relative overflow-hidden rounded-md">
                  <div className="absolute inset-0 flex items-center justify-center bg-dark-600">
                    <div className="text-yellow-500 text-6xl font-bold opacity-20">METASTORE</div>
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-transparent"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Visser Studios Footer */}
        <div className="w-full py-2 bg-dark-900 border-t border-dark-700">
          <div className="container mx-auto px-4 flex items-center justify-center">
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
      </main>
    </CartWrapper>
  )
}
