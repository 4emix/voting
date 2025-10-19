import { NextResponse } from 'next/server';
import { z } from 'zod';
import { assertAdminRoute } from '@/lib/auth-helpers';
import { getServiceSupabaseClient } from '@/lib/supabase/service-client';

const schema = z.object({
  userId: z.string().uuid(),
  canVote: z.boolean()
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const validation = schema.safeParse(body);

  if (!validation.success) {
    const [issue] = validation.error.issues;
    return NextResponse.json({ error: issue?.message ?? 'Invalid payload.' }, { status: 400 });
  }

  const { session, profile } = await assertAdminRoute();

  if (!session) {
    return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });
  }

  if (!profile) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }

  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase.rpc('admin_toggle_vote_permission', {
    user_id: validation.data.userId,
    can_vote: validation.data.canVote,
    actor_id: session.user.id
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, result: Array.isArray(data) ? data[0] : data });
}
