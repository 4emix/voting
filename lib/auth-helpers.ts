import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database, Profile } from '@/types/database.types';
import { toProfile, type ProfileRow } from '@/lib/profile';

export async function assertAdminRoute() {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });

  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    return { supabase, session: null, profile: null } as const;
  }

  const { data: profileData, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  const profileRow = profileData as ProfileRow | null;

  if (error || !profileRow) {
    return { supabase, session, profile: null } as const;
  }

  const profile = toProfile(profileRow, session.user.email ?? null);

  if (profile.role !== 'admin') {
    return { supabase, session, profile: null } as const;
  }

  return { supabase, session, profile } as const;
}
