import { AdminDashboard } from '@/components/admin-dashboard';
import { requireAdmin } from '@/lib/profile';
import { getServiceSupabaseClient } from '@/lib/supabase/service-client';
import type { Profile, VoteRow } from '@/types/supabase';

export default async function AdminPage() {
  await requireAdmin();
  const supabase = getServiceSupabaseClient();

  const { data: users, error: usersError } = await supabase
    .from('profiles')
    .select('*')
    .order('lc', { ascending: true });

  if (usersError || !users) {
    throw new Error(`Unable to load users: ${usersError?.message ?? 'unknown error'}`);
  }

  const { data: votes, error: votesError } = await supabase
    .from('votes')
    .select('id, choices, created_at, user_id, profiles(display_name, username, lc, id)')
    .order('created_at', { ascending: false })
    .limit(100);

  if (votesError || !votes) {
    throw new Error(`Unable to load votes: ${votesError?.message ?? 'unknown error'}`);
  }

  type VoteWithProfile = VoteRow & {
    profiles: Pick<Profile, 'display_name' | 'username' | 'lc' | 'id'> | null;
  };

  const logs = (votes as VoteWithProfile[]).map((vote) => ({
    id: vote.id,
    created_at: vote.created_at,
    choices: vote.choices,
    user_id: vote.user_id,
    lc: vote.profiles?.lc ?? 'Unknown',
    display_name: vote.profiles?.display_name ?? null,
    username: vote.profiles?.username ?? null
  }));

  return <AdminDashboard users={users} votes={logs} />;
}
