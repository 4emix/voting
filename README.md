# LC Voting Portal

A secure voting application built with Next.js 14 (App Router), Supabase (Postgres + Auth), and Tailwind CSS. The portal allows ~20 authenticated users to cast votes across multiple submissions, while administrators can manage vote balances and audit submissions. The stack is designed for Supabase hosting (database & auth) and Vercel deployment.

## Features

- **Authentication** – Email/password login backed by Supabase Auth.
- **Voting workflow** – Eight-option ballot (A–G + NONE) with mutual exclusivity logic, vote balance tracking, and atomic submissions via PostgreSQL functions.
- **Admin dashboard** – Transfer votes, set balances, toggle voting permissions, and review submission logs with filters.
- **Supabase-first data model** – Row Level Security on all tables, security-definer RPC functions, and auditable admin actions.
- **Deployment ready** – Environment configuration for Vercel, seeding script for initial users, and SQL migration files for Supabase.

## Project structure

```
app/                Next.js App Router pages (login, vote, admin, API routes)
components/         Reusable client components (forms, dashboards)
lib/                Supabase helpers, auth utilities, and constants
types/              Typed Supabase schema definitions
supabase/           SQL schema & cleanup scripts
scripts/            Seed script using Supabase service role
```

## Prerequisites

- Node.js 18+
- npm 9+
- Supabase project (database + auth)
- Vercel account (for deployment)

## Getting started locally

1. **Clone and install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables**

   Copy `.env.example` to `.env.local` and populate values from your Supabase project.

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

   > `SUPABASE_SERVICE_ROLE_KEY` is used only on the server (API routes and scripts) and must never be exposed to the browser.

3. **Run the development server**

   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3000`.

## Supabase setup

1. **Create a Supabase project** and retrieve the project URL, anon key, and service role key.

2. **Apply the database schema**

   - Open the Supabase SQL editor and run the contents of [`supabase/schema.sql`](supabase/schema.sql).
   - This will create the tables (`profiles`, `votes`, `admin_actions`), triggers, Row Level Security policies, and RPC functions:
     - `cast_vote(choices text[])`
     - `admin_transfer_votes(from_user uuid, to_user uuid, amount integer, actor_id uuid default auth.uid())`
     - `admin_set_votes(user_id uuid, new_amount integer, actor_id uuid default auth.uid())`
     - `admin_toggle_vote_permission(user_id uuid, can_vote boolean, actor_id uuid default auth.uid())`

3. **Review RLS policies**

   - `profiles`: users can select their own row; admins can select all. Non-admin updates are restricted to non-privileged fields.
   - `votes`: users can read their own submissions; admins can read all. Inserts happen exclusively through `cast_vote`.
   - `admin_actions`: only admins can read the log.

4. **(Optional) Cleanup**

   If you need to remove all objects created by the schema, run [`supabase/cleanup.sql`](supabase/cleanup.sql).

## Seeding initial users

Use the provided TypeScript script to create baseline users via the Supabase service role.

```bash
SUPABASE_SERVICE_ROLE_KEY=... NEXT_PUBLIC_SUPABASE_URL=... npm run seed
```

This will ensure the following accounts exist (passwords may be changed afterwards):

| Email             | Password      | Role  | LC             | Votes |
| ----------------- | ------------- | ----- | -------------- | ----- |
| admin@example.com | AdminPass123  | admin | LC HQ          | 10    |
| user1@demo.com    | Password1     | user  | LC Hacettepe   | 3     |
| user2@demo.com    | Password2     | user  | LC Cairo       | 2     |
| user3@demo.com    | Password3     | user  | LC Lisbon      | 1     |

The script idempotently creates users (re-using existing accounts if they already exist) and updates their `profiles` rows.

## Application routes

- `/login` – Email/password login form. Redirects authenticated users to `/vote`.
- `/vote` – Authenticated voting interface with checkbox selection logic and live vote balance feedback.
- `/admin` – Admin-only dashboard with user management, vote transfers, and submission logs (latest 100 entries). Access control is enforced both in middleware and at the database level.
- `/api/*` – Server-only routes that interact with Supabase via service and session clients:
  - `POST /api/vote` – Calls `cast_vote` RPC.
  - `POST /api/admin/transfer` – Calls `admin_transfer_votes` RPC.
  - `POST /api/admin/set-votes` – Calls `admin_set_votes` RPC.
  - `POST /api/admin/toggle-vote` – Calls `admin_toggle_vote_permission` RPC.
  - `GET /api/admin/users` – Lists all profiles for admins.
  - `GET /api/admin/votes` – Lists recent votes with user metadata.

## Deploying to Vercel

1. **Import the repository** into Vercel.
2. **Set environment variables** in the Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. **Deploy** – Vercel will run `npm install` and `npm run build` automatically.
4. **Seed production users** by running the seed script locally with the production service role key:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your-prod-url \
   SUPABASE_SERVICE_ROLE_KEY=your-prod-service-key \
   npm run seed
   ```

   The default admin login is `admin@example.com / AdminPass123`.

## Testing & linting

- `npm run lint` – Run ESLint.
- `npm run seed` – Seed Supabase with demo accounts (requires environment variables).

## Security considerations

- Service role key is used only in server environments (API routes, seed script). Do not expose it to the client.
- All data mutations (voting, transfers, balance updates) execute in Postgres via security-definer functions to guarantee atomicity.
- Middleware enforces authentication for `/vote` and both authentication and admin role for `/admin`.

## License

MIT
