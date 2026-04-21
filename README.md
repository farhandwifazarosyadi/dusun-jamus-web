# dusun-jamus-web

## Admin dashboard (internal)

Halaman admin ada di `pages/admin.html` dan memakai Supabase Auth + RLS admin untuk CRUD konten.

### Setup singkat

- Pastikan `SUPABASE_URL` dan `SUPABASE_ANON_KEY` terisi di konfigurasi (lihat `js/config.js`).
- Buat policy RLS agar hanya user di tabel `admin_users` dengan `is_active = true` yang bisa menulis.
- Login admin melalui halaman admin, lalu kelola data hero, profil, berita, galeri, potensi, kontak, dan social links.