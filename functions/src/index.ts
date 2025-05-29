import * as functions from '@google-cloud/functions-framework';
import express from 'express';
import cors from 'cors';
import { Storage } from '@google-cloud/storage';
import fileUpload from 'express-fileupload';

const app = express();
app.use(cors({
  origin: ['http://localhost:3000', 'https://hoof-ecommerce.vercel.app'],
  credentials: true
}));
app.use(express.json());
app.use(fileUpload());

const storage = new Storage();
const BUCKET_NAME = 'djt45test'; // Keep using existing bucket with cart data
const SESSION_SECRET = process.env.SESSION_SECRET; // Make sure this environment variable is set

// Product data (replace with a database lookup in a real application)
const products = [
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

// Types
interface CartItem {
  id: number;
  name: string;
  price: number;
  image1: string;
  image2: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  cartUrl: string;
}

interface CartIdentifier {
  type: 'wallet' | 'guest';
  id: string;
}

// Helper functions
async function getCartIdentifier(walletId?: string): Promise<CartIdentifier> {
  if (walletId) {
    return { type: 'wallet', id: walletId };
  }
  // In a real app, you might use a cookie or other method for guest identification
  // For now, generating a simple unique ID
  return { type: 'guest', id: `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` };
}

function getCartPath(identifier: CartIdentifier): string {
  return `carts/${identifier.type}/${identifier.id}.json`;
}

// Load cart from Google Cloud Storage
async function loadCart(cartPath: string): Promise<CartState> {
  try {
    const file = storage.bucket(BUCKET_NAME).file(cartPath);
    const [exists] = await file.exists();
    if (!exists) {
      console.log(`[loadCart] Cart file not found: ${cartPath}. Returning empty cart.`);
      return { items: [], isOpen: false, cartUrl: '' };
    }
    console.log(`[loadCart] Cart file found: ${cartPath}. Downloading...`);
    const [fileContents] = await file.download();
    try {
      const cart = JSON.parse(fileContents.toString());
      console.log('[loadCart] Successfully parsed cart JSON.');
      // Ensure the loaded data conforms to CartState structure
      if (!Array.isArray(cart.items)) {
        console.error('[loadCart] Loaded data is not in expected format. Starting fresh.');
        return { items: [], isOpen: false, cartUrl: '' };
      }
      return cart;
    } catch (parseError) {
      console.error('[loadCart] Error parsing cart JSON:', parseError);
      // If parsing fails, return empty cart to avoid errors
      return { items: [], isOpen: false, cartUrl: '' };
    }
  } catch (error) {
    console.error('Error loading cart:', error);
    return { items: [], isOpen: false, cartUrl: '' };
  }
}

// Save cart to Google Cloud Storage
async function saveCart(cartPath: string, cart: CartState): Promise<void> {
  try {
    const file = storage.bucket(BUCKET_NAME).file(cartPath);
    const data = JSON.stringify(cart, null, 2);
    await file.save(Buffer.from(data), {
      contentType: 'application/json',
      metadata: {
        cacheControl: 'no-cache',
      },
    });
    console.log(`[saveCart] Cart data saved to Google Cloud Storage: ${cartPath}`);
  } catch (error) {
    console.error('Error saving cart data:', error);
    throw error; // Re-throw the error for the calling function to handle
  }
}

async function uploadFile(buffer: Buffer, fileName: string, contentType: string): Promise<string> {
  const bucket = storage.bucket(BUCKET_NAME);
  const file = bucket.file(fileName);
  await file.save(buffer, {
    contentType,
    metadata: {
      cacheControl: 'public, max-age=31536000',
    },
  });
  return `https://storage.googleapis.com/${BUCKET_NAME}/${fileName}`;
}

// Cart routes
app.get('/cart/storage', async (req, res) => {
  try {
    const walletId = req.query.walletId as string;
    const identifier = await getCartIdentifier(walletId);
    const cartPath = getCartPath(identifier);
    console.log(`[GET /cart/storage] Attempting to fetch cart from: ${BUCKET_NAME}/${cartPath}`);

    const cart = await loadCart(cartPath);
    res.json({
      ...cart,
      cartUrl: `https://storage.googleapis.com/${BUCKET_NAME}/${cartPath}`
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

app.post('/cart/add', async (req, res) => {
  try {
    const { id, quantity } = req.body;
    const walletId = req.query.walletId as string;
    if (typeof id !== 'number' || typeof quantity !== 'number' || quantity <= 0) {
      return res.status(400).json({ message: 'Invalid item ID or quantity provided.' });
    }
    const productToAdd = products.find(product => product.id === id);
    if (!productToAdd) {
      return res.status(404).json({ message: 'Product not found.' });
    }
    const identifier = await getCartIdentifier(walletId);
    const cartPath = getCartPath(identifier);
    let cart = await loadCart(cartPath);
    const existingItemIndex = cart.items.findIndex((cartItem) => cartItem.id === id);
    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      cart.items.push({ ...productToAdd, quantity });
    }
    await saveCart(cartPath, cart);
    res.json({
      ...cart,
      cartUrl: `https://storage.googleapis.com/${BUCKET_NAME}/${cartPath}`
    });
  } catch (error) {
    console.error('Error adding item to cart:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

app.post('/cart/remove', async (req, res) => {
  try {
    const { id } = req.body;
    const walletId = req.query.walletId as string;
    if (typeof id !== 'number') {
      return res.status(400).json({ message: 'Invalid item ID provided.' });
    }
    const identifier = await getCartIdentifier(walletId);
    const cartPath = getCartPath(identifier);
    let cart = await loadCart(cartPath);
    cart.items = cart.items.filter(item => item.id !== id);
    await saveCart(cartPath, cart);
    res.json({
      ...cart,
      cartUrl: `https://storage.googleapis.com/${BUCKET_NAME}/${cartPath}`
    });
  } catch (error) {
    console.error('Error removing item from cart:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

app.post('/cart/update-quantity', async (req, res) => {
  try {
    const { id, quantity } = req.body;
    const walletId = req.query.walletId as string;
    console.log(`[update-quantity] Received request: id=${id}, quantity=${quantity}, walletId=${walletId}`);
    if (typeof id !== 'number' || typeof quantity !== 'number' || quantity < 0) {
      return res.status(400).json({ message: 'Invalid item ID or quantity provided.' });
    }
    const identifier = await getCartIdentifier(walletId);
    const cartPath = getCartPath(identifier);
    let cart = await loadCart(cartPath);
    console.log('[update-quantity] Fetched cart state:', JSON.stringify(cart));
    const itemIndex = cart.items.findIndex(item => item.id === id);
    console.log('[update-quantity] Item index found:', itemIndex);
    if (itemIndex === -1) {
      if (quantity === 0) {
        return res.json({
          ...cart,
          cartUrl: `https://storage.googleapis.com/${BUCKET_NAME}/${cartPath}`
        });
      }
      return res.status(404).json({ message: 'Item not found in cart.' });
    }
    if (quantity === 0) {
      cart.items.splice(itemIndex, 1);
      console.log(`[update-quantity] Removed item with id ${id}.`);
    } else {
      cart.items[itemIndex].quantity = quantity;
      console.log(`[update-quantity] Updated quantity for item id ${id} to ${quantity}.`);
    }
    console.log('[update-quantity] Cart state after update:', JSON.stringify(cart));
    await saveCart(cartPath, cart);
    res.json({
      ...cart,
      cartUrl: `https://storage.googleapis.com/${BUCKET_NAME}/${cartPath}`
    });
  } catch (error) {
    console.error('Error updating item quantity in cart:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

app.post('/cart/clear', async (req, res) => {
  try {
    const walletId = req.query.walletId as string;
    const identifier = await getCartIdentifier(walletId);
    const cartPath = getCartPath(identifier);
    const emptyCart = { items: [], isOpen: false, cartUrl: '' };
    await saveCart(cartPath, emptyCart);
    res.json({
      ...emptyCart,
      cartUrl: `https://storage.googleapis.com/${BUCKET_NAME}/${cartPath}`
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// File upload route
app.post('/upload', async (req, res) => {
  try {
    // Use req.files for express-fileupload
    const file = req.files?.file;
    if (!file || Array.isArray(file)) {
      return res.status(400).json({ error: 'No file provided or multiple files not allowed' });
    }
    const buffer = Buffer.from(file.data);
    const fileName = `${Date.now()}-${file.name}`;
    const publicUrl = await uploadFile(buffer, fileName, file.mimetype);
    res.json({ url: publicUrl });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Error uploading file' });
  }
});

// Export the Express app as a Cloud Function
export const api = functions.http('api', app); 