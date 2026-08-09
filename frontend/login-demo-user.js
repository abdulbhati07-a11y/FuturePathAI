import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function loginDemoUser() {
  console.log("Logging in demo user...");
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@futurepath.ai',
    password: 'admin123',
  });

  if (error) {
    console.error("Error logging in:", error.message);
  } else {
    console.log("Login successful! User already exists.");
  }
}

loginDemoUser();
