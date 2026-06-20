-- Add documents JSON column to drivers (omitted from Phase 2 schema)
alter table public.drivers
  add column if not exists documents jsonb;
