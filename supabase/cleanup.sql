drop function if exists public.admin_toggle_vote_permission(uuid, boolean, uuid);
drop function if exists public.admin_set_votes(uuid, integer, uuid);
drop function if exists public.admin_transfer_votes(uuid, uuid, integer, uuid);
drop function if exists public.ensure_admin(uuid);
drop function if exists public.cast_vote(text[]);

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

drop table if exists public.admin_actions cascade;
drop table if exists public.votes cascade;
drop table if exists public.profiles cascade;
