import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

// Create a singleton instance with cookie-based auth
export const supabase = createClientComponentClient<Database>();

// Keep the existing createClient function for backward compatibility
let supabaseClient: ReturnType<typeof createClientComponentClient<Database>> | null = null;

export const createClient = () => {
  if (!supabaseClient) {
    supabaseClient = supabase;
  }
  return supabaseClient;
} 