import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from './config';

let serviceClient: ReturnType<typeof createClient<Database>> | null = null;

export function getServiceSupabaseClient() {
  if (serviceClient) {
    return serviceClient;
  }

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable.');
  }

  serviceClient = createClient<Database>(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  );

  return serviceClient;
}
