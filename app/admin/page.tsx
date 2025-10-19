import { AdminDashboard } from '@/components/admin-dashboard';
import { requireAdmin } from '@/lib/profile';
import { getServiceSupabaseClient } from '@/lib/supabase/service-client';
import type { VoteWithUser } from '@/types/database.types';

export default async function AdminPage() {
  await requireAdmin();
  const supabase = getServiceSupabaseClient();

  const { data: users, error: usersError } = await supabase
    .from('profiles_with_email')
    .select('*')
    .order('lc', { ascending: true });

  if (usersError || !users) {
    throw new Error(`Unable to load users: ${usersError?.message ?? 'unknown error'}`);
  }

  const { data: votes, error: votesError } = await supabase
    .from('votes_with_users')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (votesError || !votes) {
    throw new Error(`Unable to load votes: ${votesError?.message ?? 'unknown error'}`);
  }

  const logs = (votes as VoteWithUser[]).map((vote) => ({
    id: vote.id,
    created_at: vote.created_at,
    choices: vote.choices,
    user_id: vote.user_id,
    lc: vote.lc,
    email: vote.email
  }));

  return <AdminDashboard users={users} votes={logs} />;
}
