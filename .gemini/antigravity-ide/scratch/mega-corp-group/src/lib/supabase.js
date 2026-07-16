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
  console.log('=== IMAGE UPLOAD START ===');
  console.log('File:', file.name, 'Size:', file.size, 'Type:', file.type);
  
  if (!supabase) {
    console.error('❌ Supabase is not configured');
    throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
  }

  // Check authentication status
  console.log('Checking authentication status...');
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.error('❌ Session check failed:', sessionError);
    throw new Error(`Authentication check failed: ${sessionError.message}`);
  }
  
  if (!session) {
    console.error('❌ No active session found');
    throw new Error('You must be logged in to upload images. Please log in again.');
  }
  
  console.log('✅ User authenticated:', session.user.email);
  console.log('✅ User ID:', session.user.id);
  
  // Generate a unique filename to prevent overwriting
  const fileExt = file.name.split('.').pop();
  const fileName = `${session.user.id}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
  const filePath = `products/${fileName}`;

  console.log('Upload path:', filePath);
  console.log('Bucket:', STORAGE_BUCKET);
  
  try {
    console.log('Starting upload to Supabase Storage...');
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('❌ Upload failed:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw error;
    }

    console.log('✅ Upload successful:', data);
    console.log('File path:', data.path);

    // Get the public URL of the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    console.log('✅ Public URL generated:', publicUrl);
    console.log('=== IMAGE UPLOAD COMPLETE ===');
    return publicUrl;
  } catch (error) {
    console.error('❌ Upload error:', error);
    throw error;
  }
};

