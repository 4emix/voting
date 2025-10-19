import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database.types';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './config';

export function createServerSupabaseClient() {
  const cookieStore = cookies();

  return createServerComponentClient<Database>(
    { cookies: () => cookieStore },
    {
      supabaseUrl: SUPABASE_URL,
      supabaseKey: SUPABASE_ANON_KEY
    }
  );
}
