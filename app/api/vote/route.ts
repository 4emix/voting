import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database.types';
import { NONE_CHOICE, VOTE_CHOICES, type VoteChoice } from '@/lib/constants';

const voteSchema = z
  .object({
    choices: z
      .array(z.enum(VOTE_CHOICES))
      .min(1, 'Select at least one option.')
      .max(VOTE_CHOICES.length)
  })
  .refine((value) => !(value.choices.includes(NONE_CHOICE) && value.choices.length > 1), {
    path: ['choices'],
    message: 'NONE cannot be combined with other selections.'
  });

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const result = voteSchema.safeParse(body);
  if (!result.success) {
    const [first] = result.error.issues;
    return NextResponse.json({ error: first?.message ?? 'Invalid payload.' }, { status: 400 });
  }

  const cookieStore = cookies();
  const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });

  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });
  }

  const choices = result.data.choices as VoteChoice[];

  const payload: Database['public']['Functions']['cast_vote']['Args'] = {
    choices: choices as Database['public']['Functions']['cast_vote']['Args']['choices']
  };

  // Supabase's typed client currently infers RPC args as `never` for this generated type.
  const { data, error } = await supabase.rpc('cast_vote', payload as never);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const typedData = data as Database['public']['Functions']['cast_vote']['Returns'] | null;

  const remaining = Array.isArray(typedData)
    ? typedData[0]?.remaining ?? 0
    : (typedData as { remaining: number } | null)?.remaining ?? 0;

  return NextResponse.json({ remaining, choices });
}
