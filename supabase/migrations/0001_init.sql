-- The Tanza Teaching Experience: esquema inicial

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  role text not null default 'student' check (role in ('admin','student')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.sections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  cover_url text,
  icon text,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table public.levels (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text,
  position int not null default 0
);

create table public.genres (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text
);

create table public.items (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.sections(id) on delete cascade,
  title text not null,
  cover_url text,
  body text,
  links jsonb not null default '[]',
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.item_levels (
  item_id uuid references public.items(id) on delete cascade,
  level_id uuid references public.levels(id) on delete cascade,
  primary key (item_id, level_id)
);

create table public.item_genres (
  item_id uuid references public.items(id) on delete cascade,
  genre_id uuid references public.genres(id) on delete cascade,
  primary key (item_id, genre_id)
);

create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  file_url text not null,
  name text,
  type text check (type in ('pdf','image'))
);

-- Helpers
create or replace function public.is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin' and active);
$$;

create or replace function public.is_active_user() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and active);
$$;

-- Perfil automático al registrarse
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, name) values (new.id, new.raw_user_meta_data->>'name');
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.sections enable row level security;
alter table public.levels enable row level security;
alter table public.genres enable row level security;
alter table public.items enable row level security;
alter table public.item_levels enable row level security;
alter table public.item_genres enable row level security;
alter table public.attachments enable row level security;

create policy "own profile" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "admin manages profiles" on public.profiles for all using (public.is_admin()) with check (public.is_admin());

-- Lectura: usuarios activos; escritura: admin
do $$
declare t text;
begin
  foreach t in array array['sections','levels','genres','item_levels','item_genres'] loop
    execute format('create policy "read %1$s" on public.%1$s for select using (public.is_active_user())', t);
    execute format('create policy "admin write %1$s" on public.%1$s for all using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

create policy "read published items" on public.items for select
  using (public.is_admin() or (published and public.is_active_user()));
create policy "admin write items" on public.items for all using (public.is_admin()) with check (public.is_admin());

create policy "read attachments" on public.attachments for select
  using (public.is_admin() or exists (select 1 from items i where i.id = item_id and i.published and public.is_active_user()));
create policy "admin write attachments" on public.attachments for all using (public.is_admin()) with check (public.is_admin());

-- Storage: bucket privado "media"
insert into storage.buckets (id, name, public) values ('media', 'media', false) on conflict do nothing;

create policy "read media" on storage.objects for select using (bucket_id = 'media' and public.is_active_user());
create policy "admin write media" on storage.objects for all
  using (bucket_id = 'media' and public.is_admin()) with check (bucket_id = 'media' and public.is_admin());

-- Niveles iniciales
insert into public.levels (name, position) values ('A1',1),('A2',2),('B1',3),('B2',4),('C1',5);
