import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Clean up the URL in case it was entered without https:// or with trailing spaces
let supabaseUrl = rawUrl.trim();
if (supabaseUrl && !supabaseUrl.startsWith('http')) {
  supabaseUrl = `https://${supabaseUrl}`;
}

try {
  if (supabaseUrl) {
    const urlObj = new URL(supabaseUrl);
    // Use only the origin (e.g. https://xyz.supabase.co) in case they copy-pasted a subpath
    supabaseUrl = urlObj.origin;
  }
} catch (e) {
  // Ignored, let it fail validation if invalid
}

const supabaseAnonKey = rawKey.trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'YOUR_SUPABASE_URL' && 
  supabaseUrl !== 'https://YOUR_SUPABASE_URL' &&
  supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY'
);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;
