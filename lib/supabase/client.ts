import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database.types';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './config';

const createSupabaseClient = () =>
  createClientComponentClient<Database>({
    supabaseUrl: SUPABASE_URL,
    supabaseKey: SUPABASE_ANON_KEY
  });

type BrowserSupabaseClient = ReturnType<typeof createSupabaseClient>;

let browserClient: BrowserSupabaseClient | null = null;

export function createBrowserSupabaseClient(): BrowserSupabaseClient {
  const client = browserClient ?? createSupabaseClient();

  browserClient = client;

  return client;
}
