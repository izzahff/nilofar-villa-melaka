# Nilofar Villa Melaka

Laman web dan sistem tempahan untuk Nilofar Villa Melaka, banglo 5 bilik dengan kolam peribadi di Bemban, Jasin.

Sistem ini ada dua bahagian.

- **Laman pelanggan** dengan motion, galeri, kalendar kekosongan, anggaran harga, borang semakan yang terus ke WhatsApp, borang pendaftaran penuh dan tour 360°.
- **Admin gaya CRM** dengan dashboard, kalendar, kanban tempahan, bayaran dan resit PDF, perjanjian untuk tempahan khas, dokumen, galeri, tour 360°, laporan, tetapan dan log aktiviti.

Kos operasi kekal RM0. Hosting di Cloudflare Pages, data di Supabase (free tier), gambar awam di Cloudflare R2 dan fail peribadi di Supabase Storage.

## Cuba sekarang (mod demo)

`npm run dev` berjalan dalam mod demo (data disimpan dalam pelayar). `npm run build` menghasilkan versi produksi yang bersambung ke Supabase.

```bash
npm install
npm run dev
```

Buka http://localhost:5173 untuk laman pelanggan dan http://localhost:5173/admin untuk admin. Emel demo `admin@nilofar.demo`, kata laluan `nilofar123`.

Setiap kali kod ditolak ke `main`, GitHub Actions menerbitkan mod demo ke GitHub Pages (`vite build --mode demo`). Hidupkan sekali di **Settings > Pages > Source > GitHub Actions**.

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

## Produksi

Yang sudah siap:

- Projek Supabase `nilofar-villa-melaka` (Singapore), ref `lwlfaweqcyutsxfainfy`. Schema, RLS, storan peribadi, tetapan asal, cuti dan 6 tempahan sedia ada sudah dimasukkan. Edge Function `submit-enquiry` sudah aktif.
- Bucket R2 `nilofar-images` untuk gambar galeri dan tour 360.
- `.env.production` dan `wrangler.toml` sudah mengandungi nilai awam Supabase dan binding R2, jadi Cloudflare Pages tidak perlu tetapan tambahan.

### Sambung Cloudflare Pages (sekali sahaja)

1. Cloudflare Dashboard > Workers & Pages > Create > Pages > Connect to Git.
2. Pilih repo `nilofar-villa-melaka`, framework preset **None**.
3. Build command `npm run build`, output directory `dist`.
4. Save and Deploy. Laman akan hidup di `https://nilofar-villa-melaka.pages.dev`.

### Akaun admin

1. Supabase > Authentication > Users > Add user, isi emel dan kata laluan (tick Auto Confirm).
2. SQL Editor:

   ```sql
   insert into public.admins (user_id, display_name)
   select id, 'En. Elyes' from auth.users where email = 'emel@contoh.com';
   ```

### Pilihan

- Turnstile anti-spam. Cipta widget di Cloudflare, letak site key sebagai `VITE_TURNSTILE_SITE_KEY` dalam `.env.production`, dan `npx supabase secrets set TURNSTILE_SECRET=...`.
- GitHub Secrets `SUPABASE_URL`, `SUPABASE_ANON_KEY` dan `SUPABASE_DB_URL` untuk keep-alive dan backup mingguan. GitHub menghentikan jadual selepas 60 hari tanpa aktiviti repo; tekan **Enable** di tab Actions jika berlaku.

### Projek Supabase baru (jika perlu bermula semula)

Jalankan fail dalam `supabase/migrations` mengikut turutan, kemudian `supabase/seed.sql`, dan `npx supabase functions deploy submit-enquiry --no-verify-jwt`. Kemas kini nilai dalam `.env.production` dan `wrangler.toml`.

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
