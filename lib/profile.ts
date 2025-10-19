import { redirect } from 'next/navigation';
import type { Session } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server-client';
import type { Database, Profile } from '@/types/database.types';

export type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export function toProfile(profileRow: ProfileRow, email: string | null): Profile {
  return {
    id: profileRow.id,
    role: profileRow.role,
    lc: profileRow.lc,
    vote_balance: profileRow.votes_remaining,
    can_vote: profileRow.can_vote,
    email
  };
}

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
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  const profileRow = profileData as ProfileRow | null;

  if (error || !profileRow) {
    throw new Error('Unable to load profile for authenticated user.');
  }

  const profile = toProfile(profileRow, session.user.email ?? null);

  return { session, profile } satisfies AuthContext;
}

export async function requireAdmin() {
  const auth = await requireUser();

  if (auth.profile.role !== 'admin') {
    redirect('/vote');
  }

  return auth;
}
