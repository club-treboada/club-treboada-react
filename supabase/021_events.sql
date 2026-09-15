-- =============================================================================
-- Club Treboada - Editable Open event pages (Open Rítmica / Open Acrobática)
-- =============================================================================
-- Run in Supabase SQL editor after schema.sql (requires public.user_role()).
-- Idempotent where possible.

-- -----------------------------------------------------------------------------
-- Table
-- -----------------------------------------------------------------------------
-- One row per Open event page. Coaches/admin edit these from /admin/eventos;
-- the public pages fall back to the bundled static data (src/data/open*.js)
-- whenever a field here is null/empty or the row is missing, so the site
-- never breaks before this migration is applied or before a field is filled in.

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  -- matches the static data file / route for each Open page
  event_key text not null unique,
  title text,
  subtitle text,
  event_date text,
  description text,
  poster_url text,
  contact_email text,
  contact_phone text,
  contact_person text,
  -- ordered list of { icon, text } rows rendered in the "Detalles do evento"
  -- box under the right-hand card, e.g. [{"icon":"🏆","text":"..."}]
  details_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_key_check
    check (event_key in ('open-ritmica', 'open-acrobatica'))
);

-- -----------------------------------------------------------------------------
-- updated_at trigger
-- -----------------------------------------------------------------------------

create or replace function public.set_events_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_events_updated_at();

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------

alter table public.events enable row level security;

-- Public: everyone can read (no draft/hidden state — an Open page is either
-- described by its static fallback or by this row).
drop policy if exists "events_select_all" on public.events;
create policy "events_select_all"
  on public.events
  for select
  to anon, authenticated
  using (true);

drop policy if exists "events_insert_staff" on public.events;
create policy "events_insert_staff"
  on public.events
  for insert
  to authenticated
  with check (public.user_role() in ('admin', 'coach'));

drop policy if exists "events_update_staff" on public.events;
create policy "events_update_staff"
  on public.events
  for update
  to authenticated
  using (public.user_role() in ('admin', 'coach'))
  with check (public.user_role() in ('admin', 'coach'));

drop policy if exists "events_delete_staff" on public.events;
create policy "events_delete_staff"
  on public.events
  for delete
  to authenticated
  using (public.user_role() in ('admin', 'coach'));
