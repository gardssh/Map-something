import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

let supabaseClient: ReturnType<typeof createClientComponentClient<Database>> | null = null;

export const createClient = () => {
  if (!supabaseClient) {
    supabaseClient = createClientComponentClient<Database>({
      cookieOptions: {
        name: 'sb-token',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      },
    });
  }
  return supabaseClient;
} 