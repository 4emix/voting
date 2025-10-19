import { VoteClient } from '@/components/vote-client';
import { requireUser } from '@/lib/profile';

export default async function VotePage() {
  const { profile } = await requireUser();

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Voting Dashboard</p>
        <h1 className="text-3xl font-bold text-slate-900">Welcome LC {profile.lc}</h1>
        <p className="text-sm text-slate-600">
          Hello {profile.email ?? profile.id}. Select your options below and submit your vote.
        </p>
      </header>
      <VoteClient initialVotesRemaining={profile.vote_balance} canVote={profile.can_vote} />
    </div>
  );
}
