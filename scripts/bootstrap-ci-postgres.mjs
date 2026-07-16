/**
 * Bootstrap minimal auth/storage stubs so GestorPro migrations can run on
 * an empty disposable Postgres (CI fresh mode) without full Supabase stack.
 */
import { existsSync, readFileSync } from "node:fs";
import postgres from "postgres";

function loadEnvFile() {
  for (const file of [".env.local", ".env"]) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const separator = trimmed.indexOf("=");
      if (separator === -1) continue;
      const key = trimmed.slice(0, separator).trim();
      if (!process.env[key]) process.env[key] = trimmed.slice(separator + 1).trim();
    }
  }
}

loadEnvFile();

const sslMode = (process.env.PGSSLMODE ?? "").toLowerCase();
const useSsl =
  process.env.PGSSL === "1" ||
  sslMode === "require" ||
  (!sslMode && process.env.PGHOST && !["127.0.0.1", "localhost"].includes(process.env.PGHOST));

const sql = postgres({
  database: process.env.PGDATABASE,
  host: process.env.PGHOST,
  idle_timeout: 2,
  max: 1,
  onnotice: () => {},
  password: process.env.PGPASSWORD,
  port: Number(process.env.PGPORT ?? 5432),
  ssl: useSsl ? "require" : false,
  user: process.env.PGUSER,
});

await sql.unsafe(`
create extension if not exists pgcrypto;

create schema if not exists auth;
create schema if not exists extensions;
create schema if not exists storage;

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text,
  created_at timestamptz not null default now()
);

create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

create or replace function auth.role()
returns text
language sql
stable
as $$
  select coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), 'authenticated');
$$;

create or replace function auth.jwt()
returns jsonb
language sql
stable
as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb;
$$;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin bypassrls;
  end if;
end $$;

create table if not exists storage.buckets (
  id text primary key,
  name text not null,
  public boolean not null default false,
  file_size_limit bigint,
  allowed_mime_types text[]
);

create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets(id),
  name text,
  owner uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  last_accessed_at timestamptz,
  metadata jsonb
);

create or replace function extensions.digest(bytea, text)
returns bytea
language sql
immutable
as $$
  select public.digest($1, $2);
$$;

create or replace function extensions.digest(text, text)
returns bytea
language sql
immutable
as $$
  select public.digest($1, $2);
$$;
`);

console.log("CI Postgres bootstrap complete (auth/storage stubs).");
await sql.end({ timeout: 5 });
