
-- Files metadata table
create table public.files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  storage_path text not null unique,
  mime_type text,
  size_bytes bigint not null default 0,
  created_at timestamptz not null default now()
);

alter table public.files enable row level security;

create policy "Users view own files" on public.files
  for select to authenticated using (auth.uid() = user_id);
create policy "Users insert own files" on public.files
  for insert to authenticated with check (auth.uid() = user_id);
create policy "Users delete own files" on public.files
  for delete to authenticated using (auth.uid() = user_id);
create policy "Users update own files" on public.files
  for update to authenticated using (auth.uid() = user_id);

create index files_user_created_idx on public.files(user_id, created_at desc);

-- Private storage bucket
insert into storage.buckets (id, name, public) values ('vault', 'vault', false);

-- Storage RLS: users can only access their own folder (path starts with their uid)
create policy "Vault read own" on storage.objects
  for select to authenticated
  using (bucket_id = 'vault' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Vault upload own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'vault' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Vault delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'vault' and auth.uid()::text = (storage.foldername(name))[1]);
