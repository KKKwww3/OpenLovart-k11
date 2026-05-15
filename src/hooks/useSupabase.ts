import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { useMemo } from 'react';
import { Database } from '@/lib/supabase';

export const INTERNAL_USER_ID = 'internal_user_001';

export function useSupabase() {
  const supabaseClient = useMemo(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables');
      return null;
    }

    return createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: false,
        },
      }
    );
  }, []);

  return supabaseClient;
}
