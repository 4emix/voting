'use client';

import { useState } from 'react';
import { NONE_CHOICE, VOTE_CHOICES, type VoteChoice } from '@/lib/constants';

interface VoteClientProps {
  initialVotesRemaining: number;
  canVote: boolean;
}

export function VoteClient({ initialVotesRemaining, canVote }: VoteClientProps) {
  const [selected, setSelected] = useState<VoteChoice[]>([]);
  const [votesRemaining, setVotesRemaining] = useState(initialVotesRemaining);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toggleChoice(choice: VoteChoice) {
    setSelected((prev) => {
      if (choice === NONE_CHOICE) {
        return prev.includes(NONE_CHOICE) ? [] : [NONE_CHOICE];
      }

      const withoutNone = prev.filter((value) => value !== NONE_CHOICE);

      if (withoutNone.includes(choice)) {
        return withoutNone.filter((value) => value !== choice);
      }

      return [...withoutNone, choice];
    });
  }

  async function handleSubmit() {
    if (votesRemaining <= 0 || !canVote) {
      return;
    }

    setSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ choices: selected })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: 'Unable to submit vote.' }));
        throw new Error(payload.error ?? 'Unable to submit vote.');
      }

      const payload = (await response.json()) as { remaining: number; choices: VoteChoice[] };
      setVotesRemaining(payload.remaining);
      setSelected([]);
      setMessage(`Vote submitted for ${payload.choices.join(', ')}. Remaining votes: ${payload.remaining}.`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to submit vote.');
    } finally {
      setSubmitting(false);
    }
  }

  const disabled = votesRemaining <= 0 || !canVote;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        {VOTE_CHOICES.map((choice) => {
          const checked = selected.includes(choice);
          return (
            <label
              key={choice}
              className={`flex cursor-pointer items-center gap-3 rounded-md border border-slate-200 bg-white px-4 py-3 shadow-sm transition ${
                checked ? 'border-sky-500 ring-1 ring-sky-500' : ''
              }`}
            >
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={checked}
                onChange={() => toggleChoice(choice)}
                disabled={disabled || (choice !== NONE_CHOICE && selected.includes(NONE_CHOICE))}
              />
              <span className="text-sm font-medium text-slate-800">{choice}</span>
            </label>
          );
        })}
      </div>
      <p className="text-sm text-slate-700">
        Votes remaining: <span className="font-semibold">{votesRemaining}</span>
      </p>
      {!canVote ? (
        <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-700">
          Voting has been disabled for your account. Contact an administrator for assistance.
        </p>
      ) : null}
      {votesRemaining === 0 ? (
        <p className="rounded-md border border-slate-200 bg-slate-100 p-3 text-sm text-slate-600">
          You have no votes left.
        </p>
      ) : null}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={disabled || selected.length === 0 || submitting}
        className="inline-flex items-center rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {submitting ? 'Submitting…' : 'Send my vote'}
      </button>
      {message ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>
      ) : null}
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : null}
    </div>
  );
}
