# dusun-jamus-web

## Admin dashboard (internal)

Halaman admin ada di `pages/admin.html` dan memakai Supabase Auth + RLS admin untuk mengelola:

- Landing (tabel `hero_slides`: `title`, `image_url`)
- Galeri Desa (tabel `gallery_items`: `title`, `image_url`)
- Produk UMKM (tabel `potential_items` dengan `type = 'umkm'`)
- Detail UMKM (tabel `potential_items`: `title`, `image_url`, `full_description`)

### Setup singkat

- Pastikan `SUPABASE_URL` dan `SUPABASE_ANON_KEY` terisi di konfigurasi (lihat `js/config.js`).
- Peta menggunakan Leaflet.js dengan tile OpenStreetMap.
- Foursquare Places API dipakai untuk data tempat/POI di sekitar lokasi (bukan untuk tile map).
- OpenWeather API dipakai untuk data cuaca.
- Isi `OPENWEATHER_API_KEY` dan `FOURSQUARE_API_KEY` di `.env` atau `window.__ENV` sebelum `js/config.js`.
- Buat policy RLS agar hanya user di tabel `admin_users` dengan `is_active = true` yang bisa menulis.
- Login admin melalui halaman admin untuk melakukan CRUD sederhana.

## SQL Supabase untuk admin content

Tempel blok SQL ini di Supabase SQL Editor. Ini membuka hak tulis untuk admin aktif pada tiga tabel yang dipakai halaman admin dan halaman publik: `site_profiles`, `site_contacts`, dan `site_social_links`.

```sql
create or replace function public.is_admin_active()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
	select exists (
		select 1
		from public.admin_users au
		where au.user_id = auth.uid()
			and au.is_active = true
	);
$$;

revoke all on function public.is_admin_active() from public;
grant execute on function public.is_admin_active() to authenticated;

alter table public.site_profiles enable row level security;
alter table public.site_contacts enable row level security;
alter table public.site_social_links enable row level security;

drop policy if exists "site_profiles_admin_insert" on public.site_profiles;
drop policy if exists "site_profiles_admin_update" on public.site_profiles;
drop policy if exists "site_profiles_admin_delete" on public.site_profiles;

create policy "site_profiles_admin_insert"
on public.site_profiles
for insert
to authenticated
with check (public.is_admin_active());

create policy "site_profiles_admin_update"
on public.site_profiles
for update
to authenticated
using (public.is_admin_active())
with check (public.is_admin_active());

create policy "site_profiles_admin_delete"
on public.site_profiles
for delete
to authenticated
using (public.is_admin_active());

drop policy if exists "site_contacts_admin_insert" on public.site_contacts;
drop policy if exists "site_contacts_admin_update" on public.site_contacts;
drop policy if exists "site_contacts_admin_delete" on public.site_contacts;

create policy "site_contacts_admin_insert"
on public.site_contacts
for insert
to authenticated
with check (public.is_admin_active());

create policy "site_contacts_admin_update"
on public.site_contacts
for update
to authenticated
using (public.is_admin_active())
with check (public.is_admin_active());

create policy "site_contacts_admin_delete"
on public.site_contacts
for delete
to authenticated
using (public.is_admin_active());

drop policy if exists "site_social_links_admin_insert" on public.site_social_links;
drop policy if exists "site_social_links_admin_update" on public.site_social_links;
drop policy if exists "site_social_links_admin_delete" on public.site_social_links;

create policy "site_social_links_admin_insert"
on public.site_social_links
for insert
to authenticated
with check (public.is_admin_active());

create policy "site_social_links_admin_update"
on public.site_social_links
for update
to authenticated
using (public.is_admin_active())
with check (public.is_admin_active());

create policy "site_social_links_admin_delete"
on public.site_social_links
for delete
to authenticated
using (public.is_admin_active());
```