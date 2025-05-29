import type { CartItem } from "@/types/cart";

interface ProductItem {
  id: number;
  name: string;
  price: number;
  image1: string;
  image2: string;
}

// Define your product data here
export const hoodies: ProductItem[] = [
  {
    id: 1,
    name: "Faberland Classic Hoodie",
    price: 149.99,
    image1: "https://i.imgur.com/YFRVFDX.jpg",
    image2: "https://i.imgur.com/S5WuVkN.jpg",
  },
  {
    id: 2,
    name: "Metaverse Explorer Hoodie",
    price: 154.99,
    image1: "https://i.imgur.com/YFRVFDX.jpg",
    image2: "https://i.imgur.com/S5WuVkN.jpg",
  },
  {
    id: 3,
    name: "Digital Realm Hoodie",
    price: 159.99,
    image1: "https://i.imgur.com/YFRVFDX.jpg",
    image2: "https://i.imgur.com/S5WuVkN.jpg",
  },
  {
    id: 4,
    name: "Faberland Limited Edition",
    price: 199.99,
    image1: "https://i.imgur.com/YFRVFDX.jpg",
    image2: "https://i.imgur.com/S5WuVkN.jpg",
  },
];

// You can add other product types or data arrays here as needed 