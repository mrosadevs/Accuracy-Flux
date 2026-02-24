-- ============================================================
-- ACCURACY FLUX - Supabase Database Schema
-- ============================================================
-- Run this entire file in your Supabase SQL Editor:
-- https://supabase.com/dashboard → SQL Editor → New query
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. PROFILES (extends auth.users)
-- ─────────────────────────────────────────────
create table if not exists public.profiles (
  id         uuid references auth.users on delete cascade primary key,
  name       text not null default '',
  role       text not null default 'staff', -- 'owner' | 'admin' | 'staff' | 'client'
  initials   text,
  color      text default '#3b82f6',
  avatar_url text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view all profiles"
  on public.profiles for select using (auth.role() = 'authenticated');

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup + auto-link portal client invites
create or replace function public.handle_new_user()
returns trigger as $$
declare
  client_id_meta uuid;
begin
  -- Insert staff/client profile
  insert into public.profiles (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'staff')
  );

  -- If invited as a portal client, link their auth user to the clients table
  client_id_meta := (new.raw_user_meta_data->>'client_id')::uuid;
  if client_id_meta is not null then
    update public.clients
    set portal_user_id = new.id
    where id = client_id_meta;
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ─────────────────────────────────────────────
-- 2. CLIENTS
-- ─────────────────────────────────────────────
create table if not exists public.clients (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  company             text default '',
  email               text not null,
  phone               text default '',
  status              text not null default 'active', -- 'active' | 'inactive' | 'onboarding'
  type                text not null default 'individual', -- 'individual' | 'business'
  assigned_to_id      uuid references public.profiles(id),
  assigned_to         text default '',
  tags                text[] default '{}',
  total_billed        numeric default 0,
  outstanding_balance numeric default 0,
  last_activity       timestamptz default now(),
  portal_user_id      uuid,
  created_at          timestamptz default now()
);

alter table public.clients enable row level security;

create policy "Staff can manage all clients"
  on public.clients for all using (auth.role() = 'authenticated');


-- ─────────────────────────────────────────────
-- 3. WORK ITEMS
-- ─────────────────────────────────────────────
create table if not exists public.work_items (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  client_id   uuid references public.clients(id) on delete cascade,
  client_name text default '',
  type        text not null default 'tax-return',
  status      text not null default 'not-started',
  priority    text not null default 'medium',
  assignee_id uuid references public.profiles(id),
  assignee    text default '',
  due_date    date,
  start_date  date,
  progress    integer default 0,
  budget      numeric default 0,
  time_spent  numeric default 0,
  description text,
  created_at  timestamptz default now()
);

alter table public.work_items enable row level security;

create policy "Authenticated can manage work items"
  on public.work_items for all using (auth.role() = 'authenticated');


-- ─────────────────────────────────────────────
-- 4. TASKS (sub-items of work items)
-- ─────────────────────────────────────────────
create table if not exists public.tasks (
  id           uuid primary key default gen_random_uuid(),
  work_item_id uuid references public.work_items(id) on delete cascade not null,
  title        text not null,
  completed    boolean default false,
  assignee_id  uuid references public.profiles(id),
  assignee     text,
  due_date     date,
  sort_order   integer default 0,
  created_at   timestamptz default now()
);

alter table public.tasks enable row level security;

create policy "Authenticated can manage tasks"
  on public.tasks for all using (auth.role() = 'authenticated');


-- ─────────────────────────────────────────────
-- 5. KANBAN BOARDS
-- ─────────────────────────────────────────────
create table if not exists public.kanban_boards (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  year       integer,
  starred    boolean default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

alter table public.kanban_boards enable row level security;

create policy "Authenticated can manage boards"
  on public.kanban_boards for all using (auth.role() = 'authenticated');


-- ─────────────────────────────────────────────
-- 6. KANBAN COLUMNS
-- ─────────────────────────────────────────────
create table if not exists public.kanban_columns (
  id         uuid primary key default gen_random_uuid(),
  board_id   uuid references public.kanban_boards(id) on delete cascade not null,
  title      text not null,
  color      text default '#94a3b8',
  sort_order integer default 0,
  created_at timestamptz default now()
);

alter table public.kanban_columns enable row level security;

create policy "Authenticated can manage columns"
  on public.kanban_columns for all using (auth.role() = 'authenticated');


-- ─────────────────────────────────────────────
-- 7. KANBAN CARDS
-- ─────────────────────────────────────────────
create table if not exists public.kanban_cards (
  id                 uuid primary key default gen_random_uuid(),
  column_id          uuid references public.kanban_columns(id) on delete cascade not null,
  title              text not null,
  description        text,
  client_id          uuid references public.clients(id),
  client_name        text,
  assignee_id        uuid references public.profiles(id),
  assignee           text,
  priority           text default 'medium',
  due_date           date,
  tags               text[] default '{}',
  progress           integer default 0,
  sort_order         integer default 0,
  comments_count     integer default 0,
  attachments_count  integer default 0,
  subtasks_total     integer default 0,
  subtasks_completed integer default 0,
  created_at         timestamptz default now()
);

alter table public.kanban_cards enable row level security;

create policy "Authenticated can manage cards"
  on public.kanban_cards for all using (auth.role() = 'authenticated');


-- ─────────────────────────────────────────────
-- 8. INVOICES
-- ─────────────────────────────────────────────
create table if not exists public.invoices (
  id             uuid primary key default gen_random_uuid(),
  client_id      uuid references public.clients(id) on delete cascade not null,
  invoice_number text,
  amount         numeric not null default 0,
  tax_amount     numeric default 0,
  status         text default 'draft', -- 'draft' | 'sent' | 'paid' | 'overdue'
  due_date       date,
  issued_date    date default current_date,
  description    text,
  line_items     jsonb default '[]',
  created_by     uuid references public.profiles(id),
  created_at     timestamptz default now(),
  paid_at        timestamptz
);

alter table public.invoices enable row level security;

create policy "Authenticated can manage invoices"
  on public.invoices for all using (auth.role() = 'authenticated');

-- Auto-generate invoice number
create or replace function public.set_invoice_number()
returns trigger as $$
declare
  next_num integer;
begin
  select coalesce(max(cast(regexp_replace(invoice_number, '[^0-9]', '', 'g') as integer)), 0) + 1
  into next_num
  from public.invoices;
  new.invoice_number := 'INV-' || to_char(now(), 'YYYY') || '-' || lpad(next_num::text, 3, '0');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists set_invoice_number_trigger on public.invoices;
create trigger set_invoice_number_trigger
  before insert on public.invoices
  for each row when (new.invoice_number is null)
  execute procedure public.set_invoice_number();


-- ─────────────────────────────────────────────
-- 9. PORTAL DOCUMENTS
-- ─────────────────────────────────────────────
create table if not exists public.portal_documents (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid references public.clients(id) on delete cascade not null,
  filename    text not null,
  file_path   text not null,
  file_size   bigint,
  mime_type   text,
  uploaded_by uuid references auth.users,
  description text,
  tags        text[] default '{}',
  created_at  timestamptz default now()
);

alter table public.portal_documents enable row level security;

create policy "Staff can manage all portal docs"
  on public.portal_documents for all
  using (auth.role() = 'authenticated');

create policy "Clients can view own portal docs"
  on public.portal_documents for select
  using (
    exists (
      select 1 from public.clients c
      where c.id = portal_documents.client_id
      and c.portal_user_id = auth.uid()
    )
  );

create policy "Clients can upload own portal docs"
  on public.portal_documents for insert
  with check (
    exists (
      select 1 from public.clients c
      where c.id = portal_documents.client_id
      and c.portal_user_id = auth.uid()
    )
  );


-- ─────────────────────────────────────────────
-- 10. PORTAL MESSAGES
-- ─────────────────────────────────────────────
create table if not exists public.portal_messages (
  id             uuid primary key default gen_random_uuid(),
  client_id      uuid references public.clients(id) on delete cascade not null,
  sender_id      uuid references auth.users,
  sender_name    text,
  message        text not null,
  is_from_client boolean default false,
  read_at        timestamptz,
  created_at     timestamptz default now()
);

alter table public.portal_messages enable row level security;

create policy "Authenticated staff can manage messages"
  on public.portal_messages for all
  using (auth.role() = 'authenticated');

create policy "Clients can view own messages"
  on public.portal_messages for select
  using (
    exists (
      select 1 from public.clients c
      where c.id = portal_messages.client_id
      and c.portal_user_id = auth.uid()
    )
  );

create policy "Clients can send own messages"
  on public.portal_messages for insert
  with check (
    exists (
      select 1 from public.clients c
      where c.id = portal_messages.client_id
      and c.portal_user_id = auth.uid()
    )
  );


-- ─────────────────────────────────────────────
-- 11. TIME ENTRIES
-- ─────────────────────────────────────────────
create table if not exists public.time_entries (
  id           uuid primary key default gen_random_uuid(),
  work_item_id uuid references public.work_items(id),
  client_id    uuid references public.clients(id),
  user_id      uuid references public.profiles(id),
  description  text,
  hours        numeric not null,
  date         date not null default current_date,
  billable     boolean default true,
  rate         numeric default 0,
  created_at   timestamptz default now()
);

alter table public.time_entries enable row level security;

create policy "Authenticated can manage time entries"
  on public.time_entries for all using (auth.role() = 'authenticated');


-- ─────────────────────────────────────────────
-- 12. ACTIVITIES (activity feed)
-- ─────────────────────────────────────────────
create table if not exists public.activities (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid references public.profiles(id),
  user_name text,
  action    text not null,
  target    text,
  project   text,
  type      text, -- 'task' | 'work' | 'document' | 'email'
  created_at timestamptz default now()
);

alter table public.activities enable row level security;

create policy "Authenticated can view activities"
  on public.activities for select using (auth.role() = 'authenticated');

create policy "Authenticated can create activities"
  on public.activities for insert with check (auth.role() = 'authenticated');


-- ─────────────────────────────────────────────
-- 13. STORAGE BUCKET for portal documents
-- ─────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('portal-documents', 'portal-documents', false)
on conflict (id) do nothing;

create policy "Authenticated staff can manage portal storage"
  on storage.objects for all
  using (bucket_id = 'portal-documents' and auth.role() = 'authenticated');

create policy "Clients can upload to own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'portal-documents'
    and auth.uid() is not null
  );

create policy "Clients can view own files"
  on storage.objects for select
  using (bucket_id = 'portal-documents' and auth.uid() is not null);


-- ─────────────────────────────────────────────
-- 14. SEED DATA (optional — comment out if you want to start fresh)
-- ─────────────────────────────────────────────

-- Seed a default Kanban board for 2026 Tax Season
do $$
declare
  board_id uuid;
  col_backlog uuid;
  col_todo uuid;
  col_inprogress uuid;
  col_review uuid;
  col_done uuid;
begin
  insert into public.kanban_boards (title, year, starred)
  values ('2026 Tax Season', 2026, true)
  returning id into board_id;

  insert into public.kanban_columns (board_id, title, color, sort_order) values
    (board_id, 'Backlog',     '#94a3b8', 0) returning id into col_backlog;
  insert into public.kanban_columns (board_id, title, color, sort_order) values
    (board_id, 'To Do',       '#3b82f6', 1) returning id into col_todo;
  insert into public.kanban_columns (board_id, title, color, sort_order) values
    (board_id, 'In Progress', '#f59e0b', 2) returning id into col_inprogress;
  insert into public.kanban_columns (board_id, title, color, sort_order) values
    (board_id, 'In Review',   '#8b5cf6', 3) returning id into col_review;
  insert into public.kanban_columns (board_id, title, color, sort_order) values
    (board_id, 'Completed',   '#10b981', 4) returning id into col_done;
end $$;

-- ─────────────────────────────────────────────
-- 14B. INTERNAL MESSAGING (Triage — staff only)
-- ─────────────────────────────────────────────

-- Threads: each thread is a named conversation topic
create table if not exists public.internal_threads (
  id                   uuid primary key default gen_random_uuid(),
  created_at           timestamptz default now(),
  created_by           uuid references public.profiles(id) on delete set null,
  creator_name         text,
  title                text not null,
  last_message_at      timestamptz default now(),
  last_message_preview text
);

alter table public.internal_threads enable row level security;

create policy "Staff can view threads"
  on public.internal_threads for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('owner', 'admin', 'staff'))
  );

create policy "Staff can create threads"
  on public.internal_threads for insert
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('owner', 'admin', 'staff'))
  );

create policy "Staff can update threads"
  on public.internal_threads for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('owner', 'admin', 'staff'))
  );


-- Messages within threads
create table if not exists public.internal_messages (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  thread_id   uuid references public.internal_threads(id) on delete cascade not null,
  sender_id   uuid references public.profiles(id) on delete set null,
  sender_name text not null,
  content     text not null
);

alter table public.internal_messages enable row level security;

create policy "Staff can view messages"
  on public.internal_messages for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('owner', 'admin', 'staff'))
  );

create policy "Staff can send messages"
  on public.internal_messages for insert
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('owner', 'admin', 'staff'))
  );

-- Enable realtime for triage
alter publication supabase_realtime add table public.internal_threads;
alter publication supabase_realtime add table public.internal_messages;


-- ─────────────────────────────────────────────
-- DONE! ✓
-- Now go to Authentication → Email Templates and configure your emails.
-- Then create your first staff user in Authentication → Users.
-- ─────────────────────────────────────────────
