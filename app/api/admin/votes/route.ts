import { NextResponse } from 'next/server';
import { assertAdminRoute } from '@/lib/auth-helpers';
import { getServiceSupabaseClient } from '@/lib/supabase/service-client';

export async function GET() {
  const { session, profile } = await assertAdminRoute();

  if (!session) {
    return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });
  }

  if (!profile) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }

  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase
    .from('votes_with_users')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ votes: data ?? [] });
}
