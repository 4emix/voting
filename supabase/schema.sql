-- Enable required extensions
create extension if not exists "pgcrypto" with schema public;

-- Profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  lc text not null,
  role text not null check (role in ('user', 'admin')) default 'user',
  votes_remaining integer not null default 0,
  can_vote boolean not null default true,
  created_at timestamptz not null default now()
);

-- Votes table
create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  choices jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists votes_user_id_idx on public.votes (user_id);
create index if not exists votes_created_at_idx on public.votes (created_at desc);

-- Admin actions table
create table if not exists public.admin_actions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles(id) on delete cascade,
  action_type text not null check (action_type in ('transfer', 'setVotes', 'toggleVote')),
  details jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists admin_actions_admin_id_idx on public.admin_actions (admin_id);
create index if not exists admin_actions_created_at_idx on public.admin_actions (created_at desc);

-- Trigger to create profile row after auth signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name, lc, role, votes_remaining, can_vote)
  values (new.id, new.email, split_part(new.email, '@', 1), 'LC Unknown', 'user', 0, true)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.votes enable row level security;
alter table public.admin_actions enable row level security;

-- Profiles policies
create policy profiles_select_self on public.profiles
  for select
  using (auth.uid() = id);

create policy profiles_select_admin on public.profiles
  for select
  using (exists (
    select 1 from public.profiles as p
    where p.id = auth.uid() and p.role = 'admin'
  ));

create policy profiles_update_self on public.profiles
  for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (
      select role from public.profiles as p where p.id = auth.uid()
    )
    and votes_remaining = (
      select votes_remaining from public.profiles as p where p.id = auth.uid()
    )
    and can_vote = (
      select can_vote from public.profiles as p where p.id = auth.uid()
    )
  );

create policy profiles_update_admin on public.profiles
  for update
  using (exists (
    select 1 from public.profiles as p where p.id = auth.uid() and p.role = 'admin'
  ))
  with check (true);

-- Votes policies
create policy votes_select_self on public.votes
  for select
  using (user_id = auth.uid());

create policy votes_select_admin on public.votes
  for select
  using (exists (
    select 1 from public.profiles as p where p.id = auth.uid() and p.role = 'admin'
  ));

create policy admin_actions_select_admin on public.admin_actions
  for select
  using (exists (
    select 1 from public.profiles as p where p.id = auth.uid() and p.role = 'admin'
  ));

-- Helper views
create or replace view public.profiles_with_email as
select
  p.id,
  p.role,
  p.lc,
  p.votes_remaining as vote_balance,
  p.can_vote,
  u.email
from public.profiles as p
left join auth.users as u on u.id = p.id;

create or replace view public.votes_with_users as
select
  v.id,
  v.user_id,
  v.choices,
  v.created_at,
  p.lc,
  u.email,
  p.role,
  p.votes_remaining as vote_balance,
  p.can_vote
from public.votes as v
join public.profiles as p on p.id = v.user_id
left join auth.users as u on u.id = v.user_id;

-- Voting RPC
create or replace function public.cast_vote(choices text[])
returns table (remaining integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  voter uuid := auth.uid();
  cleaned text[];
  valid_choices constant text[] := array['A','B','C','D','E','F','G','NONE'];
  votes_left integer;
  var_can_vote boolean;
begin
  if voter is null then
    raise exception 'Authentication required';
  end if;

  select votes_remaining, can_vote into votes_left, var_can_vote
  from public.profiles
  where id = voter
  for update;

  if not found then
    raise exception 'Profile not found for current user';
  end if;

  if not var_can_vote then
    raise exception 'Voting disabled for this account';
  end if;

  if votes_left <= 0 then
    raise exception 'No votes remaining';
  end if;

  select array_agg(distinct upper(trim(choice)))
  into cleaned
  from unnest(coalesce(choices, array[]::text[])) as choice
  where trim(choice) <> '';

  if cleaned is null or array_length(cleaned, 1) is null then
    raise exception 'At least one choice is required';
  end if;

  if exists (
    select 1 from unnest(cleaned) as item
    where item <> all(valid_choices)
  ) then
    raise exception 'Invalid choice detected';
  end if;

  if 'NONE' = any(cleaned) and array_length(cleaned, 1) > 1 then
    raise exception 'NONE cannot be combined with other selections';
  end if;

  update public.profiles
  set votes_remaining = votes_remaining - 1
  where id = voter
  returning votes_remaining into votes_left;

  insert into public.votes (user_id, choices)
  values (voter, to_jsonb(cleaned));

  remaining := votes_left;
  return next;
end;
$$;

-- Admin RPC helpers
create or replace function public.ensure_admin(actor uuid)
returns void
language plpgsql
as $$
declare
  actor_role text;
begin
  select role into actor_role from public.profiles where id = actor;

  if actor_role is null then
    raise exception 'Actor profile not found';
  end if;

  if actor_role <> 'admin' then
    raise exception 'Admin privileges required';
  end if;
end;
$$;

create or replace function public.admin_transfer_votes(
  from_user uuid,
  to_user uuid,
  amount integer,
  actor_id uuid default auth.uid()
)
returns table (from_remaining integer, to_remaining integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := coalesce(actor_id, auth.uid());
  from_votes integer;
  to_votes integer;
  from_can boolean;
  to_can boolean;
begin
  if actor is null then
    raise exception 'Authentication required';
  end if;

  perform public.ensure_admin(actor);

  if amount is null or amount <= 0 then
    raise exception 'Transfer amount must be positive';
  end if;

  if from_user = to_user then
    raise exception 'Cannot transfer votes to the same user';
  end if;

  select votes_remaining, can_vote into from_votes, from_can
  from public.profiles
  where id = from_user
  for update;

  if not found then
    raise exception 'Source user not found';
  end if;

  select votes_remaining, can_vote into to_votes, to_can
  from public.profiles
  where id = to_user
  for update;

  if not found then
    raise exception 'Destination user not found';
  end if;

  if not from_can then
    raise exception 'Source user is not allowed to vote';
  end if;

  if from_votes < amount then
    raise exception 'Insufficient votes to transfer';
  end if;

  update public.profiles
  set votes_remaining = votes_remaining - amount
  where id = from_user
  returning votes_remaining into from_votes;

  update public.profiles
  set votes_remaining = votes_remaining + amount
  where id = to_user
  returning votes_remaining into to_votes;

  insert into public.admin_actions (admin_id, action_type, details)
  values (
    actor,
    'transfer',
    jsonb_build_object(
      'from_user', from_user,
      'to_user', to_user,
      'amount', amount
    )
  );

  from_remaining := from_votes;
  to_remaining := to_votes;
  return next;
end;
$$;

create or replace function public.admin_set_votes(
  user_id uuid,
  new_amount integer,
  actor_id uuid default auth.uid()
)
returns table (votes_remaining integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := coalesce(actor_id, auth.uid());
  updated integer;
begin
  if actor is null then
    raise exception 'Authentication required';
  end if;

  perform public.ensure_admin(actor);

  if new_amount is null or new_amount < 0 then
    raise exception 'Votes must be zero or greater';
  end if;

  update public.profiles
  set votes_remaining = new_amount
  where id = user_id
  returning votes_remaining into updated;

  if not found then
    raise exception 'User not found';
  end if;

  insert into public.admin_actions (admin_id, action_type, details)
  values (
    actor,
    'setVotes',
    jsonb_build_object('user_id', user_id, 'votes_remaining', new_amount)
  );

  votes_remaining := updated;
  return next;
end;
$$;

create or replace function public.admin_toggle_vote_permission(
  user_id uuid,
  can_vote boolean,
  actor_id uuid default auth.uid()
)
returns table (can_vote boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := coalesce(actor_id, auth.uid());
  updated boolean;
begin
  if actor is null then
    raise exception 'Authentication required';
  end if;

  perform public.ensure_admin(actor);

  update public.profiles
  set can_vote = admin_toggle_vote_permission.can_vote
  where id = user_id
  returning can_vote into updated;

  if not found then
    raise exception 'User not found';
  end if;

  insert into public.admin_actions (admin_id, action_type, details)
  values (
    actor,
    'toggleVote',
    jsonb_build_object('user_id', user_id, 'can_vote', can_vote)
  );

  return query select updated;
end;
$$;
