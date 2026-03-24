import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env vars
dotenv.config({ path: resolve(__dirname, '../../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStorage() {
  console.log('--- Initializing Storage Protocol ---');

  // 1. Create Bucket if it doesn't exist
  const { data: bucket, error: bucketError } = await supabase.storage.getBucket('academy');

  if (bucketError && bucketError.message.includes('not found')) {
    console.log('Bucket "academy" not found. Creating...');
    const { error: createError } = await supabase.storage.createBucket('academy', {
      public: true,
      allowedMimeTypes: ['image/*'],
      fileSizeLimit: 5242880 // 5MB
    });
    if (createError) {
      console.error('Creation failed:', createError.message);
      return;
    }
    console.log('Bucket "academy" created successfully.');
  } else if (bucketError) {
    console.error('Error checking bucket:', bucketError.message);
    return;
  } else {
    console.log('Bucket "academy" already exists.');
    
    // Ensure it's public
    if (!bucket.public) {
       console.log('Updating bucket to public...');
       await supabase.storage.updateBucket('academy', { public: true });
    }
  }

  // Note: RLS policies for storage often need to be set in the SQL editor 
  // but making it a "public" bucket usually allows read access.
  // For uploads via Anon key, we need an INSERT policy.
  
  console.log('\n--- Storage Protocol Synchronized ---');
  console.log('IMPORTANT: Ensure you have an INSERT policy for the "academy" bucket in your Supabase dashboard if uploads still fail.');
}

setupStorage();
