import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in frontend/.env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createDemoUser() {
  console.log("Creating demo user...");
  const { data, error } = await supabase.auth.signUp({
    email: 'admin@futurepath.ai',
    password: 'admin123',
    options: {
      data: {
        name: 'Demo Admin'
      }
    }
  });

  if (error) {
    console.error("Error creating demo user:", error.message);
  } else {
    console.log("Demo user created successfully!");
    console.log("Email:", data.user?.email);
    console.log("User ID:", data.user?.id);
  }
}

createDemoUser();
