-- Nilofar Villa Melaka, core schema
-- Run in the Supabase SQL editor (or `supabase db push`).

create extension if not exists btree_gist;

-- ---------------------------------------------------------------
-- Admins
-- ---------------------------------------------------------------
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ---------------------------------------------------------------
-- Settings (key/value, some public)
-- ---------------------------------------------------------------
create table public.settings (
  key text primary key,
  value jsonb not null,
  is_public boolean not null default true,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- Holidays (weekend rate)
-- ---------------------------------------------------------------
create table public.holidays (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  name text not null,
  kind text not null default 'public' check (kind in ('public', 'school', 'other'))
);

-- ---------------------------------------------------------------
-- Bookings
-- ---------------------------------------------------------------
create type public.booking_status as enum (
  'enquiry', 'pending', 'deposit_paid', 'fully_paid', 'checked_in', 'completed', 'cancelled'
);
create type public.booking_type as enum ('standard', 'event', 'special');

create sequence public.booking_ref_seq;

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique default (
    'NV-' || to_char(now() at time zone 'Asia/Kuala_Lumpur', 'YYMM') || '-' ||
    lpad(nextval('public.booking_ref_seq')::text, 4, '0')
  ),
  guest_name text not null check (char_length(guest_name) between 2 and 120),
  phone text check (phone is null or char_length(phone) between 7 and 20),
  origin text check (origin is null or char_length(origin) <= 120),
  address text check (address is null or char_length(address) <= 400),
  adults int not null default 1 check (adults between 0 and 60),
  children int not null default 0 check (children between 0 and 60),
  check_in date not null,
  check_out date not null,
  nights int generated always as (check_out - check_in) stored,
  booking_type public.booking_type not null default 'standard',
  status public.booking_status not null default 'pending',
  source text check (source is null or char_length(source) <= 60),
  remarks text check (remarks is null or char_length(remarks) <= 1000),
  notes text,
  total_price numeric(10, 2) not null default 0 check (total_price >= 0),
  deposit_amount numeric(10, 2) not null default 300 check (deposit_amount >= 0),
  organization text,
  external_ref text,
  form_token uuid not null unique default gen_random_uuid(),
  registered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookings_dates check (check_out > check_in),
  constraint bookings_no_overlap exclude using gist (
    daterange(check_in, check_out, '[)') with &&
  ) where (status in ('pending', 'deposit_paid', 'fully_paid', 'checked_in', 'completed'))
);

create index bookings_check_in_idx on public.bookings (check_in);
create index bookings_status_idx on public.bookings (status);

-- ---------------------------------------------------------------
-- Blocked dates
-- ---------------------------------------------------------------
create table public.blocked_dates (
  id uuid primary key default gen_random_uuid(),
  start_date date not null,
  end_date date not null,
  reason text not null default 'Tutup',
  created_at timestamptz not null default now(),
  constraint blocked_dates_range check (end_date > start_date),
  constraint blocked_no_overlap exclude using gist (daterange(start_date, end_date, '[)') with &&)
);

-- ---------------------------------------------------------------
-- Payments and receipts
-- ---------------------------------------------------------------
create type public.payment_type as enum (
  'deposit', 'rental', 'late_checkout', 'deposit_refund', 'deposit_deduction'
);

create sequence public.receipt_seq;

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  type public.payment_type not null,
  amount numeric(10, 2) not null check (amount > 0),
  method text not null default 'Pindahan bank',
  paid_at timestamptz not null default now(),
  reference text,
  notes text,
  receipt_no text not null unique default (
    'R-' || to_char(now() at time zone 'Asia/Kuala_Lumpur', 'YYYY') || '-' ||
    lpad(nextval('public.receipt_seq')::text, 4, '0')
  ),
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);

create index payments_booking_idx on public.payments (booking_id);

-- ---------------------------------------------------------------
-- Agreements for special bookings
-- ---------------------------------------------------------------
create table public.agreements (
  booking_id uuid primary key references public.bookings (id) on delete cascade,
  party_name text not null,
  representative text,
  position text,
  contact text,
  external_ref text,
  agreed_total numeric(10, 2) not null default 0,
  schedule jsonb not null default '[]'::jsonb,
  terms text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- Private documents
-- ---------------------------------------------------------------
create type public.doc_kind as enum (
  'deposit_slip', 'payment_slip', 'signed_agreement', 'local_order', 'other'
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  kind public.doc_kind not null default 'other',
  path text not null unique,
  file_name text not null,
  uploaded_by text not null default 'admin',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- Media (public gallery, files in R2) and tour scenes
-- ---------------------------------------------------------------
create table public.media (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  r2_key text,
  caption text,
  category text not null default 'lain'
    check (category in ('luar', 'ruang-tamu', 'dapur', 'bilik', 'kolam', 'lain')),
  sort int not null default 0,
  visible boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.tour_scenes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  image_url text not null,
  r2_key text,
  sort int not null default 0,
  initial_yaw numeric not null default 0,
  hotspots jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- Audit log
-- ---------------------------------------------------------------
create table public.audit_log (
  id bigserial primary key,
  table_name text not null,
  record_id text,
  action text not null,
  old_data jsonb,
  new_data jsonb,
  actor uuid default auth.uid(),
  at timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger bookings_touch before update on public.bookings
  for each row execute function public.touch_updated_at();
create trigger agreements_touch before update on public.agreements
  for each row execute function public.touch_updated_at();
create trigger settings_touch before update on public.settings
  for each row execute function public.touch_updated_at();

create or replace function public.audit_row()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  rid text;
begin
  if tg_op = 'DELETE' then
    rid := coalesce(to_jsonb(old) ->> 'id', to_jsonb(old) ->> 'key', to_jsonb(old) ->> 'booking_id');
    insert into public.audit_log (table_name, record_id, action, old_data)
      values (tg_table_name, rid, tg_op, to_jsonb(old));
    return old;
  end if;
  rid := coalesce(to_jsonb(new) ->> 'id', to_jsonb(new) ->> 'key', to_jsonb(new) ->> 'booking_id');
  insert into public.audit_log (table_name, record_id, action, old_data, new_data)
    values (tg_table_name, rid, tg_op,
            case when tg_op = 'UPDATE' then to_jsonb(old) end, to_jsonb(new));
  return new;
end;
$$;

create trigger bookings_audit after insert or update or delete on public.bookings
  for each row execute function public.audit_row();
create trigger payments_audit after insert or update or delete on public.payments
  for each row execute function public.audit_row();
create trigger blocked_audit after insert or update or delete on public.blocked_dates
  for each row execute function public.audit_row();
create trigger settings_audit after insert or update or delete on public.settings
  for each row execute function public.audit_row();
create trigger agreements_audit after insert or update or delete on public.agreements
  for each row execute function public.audit_row();

-- Bookings and blocks must not overlap each other
create or replace function public.check_booking_vs_blocks()
returns trigger language plpgsql as $$
begin
  if new.status in ('pending', 'deposit_paid', 'fully_paid', 'checked_in', 'completed') and exists (
    select 1 from public.blocked_dates b
    where daterange(b.start_date, b.end_date, '[)') && daterange(new.check_in, new.check_out, '[)')
  ) then
    raise exception 'Tarikh bertindih dengan tarikh yang diblok' using errcode = '23P01';
  end if;
  return new;
end;
$$;

create trigger bookings_vs_blocks before insert or update on public.bookings
  for each row execute function public.check_booking_vs_blocks();

create or replace function public.check_block_vs_bookings()
returns trigger language plpgsql as $$
begin
  if exists (
    select 1 from public.bookings k
    where k.status in ('pending', 'deposit_paid', 'fully_paid', 'checked_in', 'completed')
      and daterange(k.check_in, k.check_out, '[)') && daterange(new.start_date, new.end_date, '[)')
  ) then
    raise exception 'Tarikh bertindih dengan tempahan sedia ada' using errcode = '23P01';
  end if;
  return new;
end;
$$;

create trigger blocks_vs_bookings before insert or update on public.blocked_dates
  for each row execute function public.check_block_vs_bookings();

-- Status follows money
create or replace function public.sync_booking_status()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  b public.bookings;
  rent numeric;
  dep numeric;
begin
  select * into b from public.bookings where id = coalesce(new.booking_id, old.booking_id);
  if b is null or b.status in ('checked_in', 'completed', 'cancelled') then
    return coalesce(new, old);
  end if;
  select coalesce(sum(amount) filter (where type = 'rental'), 0),
         coalesce(sum(amount) filter (where type = 'deposit'), 0)
    into rent, dep
    from public.payments where booking_id = b.id;
  if b.total_price > 0 and rent >= b.total_price then
    update public.bookings set status = 'fully_paid' where id = b.id and status <> 'fully_paid';
  elsif dep > 0 and b.status in ('enquiry', 'pending') then
    update public.bookings set status = 'deposit_paid' where id = b.id;
  end if;
  return coalesce(new, old);
end;
$$;

create trigger payments_sync_status after insert or update or delete on public.payments
  for each row execute function public.sync_booking_status();

-- ---------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------
alter table public.admins enable row level security;
alter table public.settings enable row level security;
alter table public.holidays enable row level security;
alter table public.bookings enable row level security;
alter table public.blocked_dates enable row level security;
alter table public.payments enable row level security;
alter table public.agreements enable row level security;
alter table public.documents enable row level security;
alter table public.media enable row level security;
alter table public.tour_scenes enable row level security;
alter table public.audit_log enable row level security;

create policy admins_read on public.admins for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy settings_read on public.settings for select to anon, authenticated
  using (is_public or public.is_admin());
create policy settings_admin on public.settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy holidays_read on public.holidays for select to anon, authenticated using (true);
create policy holidays_admin on public.holidays for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy media_read on public.media for select to anon, authenticated
  using (visible or public.is_admin());
create policy media_admin on public.media for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy tour_read on public.tour_scenes for select to anon, authenticated using (true);
create policy tour_admin on public.tour_scenes for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy bookings_admin on public.bookings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy blocked_admin on public.blocked_dates for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy payments_admin on public.payments for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy agreements_admin on public.agreements for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy documents_admin on public.documents for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy audit_admin on public.audit_log for select to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------
-- Public functions (the only way guests touch booking data)
-- ---------------------------------------------------------------
create or replace function public.get_busy_ranges(p_from date, p_to date)
returns table (start_date date, end_date date)
language sql stable security definer set search_path = public as $$
  select check_in, check_out from public.bookings
   where status in ('pending', 'deposit_paid', 'fully_paid', 'checked_in', 'completed')
     and check_out > p_from and check_in < p_to
  union all
  select b.start_date, b.end_date from public.blocked_dates b
   where b.end_date > p_from and b.start_date < p_to
  order by 1;
$$;

create or replace function public.get_booking_form(p_token uuid)
returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'ref', ref, 'guest_name', guest_name, 'phone', phone, 'origin', origin,
    'address', address, 'adults', adults, 'children', children,
    'check_in', check_in, 'check_out', check_out, 'source', source,
    'remarks', remarks, 'registered_at', registered_at, 'deposit_amount', deposit_amount,
    'total_price', total_price
  )
  from public.bookings
  where form_token = p_token and status not in ('cancelled', 'completed');
$$;

create or replace function public.submit_registration(
  p_token uuid,
  p_guest_name text,
  p_address text,
  p_phone text,
  p_adults int,
  p_children int,
  p_source text,
  p_remarks text
) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_ref text;
begin
  if char_length(coalesce(p_guest_name, '')) < 2 or char_length(coalesce(p_phone, '')) < 7 then
    raise exception 'Nama dan nombor telefon diperlukan';
  end if;
  update public.bookings
     set guest_name = left(p_guest_name, 120),
         address = left(p_address, 400),
         phone = left(p_phone, 20),
         adults = greatest(0, least(p_adults, 60)),
         children = greatest(0, least(p_children, 60)),
         source = left(p_source, 60),
         remarks = left(p_remarks, 1000),
         registered_at = now()
   where form_token = p_token and status not in ('cancelled', 'completed')
  returning ref into v_ref;
  if v_ref is null then
    raise exception 'Pautan tidak sah';
  end if;
  return v_ref;
end;
$$;

create or replace function public.token_is_open(p_token text)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.bookings
     where form_token::text = p_token and status not in ('cancelled', 'completed')
  );
$$;

create or replace function public.register_slip(p_token uuid, p_path text, p_file_name text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
begin
  if p_path not like 'slips/' || p_token::text || '/%' then
    raise exception 'Laluan fail tidak sah';
  end if;
  select id into v_id from public.bookings
   where form_token = p_token and status not in ('cancelled', 'completed');
  if v_id is null then
    raise exception 'Pautan tidak sah';
  end if;
  insert into public.documents (booking_id, kind, path, file_name, uploaded_by)
  values (v_id, 'deposit_slip', p_path, left(p_file_name, 200), 'tetamu')
  on conflict (path) do nothing;
end;
$$;

revoke all on function public.get_busy_ranges(date, date) from public;
revoke all on function public.get_booking_form(uuid) from public;
revoke all on function public.submit_registration(uuid, text, text, text, int, int, text, text) from public;
revoke all on function public.token_is_open(text) from public;
revoke all on function public.register_slip(uuid, text, text) from public;
grant execute on function public.get_busy_ranges(date, date) to anon, authenticated;
grant execute on function public.get_booking_form(uuid) to anon, authenticated;
grant execute on function public.submit_registration(uuid, text, text, text, int, int, text, text) to anon, authenticated;
grant execute on function public.token_is_open(text) to anon, authenticated;
grant execute on function public.register_slip(uuid, text, text) to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;
