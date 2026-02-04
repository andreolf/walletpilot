import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { createApiKey, listApiKeys, deleteApiKey } from '../lib/apiKeys.js';

const app = new Hono();

// ============================================================================
// Schemas
// ============================================================================

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
  company: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const createKeySchema = z.object({
  name: z.string().min(1).max(100),
});

// ============================================================================
// Auth Routes
// ============================================================================

/**
 * POST /v1/auth/signup
 * Create a new account
 */
app.post('/signup', zValidator('json', signupSchema), async (c) => {
  if (!isSupabaseConfigured()) {
    return c.json({ success: false, error: 'Auth not configured' }, 503);
  }

  const { email, password, name, company } = c.req.valid('json');

  // Create user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm for now
  });

  if (authError) {
    return c.json({ 
      success: false, 
      error: authError.message 
    }, 400);
  }

  // Update profile with additional info
  if (authData.user && (name || company)) {
    await supabase
      .from('profiles')
      .update({ name, company })
      .eq('id', authData.user.id);
  }

  // Generate initial API key
  let apiKey = null;
  if (authData.user) {
    const keyResult = await createApiKey(authData.user.id, 'Default Key');
    if (keyResult) {
      apiKey = keyResult.key;
    }
  }

  return c.json({
    success: true,
    data: {
      user: {
        id: authData.user?.id,
        email: authData.user?.email,
      },
      apiKey, // Return the key only once!
      message: 'Account created. Save your API key - it won\'t be shown again.',
    },
  });
});

/**
 * POST /v1/auth/login
 * Sign in to get access token
 */
app.post('/login', zValidator('json', loginSchema), async (c) => {
  if (!isSupabaseConfigured()) {
    return c.json({ success: false, error: 'Auth not configured' }, 503);
  }

  const { email, password } = c.req.valid('json');

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return c.json({ 
      success: false, 
      error: 'Invalid email or password' 
    }, 401);
  }

  return c.json({
    success: true,
    data: {
      accessToken: data.session?.access_token,
      refreshToken: data.session?.refresh_token,
      expiresAt: data.session?.expires_at,
      user: {
        id: data.user?.id,
        email: data.user?.email,
      },
    },
  });
});

/**
 * POST /v1/auth/refresh
 * Refresh access token
 */
app.post('/refresh', async (c) => {
  if (!isSupabaseConfigured()) {
    return c.json({ success: false, error: 'Auth not configured' }, 503);
  }

  const refreshToken = c.req.header('X-Refresh-Token');
  
  if (!refreshToken) {
    return c.json({ success: false, error: 'Missing refresh token' }, 401);
  }

  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error) {
    return c.json({ success: false, error: 'Invalid refresh token' }, 401);
  }

  return c.json({
    success: true,
    data: {
      accessToken: data.session?.access_token,
      refreshToken: data.session?.refresh_token,
      expiresAt: data.session?.expires_at,
    },
  });
});

/**
 * GET /v1/auth/me
 * Get current user profile
 */
app.get('/me', async (c) => {
  if (!isSupabaseConfigured()) {
    return c.json({ success: false, error: 'Auth not configured' }, 503);
  }

  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Missing access token' }, 401);
  }

  const token = authHeader.replace('Bearer ', '');

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return c.json({ success: false, error: 'Invalid token' }, 401);
  }

  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Get API keys
  const apiKeys = await listApiKeys(user.id);

  return c.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: profile?.name,
        company: profile?.company,
        plan: profile?.plan || 'free',
        createdAt: profile?.created_at,
      },
      apiKeys: apiKeys.map(k => ({
        id: k.id,
        name: k.name,
        prefix: k.key_prefix,
        lastUsedAt: k.last_used_at,
        isActive: k.is_active,
        createdAt: k.created_at,
      })),
    },
  });
});

// ============================================================================
// API Key Management
// ============================================================================

/**
 * POST /v1/auth/keys
 * Create a new API key
 */
app.post('/keys', zValidator('json', createKeySchema), async (c) => {
  if (!isSupabaseConfigured()) {
    return c.json({ success: false, error: 'Auth not configured' }, 503);
  }

  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Missing access token' }, 401);
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return c.json({ success: false, error: 'Invalid token' }, 401);
  }

  const { name } = c.req.valid('json');

  // Check key limit (free: 2, pro: 10, enterprise: unlimited)
  const existingKeys = await listApiKeys(user.id);
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single();

  const limits = { free: 2, pro: 10, enterprise: 100 };
  const limit = limits[profile?.plan as keyof typeof limits] || 2;

  if (existingKeys.length >= limit) {
    return c.json({ 
      success: false, 
      error: `API key limit reached (${limit}). Upgrade your plan for more.` 
    }, 403);
  }

  const result = await createApiKey(user.id, name);

  if (!result) {
    return c.json({ success: false, error: 'Failed to create API key' }, 500);
  }

  return c.json({
    success: true,
    data: {
      id: result.data.id,
      name: result.data.name,
      key: result.key, // Only returned once!
      prefix: result.data.key_prefix,
      message: 'Save this key - it won\'t be shown again.',
    },
  });
});

/**
 * DELETE /v1/auth/keys/:id
 * Delete an API key
 */
app.delete('/keys/:id', async (c) => {
  if (!isSupabaseConfigured()) {
    return c.json({ success: false, error: 'Auth not configured' }, 503);
  }

  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Missing access token' }, 401);
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return c.json({ success: false, error: 'Invalid token' }, 401);
  }

  const keyId = c.req.param('id');
  const deleted = await deleteApiKey(keyId, user.id);

  if (!deleted) {
    return c.json({ success: false, error: 'API key not found' }, 404);
  }

  return c.json({ success: true });
});

export default app;
