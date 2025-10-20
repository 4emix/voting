import {
  createClientComponentClient,
  type SupabaseClient
} from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database.types';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './config';

let browserClient: SupabaseClient<Database> | null = null;

export function createBrowserSupabaseClient(): SupabaseClient<Database> {
  const client =
    browserClient ??
    createClientComponentClient<Database>({
      supabaseUrl: SUPABASE_URL,
      supabaseKey: SUPABASE_ANON_KEY
    });

  browserClient = client;

  return client;
}
