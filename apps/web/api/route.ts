import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { cors } from 'hono/cors';
import { Redis } from '@upstash/redis';

// ============================================================================
// Redis client (Upstash)
// ============================================================================

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '',
});

// ============================================================================
// In-memory stores (for non-persistent data)
// ============================================================================

const API_KEYS = new Map<string, { id: string; name: string }>([
  ['wp_demo_key_12345', { id: 'demo', name: 'Demo Key' }],
]);

const permissions = new Map<string, any>();
const transactions = new Map<string, any>();

// ============================================================================
// App Setup
// ============================================================================

const app = new Hono().basePath('/api');

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// ============================================================================
// Auth Middleware
// ============================================================================

const requireAuth = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) {
    return c.json({ success: false, error: 'Missing Authorization header' }, 401);
  }
  const token = authHeader.replace('Bearer ', '');
  const keyData = API_KEYS.get(token);
  if (!keyData) {
    return c.json({ success: false, error: 'Invalid API key' }, 401);
  }
  c.set('apiKey', keyData);
  await next();
};

// ============================================================================
// Routes
// ============================================================================

// Health check
app.get('/', (c) => {
  return c.json({
    name: 'WalletPilot API',
    version: '0.1.0',
    status: 'healthy',
    docs: 'https://docs.walletpilot.xyz',
  });
});

app.get('/health', (c) => c.json({ status: 'ok' }));

// ============================================================================
// Waitlist (persisted to Upstash Redis)
// ============================================================================

app.post('/waitlist', async (c) => {
  try {
    const body = await c.req.json();
    const email = body.email?.trim().toLowerCase();
    
    if (!email || !email.includes('@')) {
      return c.json({ success: false, error: 'Invalid email' }, 400);
    }
    
    // Check if already exists
    const exists = await redis.sismember('waitlist:emails', email);
    if (exists) {
      return c.json({ success: true, message: 'Already on the list!' });
    }
    
    // Add to waitlist set
    await redis.sadd('waitlist:emails', email);
    
    // Store signup details
    await redis.hset(`waitlist:${email}`, {
      email,
      createdAt: new Date().toISOString(),
    });
    
    // Get total count
    const count = await redis.scard('waitlist:emails');
    console.log(`[Waitlist] New signup: ${email} (total: ${count})`);
    
    return c.json({ success: true, message: "You're on the list!" });
  } catch (err) {
    console.error('[Waitlist] Error:', err);
    return c.json({ success: false, error: 'Server error' }, 500);
  }
});

app.get('/waitlist/count', async (c) => {
  try {
    const count = await redis.scard('waitlist:emails');
    return c.json({ count });
  } catch {
    return c.json({ count: 0 });
  }
});

app.get('/waitlist/list', async (c) => {
  // Protected endpoint - require auth
  const authHeader = c.req.header('Authorization');
  if (authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }
  
  try {
    const emails = await redis.smembers('waitlist:emails');
    return c.json({ success: true, data: emails, count: emails.length });
  } catch {
    return c.json({ success: false, error: 'Server error' }, 500);
  }
});

// ============================================================================
// Permissions
// ============================================================================

app.post('/v1/permissions/request', requireAuth, async (c) => {
  const body = await c.req.json();
  const requestId = crypto.randomUUID();
  
  // Calculate expiry
  const expiry = body.permission?.expiry || '30d';
  const match = expiry.match(/^(\d+)(d|h|w|m)$/);
  const days = match ? parseInt(match[1]) * (match[2] === 'w' ? 7 : match[2] === 'm' ? 30 : 1) : 30;
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  // Build ERC-7715 payload
  const payload = {
    method: 'wallet_grantPermissions',
    params: [{
      permissions: body.permission,
      expiry: Math.floor(expiresAt.getTime() / 1000),
    }],
  };

  const deepLink = `https://metamask.app.link/wc?payload=${encodeURIComponent(JSON.stringify(payload))}`;

  return c.json({
    success: true,
    data: {
      requestId,
      deepLink,
      expiresAt: expiresAt.toISOString(),
    },
  });
});

app.get('/v1/permissions/:id', requireAuth, async (c) => {
  const id = c.req.param('id');
  const permission = permissions.get(id);
  
  if (!permission) {
    return c.json({ success: false, error: 'Permission not found' }, 404);
  }

  return c.json({ success: true, data: permission });
});

app.get('/v1/permissions', requireAuth, async (c) => {
  const all = Array.from(permissions.values());
  return c.json({ success: true, data: all });
});

app.delete('/v1/permissions/:id', requireAuth, async (c) => {
  const id = c.req.param('id');
  permissions.delete(id);
  return c.json({ success: true });
});

// ============================================================================
// Transactions
// ============================================================================

app.post('/v1/tx/execute', requireAuth, async (c) => {
  const body = await c.req.json();
  
  // Generate mock transaction hash
  const hash = '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0')).join('');

  const tx = {
    id: crypto.randomUUID(),
    hash,
    chainId: body.intent.chainId,
    to: body.intent.to,
    value: body.intent.value || '0',
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  };

  transactions.set(tx.id, tx);

  return c.json({
    success: true,
    data: {
      id: tx.id,
      hash: tx.hash,
      chainId: tx.chainId,
      status: tx.status,
    },
  });
});

app.get('/v1/tx/:hash', requireAuth, async (c) => {
  const hash = c.req.param('hash');
  
  for (const tx of transactions.values()) {
    if (tx.hash === hash) {
      return c.json({ success: true, data: tx });
    }
  }

  return c.json({ success: false, error: 'Transaction not found' }, 404);
});

// ============================================================================
// Export for Vercel
// ============================================================================

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
export const OPTIONS = handle(app);
