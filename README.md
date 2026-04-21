# dusun-jamus-web

## Admin dashboard (internal)

Halaman admin ada di `pages/admin.html` dan memakai Supabase Auth + RLS admin untuk mengelola:

- Landing (tabel `hero_slides`: `title`, `image_url`)
- Galeri Desa (tabel `gallery_items`: `title`, `image_url`)
- Produk UMKM (tabel `potential_items` dengan `type = 'umkm'`)
- Detail UMKM (tabel `potential_items`: `title`, `image_url`, `full_description`)

### Setup singkat

- Pastikan `SUPABASE_URL` dan `SUPABASE_ANON_KEY` terisi di konfigurasi (lihat `js/config.js`).
- Buat policy RLS agar hanya user di tabel `admin_users` dengan `is_active = true` yang bisa menulis.
- Login admin melalui halaman admin untuk melakukan CRUD sederhana.