create type public.app_role as enum ('admin','user');
create table public.user_roles (id uuid primary key default gen_random_uuid(), user_id uuid not null, role app_role not null, unique(user_id, role));
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create or replace function public.has_role(_user_id uuid, _role app_role) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.user_roles where user_id=_user_id and role=_role) $$;
create policy "own roles readable" on public.user_roles for select to authenticated using (user_id = auth.uid());
create or replace function public.claim_admin() returns boolean language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is null then return false; end if;
  if exists(select 1 from public.user_roles where role='admin') then return public.has_role(auth.uid(),'admin'); end if;
  insert into public.user_roles(user_id, role) values (auth.uid(),'admin');
  return true;
end $$;
grant execute on function public.claim_admin() to authenticated;

create table public.entries (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  category text not null default 'Landing page',
  tags text[] not null default '{}',
  original_url text,
  demo_url text,
  thumbnail_url text,
  prompt text not null default '',
  status text not null default 'published',
  submitted_by uuid,
  hue int not null default 150,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.entries to anon, authenticated;
grant insert, update, delete on public.entries to authenticated;
grant all on public.entries to service_role;
alter table public.entries enable row level security;
create policy "published public" on public.entries for select to anon, authenticated using (status='published' or public.has_role(auth.uid(),'admin'));
create policy "admin insert" on public.entries for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "admin update" on public.entries for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin delete" on public.entries for delete to authenticated using (public.has_role(auth.uid(),'admin'));

create table public.favorites (
  user_id uuid not null,
  entry_id uuid not null references public.entries(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, entry_id)
);
grant select, insert, delete on public.favorites to authenticated;
grant all on public.favorites to service_role;
alter table public.favorites enable row level security;
create policy "own favs select" on public.favorites for select to authenticated using (user_id=auth.uid());
create policy "own favs insert" on public.favorites for insert to authenticated with check (user_id=auth.uid());
create policy "own favs delete" on public.favorites for delete to authenticated using (user_id=auth.uid());

insert into public.entries (slug,name,description,category,tags,demo_url,prompt,hue) values
('cohere','Soft Intelligence','Calm AI landing page with soft gradients','Landing page',array['ai','enterprise','gradient'],null,'Build a calm enterprise AI landing page. Warm off-white background, large soft serif headline centred, short grey subheading, a dark pill "Request a demo" button and an outlined secondary. Below, a 4-column card tray with product areas, each card listing links with thin dividers and small arrows. Decorate with blurred pastel orbs. Generous whitespace, slow fade-in on scroll.',150),
('linear','Precision Workspace','Dark product page with crisp keyboard-first UI','SaaS',array['dark','productivity','motion'],null,'Build a dark, precise SaaS landing page for an issue tracker. Near-black background, subtle gradient glow behind a centred hero, tight sans headline, product screenshot in a glowing frame with perspective tilt. Feature sections alternate text and UI panels; keyboard shortcut chips; restrained motion.',260),
('stripe','Flow Payments','Payments homepage with animated gradient wave','Fintech',array['gradient','payments','animation'],null,'Build a payments homepage with an animated diagonal multicolour gradient wave behind the hero. Left-aligned bold headline, email capture with "Start now" button, right side shows a floating phone + checkout card. Below: logo strip, then 3 product columns with icons.',220),
('arc','Colour Browser','Playful browser landing with colourful sidebars','Landing page',array['playful','colour','browser'],null,'Build a playful browser landing page: big friendly headline, pastel colour blocks, a mock browser window with a vertical sidebar of tabs, and bouncy hover animations on feature cards.',20),
('notion','Sketch Workspace','Friendly docs workspace with hand-drawn illustrations','Productivity',array['illustration','docs','light'],null,'Build a friendly workspace landing page: white background, black serif-free headline, hand-drawn style spot illustrations, a tabbed product demo area switching between Docs, Wikis and Projects.',40),
('raycast','Command Centre','Command palette launcher with glassy dark UI','Developer tools',array['dark','command-palette','glass'],null,'Build a launcher app landing page: dark background with red glow, interactive command palette in the hero you can type into and filter results, glassy panels, keyboard key visuals.',0);