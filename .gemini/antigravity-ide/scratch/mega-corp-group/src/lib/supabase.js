import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found in environment variables. Using localStorage fallback.');
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Storage bucket name for product images
export const STORAGE_BUCKET = 'product-images';

/**
 * Uploads a file to the Supabase Storage bucket and returns its public URL.
 * @param {File} file - The file to upload.
 * @returns {Promise<string>} The public URL of the uploaded image.
 */
export const uploadProductImage = async (file) => {
  if (!supabase) {
    throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
  }

  console.log('Starting image upload...', file.name);
  
  // Generate a unique filename to prevent overwriting
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
  const filePath = `products/${fileName}`;

  console.log('Uploading to bucket:', STORAGE_BUCKET, 'path:', filePath);

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Upload error:', error);
    throw error;
  }

  console.log('Upload successful:', data);

  // Get the public URL of the uploaded file
  const { data: { publicUrl } } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(filePath);

  console.log('Public URL:', publicUrl);
  return publicUrl;
};

