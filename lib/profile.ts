import { redirect } from 'next/navigation';
import type { Session } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server-client';
import type { Profile } from '@/types/database.types';

export interface AuthContext {
  session: Session;
  profile: Profile;
}

export async function requireUser() {
  const supabase = createServerSupabaseClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const { data: profileData, error } = await supabase
    .from('profiles_with_email')
    .select('*')
    .eq('id', session.user.id)
    .single();

  const profile = profileData as Profile | null;

  if (error || !profile) {
    throw new Error('Unable to load profile for authenticated user.');
  }

  return { session, profile } satisfies AuthContext;
}

export async function requireAdmin() {
  const auth = await requireUser();

  if (auth.profile.role !== 'admin') {
    redirect('/vote');
  }

  return auth;
}
