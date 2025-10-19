import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

export async function assertAdminRoute() {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });

  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    return { supabase, session: null, profile: null } as const;
  }

  const { data: profile } = await supabase
    .from('profiles_with_email')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    return { supabase, session, profile: null } as const;
  }

  return { supabase, session, profile } as const;
}
