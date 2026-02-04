import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️  Supabase credentials not configured. Using demo mode.');
}

// Service role client for server-side operations
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Check if Supabase is configured
export const isSupabaseConfigured = () => Boolean(supabaseUrl && supabaseServiceKey);

// Types for database
export interface DbProfile {
  id: string;
  email: string;
  name?: string;
  company?: string;
  plan: 'free' | 'pro' | 'enterprise';
  created_at: string;
  updated_at: string;
}

export interface DbApiKey {
  id: string;
  user_id: string;
  name: string;
  key_hash: string;
  key_prefix: string;
  last_used_at?: string;
  rate_limit: number;
  is_active: boolean;
  created_at: string;
}

export interface DbPermission {
  id: string;
  api_key_id: string;
  user_address: string;
  delegation?: string;
  session_account?: string;
  session_key_encrypted?: string;
  chains: number[];
  constraints: Record<string, unknown>;
  expires_at: string;
  revoked_at?: string;
  created_at: string;
  tx_count: number;
  total_spent: Record<string, string>;
}

export interface DbTransaction {
  id: string;
  permission_id: string;
  hash?: string;
  chain_id: number;
  to_address: string;
  value: string;
  data?: string;
  status: 'pending' | 'confirmed' | 'failed';
  gas_used?: string;
  error?: string;
  created_at: string;
  confirmed_at?: string;
}

export interface DbPermissionRequest {
  id: string;
  api_key_id: string;
  constraints: Record<string, unknown>;
  chains: number[];
  callback_url?: string;
  deep_link?: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  expires_at: string;
  created_at: string;
}
