# ⚡ Accuracy Flux

> **Practice management software built for accounting firms.**
> Run your whole firm from one place — clients, work pipeline, kanban board, time tracking, invoicing, and a secure client portal.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?style=flat-square&logo=supabase)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38BDF8?style=flat-square&logo=tailwindcss)

---

## ✨ Features

### 📊 Dashboard
- Live stats: Active Clients, Revenue This Month, Revenue/Hour, Open Work Items, Hours This Week
- Revenue tracks only payments explicitly marked **Received** — no guessing
- Month-over-month revenue % change badge (hidden when no prior data exists)
- **Revenue/Hour** — total fees received ÷ hours logged this month
- **Team Workload** widget: per-employee monthly hours + revenue contribution (pro-rata)
- **Work Pipeline** widget: top 5 active work items with progress rings
- **Activity Feed** with real-time updates

### 🗂️ Kanban Board
- Drag-and-drop cards across fully customizable columns
- Each card represents a **client** and contains all their business entities inside
- Per-entity task groups with phase headers (Engagement, Data Collection, Preparation, Review, Filing)
- **Auto-computed tax deadlines** per entity type (1040 = Apr 15, S-Corp = Mar 15, Partnership = Mar 15, etc.)
- **Task templates** pre-loaded per entity type — skip setup, start working
- Assign employees to individual tasks; task order stays stable after assignment
- Payment status toggle per card (**Pending / Received**) — feeds directly into dashboard revenue
- **Multi-filter panel**: filter by Labels, Entity Type (LLC, S-Corp, C-Corp, Partnership, Individual, etc.), or Payment Status
- Real-time updates via Supabase subscriptions
- Pre-built **2026 Tax Season** board with columns: Clients, In Progress, Waiting on Docs, In Review, Filed

### 💼 Work Items
- Dedicated `/work` page — one card per **business entity** (company), not per client
- Clients with multiple companies each get their own card
- Each card shows: entity name, entity type badge, auto-computed deadline, task progress, fee + payment status, labels
- Click any card to open the edit panel — tasks are grouped by entity, focused entity appears first
- Full edit panel: status, priority, due date, assignee, fee, payment toggle, time spent summary
- Completion summary: "✓ Completed in Xh · $Y/hr" when all tasks are done
- Search by company name, client name, or label; filter by status or payment

### 👥 Client Management
- Full client database with grid & list views
- Each client supports **multiple business entities** (name + entity type)
- Status tracking: Active, Onboarding, Inactive
- Only **Referral** label shown in client cards — clean display
- One-click invoice creation with tax calculation
- Client portal invite via email

### ⏱️ Time Tracking
- Log time against any work item
- Dashboard shows hours this week and this month firm-wide
- Per-employee hour totals with revenue attribution
- Completion time shown on work item cards when all tasks are done

### 🧾 Invoicing
- Auto-numbered invoices tied to clients
- Status: Draft, Sent, Paid, Overdue
- Invoice revenue contributes to the monthly revenue stat alongside work item fees

### 🔒 Client Portal
- Clients get their own login — they only see their own documents and messages
- File uploads with drag-and-drop support
- Real-time messaging between staff and clients
- Files stored securely in Supabase Storage

### 👨‍👩‍👧 Team Management
- **Role system:** Owner → Admin → Staff → Client
- Invite team members via email (set-password link sent automatically)
- Owners can promote/demote staff to admin roles
- Each user has a customizable avatar color shown throughout the app

### 🏷️ Labels & Tags
- Global tag management with custom color picker
- Tags sync across kanban cards and work items
- Filter the kanban board by label

### 🔐 Authentication & Security
- Email + password login via Supabase Auth
- **TOTP 2FA** support (Google Authenticator / Authy)
- Auth middleware routes clients to `/portal`, staff to `/dashboard` automatically
- Row Level Security on every database table

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router, TypeScript) |
| **Database** | Supabase (PostgreSQL + RLS) |
| **Auth** | Supabase Auth (email + TOTP 2FA) |
| **Storage** | Supabase Storage |
| **Realtime** | Supabase Realtime subscriptions |
| **Styling** | Tailwind CSS v4 + custom design tokens |
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

This creates all tables, Row Level Security policies, triggers, the `portal-documents` storage bucket, and seeds a default 2026 Tax Season kanban board.

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
│   ├── clients/               → Client management (multi-entity support)
│   ├── dashboard/             → Stats, revenue, team workload, pipeline
│   ├── kanban/                → Drag-and-drop board with per-entity task groups
│   ├── login/                 → Auth page (staff + client toggle)
│   ├── portal/                → Client-facing file & message portal
│   ├── settings/              → Profile, password, sign out
│   ├── team/                  → Team management (admin/owner only)
│   └── work/                  → Work items — one card per business entity
├── components/
│   ├── dashboard/             → StatCard, RevenueChart, TeamWorkload, WorkPipeline, ActivityFeed
│   ├── kanban/KanbanBoard.tsx → Full kanban with filters, templates, payment toggle
│   ├── layout/                → Sidebar, TopBar, AppShell
│   └── ui/                    → Shared UI primitives
└── lib/
    ├── hooks/                 → Data hooks (Supabase + real-time subscriptions)
    ├── supabase/              → Browser & server clients
    ├── templates/             → Task templates per entity type
    ├── types/database.ts      → TypeScript types for all DB tables
    └── utils/tax-deadlines.ts → Auto deadline calculation per entity type
```

---

## 🔑 Role System

| Role | Access |
|---|---|
| 🟣 **Owner** | Full access — including role management |
| 🔵 **Admin** | Manage clients, work, kanban, invite & manage team |
| ⚪ **Staff** | Manage clients, work items, and kanban cards |
| 🟢 **Client** | Portal only — their own documents and messages |

---

## 🗄️ Database Tables

| Table | Description |
|---|---|
| `profiles` | Extends `auth.users` — stores name, role, avatar color |
| `clients` | Client records with `business_entities` JSONB array (name + entity type) |
| `work_items` | Engagements with status, priority, fee, `payment_status`, `payment_received_at` |
| `tasks` | Subtasks linked to a work item and optionally a `business_name` |
| `kanban_boards` | Named boards (e.g. "2026 Tax Season") |
| `kanban_columns` | Columns within a board |
| `kanban_cards` | Cards with client link, priority, due date, tags, payment status |
| `invoices` | Auto-numbered invoices tied to clients |
| `portal_documents` | File metadata for client uploads |
| `portal_messages` | Messages between staff and clients |
| `time_entries` | Time tracking records per work item and employee |
| `global_tags` | Firm-wide labels with custom hex colors |

---

## 📜 License

MIT — use it however you like.

---

<p align="center">Built with ⚡ by <strong>Accuracy Flux</strong></p>
