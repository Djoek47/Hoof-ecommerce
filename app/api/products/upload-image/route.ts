import { NextRequest, NextResponse } from 'next/server';
import { uploadFile } from '@/lib/storage';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const productId = formData.get('productId') as string;
    const imageType = formData.get('imageType') as string; // 'image1' or 'image2'

    if (!file || !productId || !imageType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Generate a unique filename with product ID and image type
    const fileName = `products/${productId}/${imageType}-${Date.now()}.${file.name.split('.').pop()}`;
    
    // Upload the file
    const publicUrl = await uploadFile(buffer, fileName, file.type);

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error('Error uploading product image:', error);
    return NextResponse.json(
      { error: 'Error uploading product image' },
      { status: 500 }
    );
  }
} 