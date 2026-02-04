import { supabase, isSupabaseConfigured, type DbApiKey } from './supabase.js';

/**
 * Generate a new API key using Web Crypto API (Edge compatible)
 * Format: wp_[32 random chars]
 */
export function generateApiKey(): string {
  const array = new Uint8Array(24);
  crypto.getRandomValues(array);
  const random = btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  return `wp_${random}`;
}

/**
 * Hash an API key for storage using Web Crypto API
 */
export async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Get the prefix of an API key for display
 */
export function getKeyPrefix(key: string): string {
  return key.substring(0, 11) + '...'; // wp_abc1234...
}

/**
 * Validate an API key and return its data
 */
export async function validateApiKey(key: string): Promise<DbApiKey | null> {
  if (!key.startsWith('wp_')) {
    return null;
  }

  // Demo mode when Supabase isn't configured
  if (!isSupabaseConfigured()) {
    if (key === 'wp_demo_key_12345') {
      return {
        id: 'demo',
        user_id: 'demo-user',
        name: 'Demo Key',
        key_hash: await hashApiKey(key),
        key_prefix: 'wp_demo_ke...',
        rate_limit: 100,
        is_active: true,
        created_at: new Date().toISOString(),
      };
    }
    return null;
  }

  const keyHash = await hashApiKey(key);

  const { data, error } = await supabase
    .from('api_keys')
    .select('*')
    .eq('key_hash', keyHash)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return null;
  }

  // Update last_used_at
  await supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id);

  return data;
}

/**
 * Create a new API key for a user
 */
export async function createApiKey(
  userId: string,
  name: string
): Promise<{ key: string; data: DbApiKey } | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const key = generateApiKey();
  const keyHash = await hashApiKey(key);
  const keyPrefix = getKeyPrefix(key);

  const { data, error } = await supabase
    .from('api_keys')
    .insert({
      user_id: userId,
      name,
      key_hash: keyHash,
      key_prefix: keyPrefix,
    })
    .select()
    .single();

  if (error || !data) {
    console.error('Failed to create API key:', error);
    return null;
  }

  // Return the actual key only once (we don't store it)
  return { key, data };
}

/**
 * List API keys for a user
 */
export async function listApiKeys(userId: string): Promise<DbApiKey[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const { data, error } = await supabase
    .from('api_keys')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to list API keys:', error);
    return [];
  }

  return data || [];
}

/**
 * Revoke an API key
 */
export async function revokeApiKey(keyId: string, userId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }

  const { error } = await supabase
    .from('api_keys')
    .update({ is_active: false })
    .eq('id', keyId)
    .eq('user_id', userId);

  return !error;
}

/**
 * Delete an API key
 */
export async function deleteApiKey(keyId: string, userId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }

  const { error } = await supabase
    .from('api_keys')
    .delete()
    .eq('id', keyId)
    .eq('user_id', userId);

  return !error;
}
