import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { AUTHORIZED_CREDENTIALS } from '../config/auth';

// Load .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUser() {
  const { email, masterPassword: password } = AUTHORIZED_CREDENTIALS;

  console.log(`Attempting to sync admin user: ${email}...`);

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (error) {
    if (error.message.includes('already exists')) {
      console.log('User already exists. Attempting to update password...');
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        (await supabase.auth.admin.listUsers()).data.users.find(u => u.email === email)?.id || '',
        { password }
      );
      if (updateError) {
        console.error('Failure in password update protocol:', updateError.message);
      } else {
        console.log('Password synchronized successful.');
      }
    } else {
      console.error('Failure in user creation protocol:', error.message);
    }
  } else {
    console.log('User synchronization successful:', data.user?.id);
    console.log('You can now log in with the credentials defined in src/config/auth.ts');
  }
}

createAdminUser();
