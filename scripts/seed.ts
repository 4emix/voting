import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

interface SeedUser {
  email: string;
  password: string;
  displayName: string;
  lc: string;
  role: 'user' | 'admin';
  votes: number;
}

const users: SeedUser[] = [
  {
    email: 'admin@example.com',
    password: 'AdminPass123',
    displayName: 'Admin User',
    lc: 'LC HQ',
    role: 'admin',
    votes: 10
  },
  {
    email: 'user1@demo.com',
    password: 'Password1',
    displayName: 'LC Hacettepe Voter',
    lc: 'LC Hacettepe',
    role: 'user',
    votes: 3
  },
  {
    email: 'user2@demo.com',
    password: 'Password2',
    displayName: 'LC Cairo Voter',
    lc: 'LC Cairo',
    role: 'user',
    votes: 2
  },
  {
    email: 'user3@demo.com',
    password: 'Password3',
    displayName: 'LC Lisbon Voter',
    lc: 'LC Lisbon',
    role: 'user',
    votes: 1
  }
];

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running the seed script.');
  process.exit(1);
}

const supabase = createClient<Database>(url, serviceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

async function ensureUser(seed: SeedUser) {
  const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 200
  });

  if (listError) {
    throw listError;
  }

  const existing = existingUsers?.users.find((user) => user.email?.toLowerCase() === seed.email.toLowerCase());

  if (!existing) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: seed.email,
      password: seed.password,
      email_confirm: true
    });

    if (error) {
      throw error;
    }

    return data.user;
  }

  return existing;
}

async function main() {
  for (const seed of users) {
    const user = await ensureUser(seed);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        display_name: seed.displayName,
        lc: seed.lc,
        role: seed.role,
        votes_remaining: seed.votes,
        can_vote: true,
        username: seed.email
      })
      .eq('id', user.id);

    if (updateError) {
      throw updateError;
    }

    console.log(`Seeded ${seed.email} (${seed.role})`);
  }

  console.log('Seeding completed.');
}

main().catch((error) => {
  console.error('Seeding failed:', error.message ?? error);
  process.exit(1);
});
