import { Storage } from '@google-cloud/storage';

// Initialize the Google Cloud Storage client with credentials
const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  credentials: {
    client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
});

export { storage }; // Export the storage instance

const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME || 'djt45test';
const bucket = storage.bucket(bucketName);

// Function to check if URL is external
function isExternalUrl(url: string): boolean {
  // Don't treat cart files as external URLs
  if (url.startsWith('carts/')) {
    return false;
  }
  return !url.includes(bucketName) && !url.startsWith('/');
}

// Function to upload a file to Google Cloud Storage
export async function uploadFile(file: Buffer, fileName: string, contentType: string) {
  try {
    console.log('Starting file upload:', { fileName, contentType });

    // For the test cart, force clear it
    if (fileName === 'carts/0i4ev2df994s-cart.json') {
      console.log('Forcing clear of test cart');
      const emptyCart = {
        items: [],
        isOpen: false,
        cartUrl: `https://storage.googleapis.com/${bucketName}/${fileName}`
      };
      
      try {
        const blob = bucket.file(fileName);
        await blob.save(JSON.stringify(emptyCart), {
          contentType: 'application/json',
          metadata: {
            contentType: 'application/json',
          },
        });
        console.log('Successfully cleared test cart');
      } catch (error) {
        console.error('Error saving empty cart:', error);
        // Continue even if save fails
      }
      
      return `https://storage.googleapis.com/${bucketName}/${fileName}`;
    }

    // Skip upload if it's an external image
    if (contentType.startsWith('image/') && isExternalUrl(fileName)) {
      console.log('Skipping external image upload');
      return fileName; // Return the original URL for external images
    }

    // Validate input
    if (!file || !fileName || !contentType) {
      throw new Error('Missing required parameters for file upload');
    }

    const blob = bucket.file(fileName);
    console.log('Created blob reference');

    const blobStream = blob.createWriteStream({
      resumable: false,
      metadata: {
        contentType,
      },
    });
    console.log('Created write stream');

    return new Promise((resolve, reject) => {
      blobStream.on('error', (error) => {
        console.error('Stream error:', error);
        reject(error);
      });

      blobStream.on('finish', async () => {
        try {
          console.log('Upload finished, getting public URL');
          const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
          console.log('Generated public URL:', publicUrl);
          resolve(publicUrl);
        } catch (error) {
          console.error('Error getting public URL:', error);
          reject(error);
        }
      });

      blobStream.end(file);
    });
  } catch (error) {
    console.error('Error in uploadFile:', error);
    throw error;
  }
}

// Function to delete a file from Google Cloud Storage
export async function deleteFile(fileName: string) {
  try {
    console.log('Starting file deletion:', fileName);

    // Skip deletion if it's an external image
    if (isExternalUrl(fileName)) {
      console.log('Skipping external image deletion');
      return;
    }

    await bucket.file(fileName).delete();
    console.log('File deleted successfully');
  } catch (error) {
    console.error('Error in deleteFile:', error);
    throw error;
  }
}

// Function to get a signed URL for temporary access
export async function getSignedUrl(fileName: string) {
  try {
    console.log('Getting signed URL for:', fileName);
    const [url] = await bucket.file(fileName).getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    });
    console.log('Generated signed URL');
    return url;
  } catch (error) {
    console.error('Error in getSignedUrl:', error);
    throw error;
  }
} 