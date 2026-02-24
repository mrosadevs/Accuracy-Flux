# ⚡ Accuracy Flux

> **Modern practice management software built for accounting firms.**
> Manage clients, track work, collaborate with your team, and give clients a secure portal — all in one beautiful app.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?style=flat-square&logo=supabase)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38BDF8?style=flat-square&logo=tailwindcss)

---

## ✨ Features

### 👥 Client Management
- Full client database with grid & list views
- One-click **invoice creation** with tax calculation and email delivery
- **Client portal invites** — send a secure link so clients can access their own space
- Status tracking: Active, Onboarding, Inactive

### 📋 Work Items
- Track every engagement: Tax Returns, Bookkeeping, Payroll, Advisory, Audit
- Expandable task checklists with live progress rings
- Priority levels (Low → Urgent) with visual indicators
- Assignee tracking and budget management

### 🗂️ Kanban Board
- Drag-and-drop cards across customizable columns
- Add cards from the UI with a full form (title, client, priority, due date, tags, assignee)
- Real-time updates via Supabase subscriptions
- Seeded with a **2026 Tax Season** board out of the box

### 🔒 Secure Client Portal
- Clients get their own login — they only see their documents and messages
- File uploads with drag-and-drop support
- Real-time messaging between staff and clients
- Files stored securely in Supabase Storage

### 👨‍👩‍👧 Team Management
- **Role system:** Owner → Admin → Staff
- Invite team members via email (they receive a set-password link)
- Owners can promote/demote staff to admin roles
- Each user gets a customizable avatar color shown throughout the app

### 🔐 Authentication & Security
- Email + password login with Supabase Auth
- **TOTP 2FA** support (Google Authenticator / Authy)
- Auth middleware protects all routes — clients automatically land on `/portal`, staff on `/dashboard`
- Row Level Security on every database table

### ⚙️ Settings
- Update your display name and avatar color
- Change your password
- Sign out

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router, TypeScript) |
| **Database** | Supabase (PostgreSQL + RLS) |
| **Auth** | Supabase Auth (email + TOTP 2FA) |
| **Storage** | Supabase Storage |
| **Realtime** | Supabase Realtime subscriptions |
| **Styling** | Tailwind CSS + custom design tokens |
| **Animations** | Framer Motion |
| **Drag & Drop** | @hello-pangea/dnd |
| **Icons** | Lucide React |

---

## 🚀 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/mrosadevs/accuracy-flux.git
cd accuracy-flux
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Navigate to **Settings → API** and copy your:
   - **Project URL**
   - **anon / public** key
   - **service_role / secret** key (for invite emails)

### 3. Configure environment variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Server-only — never prefix with NEXT_PUBLIC_
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

> ⚠️ **Important:** `SUPABASE_SERVICE_ROLE_KEY` must stay server-only. It powers invite emails for clients and staff.

### 4. Run the database schema

1. Open your Supabase project → **SQL Editor → New query**
2. Paste the contents of `supabase-schema.sql` and click **Run**

This creates all tables, Row Level Security policies, triggers, the `portal-documents` storage bucket, and seeds a default kanban board.

### 5. Create your first user

1. Supabase → **Authentication → Users → Invite user**
2. Enter your email → check your inbox → set your password
3. In **Table Editor → profiles**, set your `role` to `owner`

### 6. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## 🌐 Deploy to Vercel

1. Push this repo to GitHub
2. Import at [vercel.com](https://vercel.com)
3. Add the same 3 environment variables in **Project → Settings → Environment Variables**
4. In Supabase → **Auth → URL Configuration**:
   - Set **Site URL** to your Vercel URL (e.g. `https://accuracy-flux.vercel.app`)
   - Add `https://your-domain.vercel.app/auth/callback` to **Redirect URLs**

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── invite-client/     → Send portal invite emails to clients
│   │   └── invite-staff/      → Invite new team members
│   ├── auth/callback/         → Supabase OAuth/invite callback
│   ├── clients/               → Client management + invoicing
│   ├── dashboard/             → Overview stats & activity
│   ├── kanban/                → Drag-and-drop board
│   ├── login/                 → Auth page (staff + client toggle)
│   ├── portal/                → Client-facing file & message portal
│   ├── settings/              → Profile, password, sign out
│   ├── team/                  → Team management (admin/owner only)
│   └── work/                  → Work items & task checklists
├── components/
│   ├── kanban/KanbanBoard.tsx → Full kanban implementation
│   ├── layout/                → Sidebar, TopBar, AppShell
│   └── ui/                    → Shared UI primitives
└── lib/
    ├── hooks/                 → Data hooks with Supabase + mock fallback
    ├── supabase/              → Browser & server clients
    └── types/database.ts      → TypeScript types for all DB tables
```

---

## 🔑 Role System

| Role | Access |
|---|---|
| 🟣 **Owner** | Full access — including role management and billing |
| 🔵 **Admin** | Manage clients, work, kanban, invite & manage team |
| ⚪ **Staff** | Manage clients, work items, and kanban cards |
| 🟢 **Client** | Portal only — their own documents and messages |

---

## 🗄️ Database Tables

| Table | Description |
|---|---|
| `profiles` | Extends `auth.users` — stores name, role, avatar color |
| `clients` | Client records with billing stats and portal link |
| `work_items` | Engagements (tax returns, bookkeeping, etc.) |
| `tasks` | Subtasks belonging to a work item |
| `kanban_boards` | Named boards (e.g. "2026 Tax Season") |
| `kanban_columns` | Columns within a board |
| `kanban_cards` | Individual cards with priority, due date, tags |
| `invoices` | Auto-numbered invoices tied to clients |
| `portal_documents` | File metadata for client uploads |
| `portal_messages` | Messages between staff and clients |
| `time_entries` | Time tracking records |

---

## 📜 License

MIT — use it however you like.

---

<p align="center">Built with ⚡ by <strong>Accuracy Flux</strong></p>
