import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { createHash, randomBytes } from 'crypto';

// Supabase setup
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const isConfigured = () => Boolean(supabaseUrl && supabaseServiceKey);

// API Key utilities
function generateApiKey(): string {
  return 'wp_' + randomBytes(24).toString('base64url');
}

function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Refresh-Token',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      .setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Refresh-Token')
      .end();
  }

  // Set CORS headers for all responses
  Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));

  const path = req.url?.replace(/\?.*/, '') || '/';

  try {
    // Health check
    if (path === '/' || path === '/api') {
      return res.json({ name: 'WalletPilot API', version: '0.1.0', status: 'healthy' });
    }

    if (path === '/health' || path === '/api/health') {
      return res.json({ status: 'ok' });
    }

    // Auth routes
    if (path === '/v1/auth/login' || path === '/api/v1/auth/login') {
      if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });
      if (!isConfigured()) return res.status(503).json({ success: false, error: 'Auth not configured' });

      const { email, password } = req.body;
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) return res.status(401).json({ success: false, error: 'Invalid credentials' });
      
      return res.json({
        success: true,
        data: {
          accessToken: data.session?.access_token,
          refreshToken: data.session?.refresh_token,
          user: { id: data.user?.id, email: data.user?.email },
        },
      });
    }

    if (path === '/v1/auth/signup' || path === '/api/v1/auth/signup') {
      if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });
      if (!isConfigured()) return res.status(503).json({ success: false, error: 'Auth not configured' });

      const { email, password, name } = req.body;
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email, password, email_confirm: true,
      });

      if (authError) return res.status(400).json({ success: false, error: authError.message });

      if (authData.user && name) {
        await supabase.from('profiles').update({ name }).eq('id', authData.user.id);
      }

      // Create default API key
      let apiKey = null;
      if (authData.user) {
        const key = generateApiKey();
        const keyHash = hashKey(key);
        const { data: keyData } = await supabase.from('api_keys').insert({
          user_id: authData.user.id,
          name: 'Default Key',
          key_hash: keyHash,
          key_prefix: key.slice(0, 10) + '...',
        }).select().single();
        if (keyData) apiKey = key;
      }

      return res.json({
        success: true,
        data: { user: { id: authData.user?.id, email: authData.user?.email }, apiKey },
      });
    }

    if (path === '/v1/auth/me' || path === '/api/v1/auth/me') {
      if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' });
      if (!isConfigured()) return res.status(503).json({ success: false, error: 'Auth not configured' });

      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'Missing token' });
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) return res.status(401).json({ success: false, error: 'Invalid token' });

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      const { data: apiKeys } = await supabase.from('api_keys').select('*').eq('user_id', user.id).eq('is_active', true);

      return res.json({
        success: true,
        data: {
          user: { id: user.id, email: user.email, name: profile?.name, plan: profile?.plan || 'free' },
          apiKeys: (apiKeys || []).map((k: any) => ({
            id: k.id, name: k.name, prefix: k.key_prefix, createdAt: k.created_at,
          })),
        },
      });
    }

    if (path === '/v1/auth/keys' || path === '/api/v1/auth/keys') {
      if (!isConfigured()) return res.status(503).json({ success: false, error: 'Auth not configured' });

      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'Missing token' });
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) return res.status(401).json({ success: false, error: 'Invalid token' });

      if (req.method === 'POST') {
        const { name } = req.body;
        if (!name) return res.status(400).json({ success: false, error: 'Name required' });

        console.log('Creating key for user:', user.id, 'name:', name);
        
        const key = generateApiKey();
        const keyHash = hashKey(key);
        
        console.log('Key generated, inserting into DB...');
        
        const { data: keyData, error: keyError } = await supabase.from('api_keys').insert({
          user_id: user.id,
          name,
          key_hash: keyHash,
          key_prefix: key.slice(0, 10) + '...',
        }).select().single();

        if (keyError) {
          console.error('Key creation error:', keyError);
          return res.status(500).json({ success: false, error: keyError.message || 'Failed to create key', details: keyError });
        }

        console.log('Key created:', keyData?.id);

        return res.json({
          success: true,
          data: { id: keyData.id, name: keyData.name, key, prefix: keyData.key_prefix },
        });
      }

      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    // Delete key
    if (path.startsWith('/v1/auth/keys/') || path.startsWith('/api/v1/auth/keys/')) {
      if (req.method !== 'DELETE') return res.status(405).json({ success: false, error: 'Method not allowed' });
      if (!isConfigured()) return res.status(503).json({ success: false, error: 'Auth not configured' });

      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'Missing token' });
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) return res.status(401).json({ success: false, error: 'Invalid token' });

      const keyId = path.split('/').pop();
      const { error: deleteError } = await supabase.from('api_keys').delete().eq('id', keyId).eq('user_id', user.id);

      if (deleteError) return res.status(404).json({ success: false, error: 'Key not found' });

      return res.json({ success: true });
    }

    return res.status(404).json({ success: false, error: 'Not found' });
  } catch (err: any) {
    console.error('API Error:', err);
    return res.status(500).json({ 
      success: false, 
      error: err?.message || 'Internal server error',
      stack: process.env.NODE_ENV === 'development' ? err?.stack : undefined
    });
  }
}
