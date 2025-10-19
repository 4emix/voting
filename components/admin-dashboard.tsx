'use client';

import { useMemo, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { Profile } from '@/types/database.types';

interface VoteLogEntry {
  id: string;
  created_at: string;
  choices: unknown;
  user_id: string;
  lc: string;
  email: string | null;
}

interface AdminDashboardProps {
  users: Profile[];
  votes: VoteLogEntry[];
}

export function AdminDashboard({ users, votes }: AdminDashboardProps) {
  const router = useRouter();
  const [transferState, setTransferState] = useState({
    from: '',
    to: '',
    amount: 1
  });
  const [transferMessage, setTransferMessage] = useState<string | null>(null);
  const [transferError, setTransferError] = useState<string | null>(null);

  const [setVotesState, setSetVotesState] = useState({
    userId: '',
    voteBalance: 0
  });
  const [setVotesMessage, setSetVotesMessage] = useState<string | null>(null);
  const [setVotesError, setSetVotesError] = useState<string | null>(null);

  const [toggleError, setToggleError] = useState<string | null>(null);
  const [filterLc, setFilterLc] = useState<string>('all');
  const [filterUser, setFilterUser] = useState<string>('all');

  const uniqueLcs = useMemo(() => Array.from(new Set(users.map((user) => user.lc))).sort(), [users]);

  const filteredVotes = useMemo(() => {
    return votes.filter((vote) => {
      const matchesLc = filterLc === 'all' || vote.lc === filterLc;
      const matchesUser = filterUser === 'all' || vote.user_id === filterUser;
      return matchesLc && matchesUser;
    });
  }, [votes, filterLc, filterUser]);

  async function handleTransfer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTransferMessage(null);
    setTransferError(null);

    try {
      const response = await fetch('/api/admin/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUserId: transferState.from,
          toUserId: transferState.to,
          amount: transferState.amount
        })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: 'Unable to transfer votes.' }));
        throw new Error(payload.error ?? 'Unable to transfer votes.');
      }

      setTransferMessage('Votes transferred successfully.');
      router.refresh();
    } catch (error) {
      setTransferError(error instanceof Error ? error.message : 'Unable to transfer votes.');
    }
  }

  async function handleSetVotes(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSetVotesMessage(null);
    setSetVotesError(null);

    try {
      const response = await fetch('/api/admin/set-votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: setVotesState.userId,
          voteBalance: setVotesState.voteBalance
        })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: 'Unable to update votes.' }));
        throw new Error(payload.error ?? 'Unable to update votes.');
      }

      setSetVotesMessage('Vote balance updated successfully.');
      router.refresh();
    } catch (error) {
      setSetVotesError(error instanceof Error ? error.message : 'Unable to update votes.');
    }
  }

  async function handleToggle(userId: string, canVote: boolean) {
    setToggleError(null);

    try {
      const response = await fetch('/api/admin/toggle-vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, canVote })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: 'Unable to toggle voting.' }));
        throw new Error(payload.error ?? 'Unable to toggle voting.');
      }

      router.refresh();
    } catch (error) {
      setToggleError(error instanceof Error ? error.message : 'Unable to toggle voting.');
    }
  }

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Administration</p>
        <h1 className="text-3xl font-bold text-slate-900">Admin dashboard</h1>
        <p className="text-sm text-slate-600">
          Manage voter balances and review the latest votes submitted across all LCs.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleTransfer} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Transfer votes</h2>
            <p className="text-sm text-slate-600">Move votes from one account to another instantly.</p>
          </div>
          <label className="block text-sm font-medium text-slate-700">
            From user
            <select
              required
              value={transferState.from}
              onChange={(event) => setTransferState((prev) => ({ ...prev, from: event.target.value }))}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="" disabled>
                Select user
              </option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {`${user.email ?? user.id}`} ({user.lc})
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            To user
            <select
              required
              value={transferState.to}
              onChange={(event) => setTransferState((prev) => ({ ...prev, to: event.target.value }))}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="" disabled>
                Select user
              </option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {`${user.email ?? user.id}`} ({user.lc})
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Amount
            <input
              type="number"
              min={1}
              required
              value={transferState.amount}
              onChange={(event) =>
                setTransferState((prev) => ({ ...prev, amount: Number(event.target.value) }))
              }
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </label>
          <button
            type="submit"
            className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500"
          >
            Transfer votes
          </button>
          {transferMessage ? (
            <p className="text-sm text-emerald-600">{transferMessage}</p>
          ) : null}
          {transferError ? <p className="text-sm text-red-600">{transferError}</p> : null}
        </form>

        <form onSubmit={handleSetVotes} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Set vote balance</h2>
            <p className="text-sm text-slate-600">Override a user&apos;s vote balance.</p>
          </div>
          <label className="block text-sm font-medium text-slate-700">
            User
            <select
              required
              value={setVotesState.userId}
              onChange={(event) => setSetVotesState((prev) => ({ ...prev, userId: event.target.value }))}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="" disabled>
                Select user
              </option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {`${user.email ?? user.id}`} ({user.lc})
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Vote balance
            <input
              type="number"
              min={0}
              required
              value={setVotesState.voteBalance}
              onChange={(event) => setSetVotesState((prev) => ({ ...prev, voteBalance: Number(event.target.value) }))}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </label>
          <button
            type="submit"
            className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500"
          >
            Update balance
          </button>
          {setVotesMessage ? <p className="text-sm text-emerald-600">{setVotesMessage}</p> : null}
          {setVotesError ? <p className="text-sm text-red-600">{setVotesError}</p> : null}
        </form>
      </section>

      <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Users</h2>
          <p className="text-sm text-slate-600">Overview of registered voters.</p>
        </div>
        {toggleError ? <p className="text-sm text-red-600">{toggleError}</p> : null}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-slate-600">Email</th>
                <th className="px-3 py-2 text-left font-medium text-slate-600">LC</th>
                <th className="px-3 py-2 text-left font-medium text-slate-600">Vote balance</th>
                <th className="px-3 py-2 text-left font-medium text-slate-600">Can vote</th>
                <th className="px-3 py-2 text-left font-medium text-slate-600">Role</th>
                <th className="px-3 py-2 text-left font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-3 py-2">{user.email ?? '—'}</td>
                  <td className="px-3 py-2">{user.lc}</td>
                  <td className="px-3 py-2">{user.vote_balance}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      user.can_vote
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                    >
                      {user.can_vote ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-3 py-2 capitalize">{user.role}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => handleToggle(user.id, !user.can_vote)}
                      className="rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-400"
                    >
                      {user.can_vote ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Votes log</h2>
            <p className="text-sm text-slate-600">Recent submissions (most recent 100).</p>
          </div>
          <div className="flex gap-3">
            <select
              value={filterLc}
              onChange={(event) => setFilterLc(event.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="all">All LCs</option>
              {uniqueLcs.map((lc) => (
                <option key={lc} value={lc}>
                  {lc}
                </option>
              ))}
            </select>
            <select
              value={filterUser}
              onChange={(event) => setFilterUser(event.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="all">All users</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.email ?? user.id}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-slate-600">Timestamp</th>
                <th className="px-3 py-2 text-left font-medium text-slate-600">User</th>
                <th className="px-3 py-2 text-left font-medium text-slate-600">LC</th>
                <th className="px-3 py-2 text-left font-medium text-slate-600">Choices</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredVotes.map((vote) => {
                const rawChoices = Array.isArray(vote.choices)
                  ? (vote.choices as string[])
                  : typeof vote.choices === 'string'
                    ? [vote.choices]
                    : [];
                const choices = rawChoices.map((choice) => String(choice));

                return (
                  <tr key={vote.id}>
                    <td className="px-3 py-2 text-slate-600">
                      {new Date(vote.created_at).toLocaleString()}
                    </td>
                    <td className="px-3 py-2">{vote.email ?? vote.user_id}</td>
                    <td className="px-3 py-2">{vote.lc}</td>
                    <td className="px-3 py-2">{choices.join(', ')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
