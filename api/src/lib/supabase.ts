import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("Missing Supabase environment variables: SUPABASE_URL and SUPABASE_KEY. Supabase features may not work.");
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '');
