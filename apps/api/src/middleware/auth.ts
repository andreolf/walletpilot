import { createMiddleware } from 'hono/factory';
import type { Variables } from '../types.js';
import { validateApiKey } from '../lib/apiKeys.js';

/**
 * Authentication middleware
 * Validates API key from Authorization header
 */
export const authMiddleware = createMiddleware<{ Variables: Variables }>(
  async (c, next) => {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader) {
      return c.json({ success: false, error: 'Missing Authorization header' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token.startsWith('wp_')) {
      return c.json({ success: false, error: 'Invalid API key format' }, 401);
    }

    const keyData = await validateApiKey(token);
    
    if (!keyData) {
      return c.json({ success: false, error: 'Invalid API key' }, 401);
    }

    // Set API key in context
    c.set('apiKey', {
      id: keyData.id,
      key: token,
      name: keyData.name,
      createdAt: new Date(keyData.created_at),
      rateLimit: keyData.rate_limit,
    });

    await next();
  }
);

/**
 * Optional auth - doesn't fail if no key provided
 */
export const optionalAuth = createMiddleware<{ Variables: Variables }>(
  async (c, next) => {
    const authHeader = c.req.header('Authorization');
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const keyData = await validateApiKey(token);
      
      if (keyData) {
        c.set('apiKey', {
          id: keyData.id,
          key: token,
          name: keyData.name,
          createdAt: new Date(keyData.created_at),
          rateLimit: keyData.rate_limit,
        });
      }
    }

    await next();
  }
);
