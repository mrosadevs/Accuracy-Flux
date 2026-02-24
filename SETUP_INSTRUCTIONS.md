# Accuracy Flux — Setup Instructions

This document walks you through everything you need to do to go from the current state (app running with mock data) to a fully functional app backed by Supabase.

---

## What's already done

- Next.js 16 app with all pages wired up (Dashboard, Clients, Kanban, Work, Portal)
- Supabase packages installed (`@supabase/supabase-js`, `@supabase/ssr`)
- All hooks written with mock-data fallback (app works without Supabase connected)
- Complete SQL schema in `supabase-schema.sql` ready to run
- Auth middleware protecting all routes
- File upload support for the Client Portal
- `.env.local` template with placeholder values

---

## Step 1 — Create a Supabase project

1. Go to [https://supabase.com](https://supabase.com) and sign in / create account
2. Click **New project**
3. Choose a name (e.g. `accuracy-flux`), set a strong database password, pick a region close to you
4. Wait ~2 minutes for the project to provision

---

## Step 2 — Get your API keys

1. In your Supabase project, go to **Settings → API**
2. Copy:
   - **Project URL** — looks like `https://abcdefghijkl.supabase.co`
   - **anon / public key** — the long JWT starting with `eyJ...`

3. Open `accuracy-flux/.env.local` and replace the placeholders:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
```

Replace `YOUR_PROJECT_REF` with your actual project ref and `YOUR_ANON_KEY_HERE` with your anon key. **Do not commit this file to git.**

---

## Step 3 — Run the SQL schema

1. In your Supabase project, go to **SQL Editor** (left sidebar)
2. Click **New query**
3. Open the file `accuracy-flux/supabase-schema.sql` in a text editor and copy its entire contents
4. Paste into the SQL Editor and click **Run**

This creates:
- All 11 tables (profiles, clients, work_items, tasks, kanban_boards, kanban_columns, kanban_cards, invoices, portal_documents, portal_messages, time_entries, activities)
- Row Level Security policies on every table
- Auto-profile creation trigger (when a new user signs up, a profile row is created automatically)
- Auto-invoice number trigger (e.g. `INV-2026-0001`)
- Storage bucket `portal-documents` for client file uploads
- Seed data: a default "2026 Tax Season" kanban board with 5 columns (Backlog, In Progress, Waiting on Client, Review, Completed)

If you see any errors about existing tables, that's fine — just run it again or run each block individually.

---

## Step 4 — Configure Auth settings

1. In Supabase, go to **Authentication → Providers**
2. Make sure **Email** is enabled (it should be by default)
3. Under **Authentication → Email Templates**, you can customise the confirmation email if you want
4. Under **Authentication → URL Configuration**, set your **Site URL** to:
   - For local dev: `http://localhost:3000`
   - For production: your deployed URL (e.g. `https://accuracyflux.com`)
5. Add to **Redirect URLs**: `http://localhost:3000/auth/callback`

---

## Step 5 — Create your first staff user

1. In Supabase, go to **Authentication → Users**
2. Click **Invite user** (or **Add user → Create new user**)
3. Enter your work email and a strong password
4. Click **Create user**

The trigger will automatically create a matching row in the `profiles` table. You can then update your profile details in **Table Editor → profiles**.

> **Note:** To add a `full_name` immediately, after creating the user, go to **Table Editor → profiles**, find your row, and set the `full_name` field.

---

## Step 6 — Verify the storage bucket

1. Go to **Storage** in your Supabase project
2. You should see a bucket called `portal-documents`
3. If it's missing, create it manually:
   - Click **New bucket**
   - Name: `portal-documents`
   - Set to **Private** (not public)
   - Click **Create bucket**
4. Then run just this part of the schema to add policies (copy from `supabase-schema.sql`, look for the `-- Storage policies` section)

---

## Step 7 — Start the app

In your terminal, navigate to the accuracy-flux directory:

```bash
cd "C:\Users\viole\OneDrive\Documents\ClaudeCoWork\Accuracy Flux\accuracy-flux"
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

You'll be redirected to `/login`. Sign in with the staff user credentials you created in Step 5.

> **Without Supabase configured** (placeholder values in .env.local): The app bypasses auth and loads with mock/demo data. This is useful for UI testing.

---

## Step 8 — Add clients and data

Once logged in with real Supabase credentials, the app will start empty (no mock data). You'll need to:

1. **Add clients** — Go to Clients → (the "+" button isn't wired to a form yet, so add directly in Table Editor → `clients` for now)
2. **Add work items** — Table Editor → `work_items`
3. **Add kanban cards** — The seed data created the board/columns; add cards via Table Editor → `kanban_cards` or through the + button in the UI

> **Coming next:** Adding "New Client", "New Work Item" modal forms to the UI. For now, use the Supabase Table Editor to seed data.

---

## Step 9 — Set up client portal users (optional)

The portal is for sharing documents and messages with specific clients. To set up a portal user:

1. Create a user in **Authentication → Users** with the client's email
2. In **Table Editor → clients**, find the client's row and set `portal_user_id` to the UUID of the newly created user
3. The client can then log in at `/login` and only see their own portal data

---

## Step 10 — Enable 2FA for staff accounts (optional)

The login page supports TOTP-based 2FA. To enable it:

1. Log into the app normally
2. The 2FA setup flow is handled in the `use-auth.ts` hook via `supabase.auth.mfa.enroll()`
3. You'll need to add a "Security Settings" page to the UI to surface the QR code enrollment flow (not yet built)
4. Once a TOTP factor is enrolled and verified, subsequent logins will prompt for the 6-digit code

---

## File structure summary

```
accuracy-flux/
├── .env.local                          ← Your Supabase keys go here
├── supabase-schema.sql                 ← Run this in Supabase SQL Editor
├── src/
│   ├── app/
│   │   ├── login/page.tsx              ← Auth with Supabase + 2FA support
│   │   ├── dashboard/page.tsx          ← Overview stats (mock data for now)
│   │   ├── clients/page.tsx            ← Client list + invoice modal
│   │   ├── work/page.tsx               ← Work items + task tracking
│   │   ├── kanban/page.tsx             ← Drag-and-drop Kanban board
│   │   ├── portal/page.tsx             ← Client portal (files + messages)
│   │   └── auth/callback/route.ts      ← OAuth callback handler
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts               ← Browser Supabase client
│   │   │   └── server.ts               ← Server Supabase client
│   │   ├── types/database.ts           ← TypeScript types for all tables
│   │   └── hooks/
│   │       ├── use-auth.ts             ← Auth (signIn, signOut, 2FA)
│   │       ├── use-clients.ts          ← Client CRUD + realtime
│   │       ├── use-invoices.ts         ← Invoice management
│   │       ├── use-kanban.ts           ← Kanban board + drag-drop
│   │       ├── use-work-items.ts       ← Work items + task completion
│   │       └── use-portal.ts           ← File upload + messaging
│   └── proxy.ts                        ← Auth protection middleware
```

---

## Environment variable reference

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon/public |

---

## Deploying to production (later)

When you're ready to deploy (e.g. on Vercel):

1. Push your code to GitHub (make sure `.env.local` is in `.gitignore`)
2. Import the repo in Vercel
3. Add environment variables in Vercel's project settings (same two vars)
4. Update Supabase Auth → URL Configuration with your Vercel URL
5. Add `https://your-domain.vercel.app/auth/callback` to Redirect URLs

---

## Troubleshooting

**"Loading..." spinner never goes away**
→ Supabase is configured but the query is failing. Check your API keys in `.env.local` and make sure the schema was run successfully.

**Redirected to /login even with correct credentials**
→ Check that your Site URL and Redirect URL are set correctly in Supabase Auth settings (Step 4).

**File uploads fail in Portal**
→ Make sure the `portal-documents` storage bucket exists and is set to Private (Step 6).

**"relation does not exist" SQL error**
→ Run `supabase-schema.sql` again from the beginning. Some tables depend on others being created first.

**App shows mock data even after setting up Supabase**
→ Restart the dev server after editing `.env.local`. Next.js caches env vars at startup.
