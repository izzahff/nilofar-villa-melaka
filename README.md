# Nilofar Villa Melaka

Laman web dan sistem tempahan untuk Nilofar Villa Melaka, banglo 5 bilik dengan kolam peribadi di Bemban, Jasin.

Sistem ini ada dua bahagian.

- **Laman pelanggan** dengan motion, galeri, kalendar kekosongan, anggaran harga, borang semakan yang terus ke WhatsApp, borang pendaftaran penuh dan tour 360°.
- **Admin gaya CRM** dengan dashboard, kalendar, kanban tempahan, bayaran dan resit PDF, perjanjian untuk tempahan khas, dokumen, galeri, tour 360°, laporan, tetapan dan log aktiviti.

Kos operasi kekal RM0. Hosting di Cloudflare Pages, data di Supabase (free tier), gambar awam di Cloudflare R2 dan fail peribadi di Supabase Storage.

## Cuba sekarang (mod demo)

Tanpa sebarang akaun, sistem berjalan dalam mod demo dan semua data disimpan dalam pelayar.

```bash
npm install
npm run dev
```

Buka http://localhost:5173 untuk laman pelanggan dan http://localhost:5173/admin untuk admin. Emel demo `admin@nilofar.demo`, kata laluan `nilofar123`.

Setiap kali kod ditolak ke `main`, GitHub Actions menerbitkan mod demo ke GitHub Pages. Hidupkan sekali di **Settings > Pages > Source > GitHub Actions**.

## Struktur

```
src/
  pages/public     laman pelanggan (Home, Booking, Registration, Tour)
  pages/admin      admin CRM
  components       UI kongsi, kalendar, penonton 360
  lib/api          pemacu data Supabase dan demo
  lib/pricing.ts   peraturan harga, minimum malam dan kekosongan
  lib/pdf.ts       resit dan perjanjian PDF
supabase/
  migrations       schema, RLS, fungsi awam, storan
  functions        Edge Function submit-enquiry (Turnstile)
  seed.sql         tetapan asal, cuti dan tempahan sedia ada
functions/         Cloudflare Pages Functions untuk muat naik R2
openspec/          spesifikasi dan rekod perubahan (OpenSpec)
```

## Pasang untuk produksi

### 1. Supabase

1. Daftar di https://supabase.com dan cipta projek baru (rantau Singapore).
2. Buka **SQL Editor** dan jalankan fail dalam `supabase/migrations` mengikut turutan, kemudian `supabase/seed.sql`.
3. Buka **Authentication > Users**, tambah pengguna untuk En. Elyes dan Pn. Yati.
4. Daftarkan mereka sebagai admin.

   ```sql
   insert into public.admins (user_id, display_name)
   select id, 'En. Elyes' from auth.users where email = 'emel-elyes@contoh.com';
   ```

5. Pasang Edge Function.

   ```bash
   npx supabase login
   npx supabase link --project-ref <ref-projek>
   npx supabase functions deploy submit-enquiry --no-verify-jwt
   npx supabase secrets set TURNSTILE_SECRET=<kunci-rahsia-turnstile>
   ```

### 2. Cloudflare

1. Cipta bucket R2 bernama `nilofar-images` (Dashboard > R2).
2. **Workers & Pages > Create > Pages > Connect to Git**, pilih repo ini.
   - Build command `npm run build`
   - Output directory `dist`
3. Dalam **Settings > Variables**, isi pemboleh ubah di bawah.

| Nama | Nilai |
| --- | --- |
| `VITE_SUPABASE_URL` | URL projek Supabase |
| `VITE_SUPABASE_ANON_KEY` | anon key Supabase |
| `VITE_TURNSTILE_SITE_KEY` | site key Turnstile (pilihan) |
| `VITE_SITE_URL` | domain laman, contoh `https://nilofarvilla.pages.dev` |
| `SUPABASE_URL` | sama seperti di atas, untuk fungsi muat naik |
| `SUPABASE_ANON_KEY` | sama seperti di atas |

4. Dalam **Settings > Bindings**, tambah R2 binding bernama `IMAGES` ke bucket `nilofar-images`.
5. Pilihan. Cipta widget Turnstile di Dashboard > Turnstile untuk anti-spam borang.

### 3. GitHub Secrets

Tambah di **Settings > Secrets and variables > Actions**.

- `SUPABASE_URL` dan `SUPABASE_ANON_KEY` untuk ping dua kali seminggu supaya projek Supabase tidak pause.
- `SUPABASE_DB_URL` (Supabase > Project Settings > Database > Connection string) untuk backup mingguan.

GitHub menghentikan jadual workflow selepas 60 hari tanpa aktiviti repo. Buka tab Actions dan tekan **Enable** jika ini berlaku.

## Peraturan harga

- Harga hujung minggu dikenakan jika check in hari Jumaat atau Sabtu, atau mana-mana malam jatuh pada tarikh cuti dalam tetapan.
- 1 malam guna harga 2H1M, 2 malam guna 3H2M, malam seterusnya tambah kadar malam tambahan.
- Hujung minggu minimum 2 malam kecuali tempahan dalam 3 hari dari hari ini.
- Deposit keselamatan berasingan daripada sewa dan dipulangkan selepas check out.

Semua nilai boleh diubah di **Admin > Tetapan**.

## Aliran tempahan

1. Pelanggan pilih tarikh, isi borang ringkas, setuju peraturan dan tekan **Hantar ke WhatsApp**. Sistem rekod tempahan berstatus Semakan.
2. Admin sahkan di WhatsApp, tukar status ke Pending dan hantar templat **Pautan borang**.
3. Pelanggan isi borang pendaftaran penuh dan muat naik resit deposit.
4. Admin rekod deposit dan bayaran sewa. Status berubah automatik dan resit PDF dijana.
5. Selepas check out, admin pulangkan deposit atau rekod potongan kerosakan.

## OpenSpec

Projek ini menggunakan OpenSpec untuk setiap perubahan. Spesifikasi semasa ada dalam `openspec/specs`, sejarah perubahan dalam `openspec/changes/archive`.

```bash
npx openspec list --specs     # senarai keupayaan
npx openspec validate --all   # semak spesifikasi
```

Untuk ciri baru, mula dengan `/opsx:propose` dalam Claude Code atau GitHub Copilot, kemudian `/opsx:apply` dan `/opsx:archive`.

## Arahan berguna

```bash
npm run build       # semak jenis dan bina
npm run gen:seed    # jana semula supabase/seed.sql daripada src/lib/defaults.ts
```
