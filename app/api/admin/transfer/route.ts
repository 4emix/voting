import { NextResponse } from 'next/server';
import { z } from 'zod';
import { assertAdminRoute } from '@/lib/auth-helpers';
import { getServiceSupabaseClient } from '@/lib/supabase/service-client';

const schema = z.object({
  fromUserId: z.string().uuid(),
  toUserId: z.string().uuid(),
  amount: z.number().int().positive()
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

  if (validation.data.fromUserId === validation.data.toUserId) {
    return NextResponse.json({ error: 'Choose two different users.' }, { status: 400 });
  }

  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase.rpc('admin_transfer_votes', {
    from_user: validation.data.fromUserId,
    to_user: validation.data.toUserId,
    amount: validation.data.amount,
    actor_id: session.user.id
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, result: Array.isArray(data) ? data[0] : data });
}
