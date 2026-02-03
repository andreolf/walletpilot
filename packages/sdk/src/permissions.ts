import type { Address } from 'viem';
import type { PermissionRequest, SpendPermission } from './types.js';

/**
 * Builder for creating ERC-7715 permission requests
 * 
 * @example
 * ```ts
 * const permission = new PermissionBuilder()
 *   .spend('USDC', '100', 'day')
 *   .spend('ETH', '0.1', 'day')
 *   .chains([1, 137, 42161])
 *   .expiry('30d')
 *   .build();
 * ```
 */
export class PermissionBuilder {
  private request: PermissionRequest = {};
  private spendLimits: SpendPermission[] = [];

  /**
   * Add a token spending limit
   */
  spend(
    token: string | Address,
    limit: string,
    period: SpendPermission['period'] = 'day'
  ): this {
    this.spendLimits.push({ token, limit, period });
    return this;
  }

  /**
   * Set allowed chains
   */
  chains(chainIds: number[]): this {
    this.request.chains = chainIds;
    return this;
  }

  /**
   * Set allowed contracts
   */
  contracts(addresses: Address[]): this {
    this.request.contracts = addresses;
    return this;
  }

  /**
   * Set permission expiry
   * @param duration Duration string like '7d', '30d', '1y'
   */
  expiry(duration: string): this {
    this.request.expiry = duration;
    return this;
  }

  /**
   * Set human-readable description
   */
  description(desc: string): this {
    this.request.description = desc;
    return this;
  }

  /**
   * Build the permission request
   */
  build(): PermissionRequest {
    return {
      ...this.request,
      spend: this.spendLimits.length === 1 
        ? this.spendLimits[0] 
        : this.spendLimits.length > 1 
          ? this.spendLimits 
          : undefined,
    };
  }
}

/**
 * Parse duration string to milliseconds
 */
export function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)(h|d|w|m|y)$/);
  if (!match) {
    throw new Error(`Invalid duration: ${duration}`);
  }

  const [, value, unit] = match;
  const num = parseInt(value, 10);

  const multipliers: Record<string, number> = {
    h: 60 * 60 * 1000,           // hour
    d: 24 * 60 * 60 * 1000,      // day
    w: 7 * 24 * 60 * 60 * 1000,  // week
    m: 30 * 24 * 60 * 60 * 1000, // month (approx)
    y: 365 * 24 * 60 * 60 * 1000, // year
  };

  return num * multipliers[unit];
}

/**
 * Calculate expiry date from duration string
 */
export function calculateExpiry(duration: string): Date {
  return new Date(Date.now() + parseDuration(duration));
}

/**
 * Format permission for display
 */
export function formatPermission(permission: PermissionRequest): string {
  const parts: string[] = [];

  // Spend limits
  const spends = Array.isArray(permission.spend) 
    ? permission.spend 
    : permission.spend 
      ? [permission.spend] 
      : [];
  
  for (const spend of spends) {
    parts.push(`Spend up to ${spend.limit} ${spend.token} per ${spend.period}`);
  }

  // Chains
  if (permission.chains?.length) {
    const chainNames: Record<number, string> = {
      1: 'Ethereum',
      137: 'Polygon',
      42161: 'Arbitrum',
      10: 'Optimism',
      8453: 'Base',
    };
    const names = permission.chains.map(id => chainNames[id] || `Chain ${id}`);
    parts.push(`On: ${names.join(', ')}`);
  }

  // Expiry
  if (permission.expiry) {
    parts.push(`Expires in: ${permission.expiry}`);
  }

  return parts.join('\n');
}
