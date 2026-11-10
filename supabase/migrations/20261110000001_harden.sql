-- Trigger functions are never called directly. Remove them from the RPC API.
revoke execute on function public.audit_row() from public, anon, authenticated;
revoke execute on function public.sync_booking_status() from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;
revoke execute on function public.check_booking_vs_blocks() from public, anon, authenticated;
revoke execute on function public.check_block_vs_bookings() from public, anon, authenticated;
