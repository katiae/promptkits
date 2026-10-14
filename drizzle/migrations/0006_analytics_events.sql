create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  entry_slug text not null,
  event_type text not null check (event_type in ('view','copy_prompt','download_html','download_design_system')),
  created_at timestamptz not null default now()
);
create index analytics_events_slug_idx on public.analytics_events(entry_slug, event_type);
grant insert on public.analytics_events to anon, authenticated;
grant select on public.analytics_events to authenticated;
grant all on public.analytics_events to service_role;
alter table public.analytics_events enable row level security;
create policy "anyone records events" on public.analytics_events for insert to anon, authenticated with check (char_length(entry_slug) between 1 and 200);
create policy "admins read events" on public.analytics_events for select to authenticated using (public.has_role(auth.uid(),'admin'));