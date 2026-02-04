-- WalletPilot Platform Schema
-- Run this in Supabase SQL editor

-- Enable extensions
create extension if not exists "uuid-ossp";

-- ============================================================================
-- Users Table (extends Supabase auth.users)
-- ============================================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  company text,
  plan text default 'free' check (plan in ('free', 'pro', 'enterprise')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================================
-- API Keys Table
-- ============================================================================

create table if not exists public.api_keys (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  key_hash text not null unique, -- We store hash, not the actual key
  key_prefix text not null, -- First 8 chars for display (wp_abc123...)
  last_used_at timestamptz,
  rate_limit integer default 1000,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- ============================================================================
-- Permissions Table
-- ============================================================================

create table if not exists public.permissions (
  id uuid primary key default uuid_generate_v4(),
  api_key_id uuid not null references public.api_keys(id) on delete cascade,
  user_address text not null, -- Wallet address that granted permission
  delegation text, -- ERC-7715 delegation data
  session_account text, -- Session account address
  session_key_encrypted text, -- Encrypted session key
  chains integer[] not null default '{1}',
  constraints jsonb not null default '{}',
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz default now(),
  
  -- Usage tracking
  tx_count integer default 0,
  total_spent jsonb default '{}' -- { "USDC": "100.50", "ETH": "0.1" }
);

-- ============================================================================
-- Transactions Table
-- ============================================================================

create table if not exists public.transactions (
  id uuid primary key default uuid_generate_v4(),
  permission_id uuid not null references public.permissions(id) on delete cascade,
  hash text unique,
  chain_id integer not null,
  to_address text not null,
  value text default '0',
  data text,
  status text default 'pending' check (status in ('pending', 'confirmed', 'failed')),
  gas_used text,
  error text,
  created_at timestamptz default now(),
  confirmed_at timestamptz
);

-- ============================================================================
-- Permission Requests (pending approvals)
-- ============================================================================

create table if not exists public.permission_requests (
  id uuid primary key default uuid_generate_v4(),
  api_key_id uuid not null references public.api_keys(id) on delete cascade,
  constraints jsonb not null,
  chains integer[] not null default '{1}',
  callback_url text,
  deep_link text,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected', 'expired')),
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

-- ============================================================================
-- Indexes
-- ============================================================================

create index if not exists idx_api_keys_user_id on public.api_keys(user_id);
create index if not exists idx_api_keys_key_hash on public.api_keys(key_hash);
create index if not exists idx_permissions_api_key_id on public.permissions(api_key_id);
create index if not exists idx_permissions_user_address on public.permissions(user_address);
create index if not exists idx_transactions_permission_id on public.transactions(permission_id);
create index if not exists idx_transactions_hash on public.transactions(hash);
create index if not exists idx_permission_requests_api_key_id on public.permission_requests(api_key_id);

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.api_keys enable row level security;
alter table public.permissions enable row level security;
alter table public.transactions enable row level security;
alter table public.permission_requests enable row level security;

-- Profiles: users can only see/edit their own
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
  
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- API Keys: users can only see/manage their own
create policy "Users can view own api keys" on public.api_keys
  for select using (user_id = auth.uid());
  
create policy "Users can insert own api keys" on public.api_keys
  for insert with check (user_id = auth.uid());
  
create policy "Users can update own api keys" on public.api_keys
  for update using (user_id = auth.uid());
  
create policy "Users can delete own api keys" on public.api_keys
  for delete using (user_id = auth.uid());

-- Permissions: users can see permissions for their API keys
create policy "Users can view permissions for own api keys" on public.permissions
  for select using (
    api_key_id in (select id from public.api_keys where user_id = auth.uid())
  );

-- Service role can do everything (for API server)
create policy "Service role full access to api_keys" on public.api_keys
  for all using (auth.role() = 'service_role');
  
create policy "Service role full access to permissions" on public.permissions
  for all using (auth.role() = 'service_role');
  
create policy "Service role full access to transactions" on public.transactions
  for all using (auth.role() = 'service_role');
  
create policy "Service role full access to permission_requests" on public.permission_requests
  for all using (auth.role() = 'service_role');

-- ============================================================================
-- Functions
-- ============================================================================

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Update timestamp function
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger for profiles
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at();
