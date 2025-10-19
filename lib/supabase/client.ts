import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './config';

let browserClient: SupabaseClient<Database> | null = null;

export function createBrowserSupabaseClient() {
  if (!browserClient) {
    browserClient = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  return browserClient;
}
