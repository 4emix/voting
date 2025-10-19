import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/login-form';
import { createServerSupabaseClient } from '@/lib/supabase/server-client';

export default async function LoginPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (session) {
    redirect('/vote');
  }

  return (
    <div className="space-y-6">
      <LoginForm />
      <div className="text-sm text-slate-600">
        <p>
          This portal is secured by Supabase Auth. Accounts are provisioned by the
          voting admins. If you do not yet have an account, reach out to the
          organizers.
        </p>
      </div>
    </div>
  );
}
