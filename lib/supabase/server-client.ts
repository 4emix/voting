import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database.types';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './config';

export function createServerSupabaseClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        }
      }
    }
  );
}
