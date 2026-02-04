import { createPublicClient, http, type Address, type Hex } from 'viem';
import { mainnet, polygon, arbitrum, optimism, base } from 'viem/chains';
import type {
  WalletPilotConfig,
  PermissionRequest,
  GrantedPermission,
  TransactionIntent,
  TransactionResult,
  ConnectionState,
  PermissionRequestResponse,
  ApiResponse,
} from './types.js';
import { PermissionBuilder, calculateExpiry } from './permissions.js';
import { Telemetry } from './telemetry.js';

const DEFAULT_API_URL = 'https://api.walletpilot.xyz';

const CHAIN_MAP = {
  1: mainnet,
  137: polygon,
  42161: arbitrum,
  10: optimism,
  8453: base,
} as const;

/**
 * WalletPilot SDK Client
 * 
 * Enables AI agents to execute on-chain transactions with user-granted permissions
 * using MetaMask's ERC-7715 standard.
 * 
 * @example
 * ```ts
 * import { WalletPilot } from '@walletpilot/sdk';
 * 
 * const pilot = new WalletPilot({ apiKey: 'wp_...' });
 * 
 * // Request permission (user approves in MetaMask)
 * const { deepLink } = await pilot.requestPermission({
 *   spend: { token: 'USDC', limit: '100', period: 'day' },
 *   chains: [1, 137],
 *   expiry: '30d'
 * });
 * 
 * // Later, execute transaction without user approval
 * const result = await pilot.execute({
 *   to: '0x...',
 *   data: '0x...',
 *   chainId: 1
 * });
 * ```
 */
export class WalletPilot {
  private config: Required<Omit<WalletPilotConfig, 'telemetry'>> & { telemetry: boolean };
  private permissions: Map<string, GrantedPermission> = new Map();
  private sessionKey?: Hex;
  private telemetry: Telemetry;

  constructor(config: WalletPilotConfig = {}) {
    this.config = {
      apiKey: config.apiKey || '',
      apiUrl: config.apiUrl || DEFAULT_API_URL,
      rpcUrls: config.rpcUrls || {},
      debug: config.debug || false,
      telemetry: config.telemetry !== false,
    };

    // Initialize telemetry (opt-out via telemetry: false)
    this.telemetry = new Telemetry({
      enabled: this.config.telemetry,
    });

    // Track SDK initialization
    this.telemetry.track('sdk_init', { success: true });
  }

  /**
   * Create a new permission builder
   */
  permission(): PermissionBuilder {
    return new PermissionBuilder();
  }

  /**
   * Request permission from user
   * 
   * Returns a deep link that the user should open in MetaMask.
   * The permission will be granted after user approval.
   */
  async requestPermission(
    request: PermissionRequest
  ): Promise<PermissionRequestResponse> {
    this.log('Requesting permission:', request);

    // For now, return a mock response
    // In production, this calls the WalletPilot API which generates
    // the ERC-7715 wallet_grantPermissions request
    
    if (this.config.apiKey) {
      // Use hosted API
      try {
        const response = await this.apiCall<PermissionRequestResponse>(
          '/v1/permissions/request',
          'POST',
          { permission: request }
        );
        
        if (!response.success || !response.data) {
          this.telemetry.track('request_permission', { 
            success: false, 
            error_type: 'api_error' 
          });
          throw new Error(response.error || 'Failed to request permission');
        }
        
        this.telemetry.track('request_permission', { success: true });
        return response.data;
      } catch (error) {
        this.telemetry.track('request_permission', { 
          success: false, 
          error_type: 'request_failed' 
        });
        throw error;
      }
    }

    // Self-hosted / local mode - generate locally
    const requestId = crypto.randomUUID();
    const expiresAt = calculateExpiry(request.expiry || '30d');

    // In production, this would use MetaMask Smart Accounts Kit
    // to generate the actual wallet_grantPermissions payload
    const payload = {
      method: 'wallet_grantPermissions',
      params: [{
        permissions: this.buildErc7715Permissions(request),
        expiry: Math.floor(expiresAt.getTime() / 1000),
      }],
    };

    const deepLink = `metamask://wallet_grantPermissions?payload=${encodeURIComponent(JSON.stringify(payload))}`;

    this.telemetry.track('request_permission', { success: true });

    return {
      requestId,
      deepLink,
      expiresAt,
    };
  }

  /**
   * Store a granted permission (called after user approves)
   */
  async storePermission(permission: GrantedPermission): Promise<void> {
    this.permissions.set(permission.id, permission);
    this.sessionKey = permission.sessionKey;
    this.log('Permission stored:', permission.id);
  }

  /**
   * Execute a transaction using granted permissions
   */
  async execute(intent: TransactionIntent): Promise<TransactionResult> {
    this.log('Executing transaction:', intent);

    // Find a valid permission for this chain
    const permission = this.findPermissionForChain(intent.chainId);
    if (!permission) {
      this.telemetry.track('execute', { 
        success: false, 
        error_type: 'no_permission',
        chain_id: intent.chainId 
      });
      throw new Error(`No valid permission for chain ${intent.chainId}`);
    }

    // Check if within spending limits
    await this.validateSpendingLimits(permission, intent);

    if (this.config.apiKey) {
      // Use hosted API
      try {
        const response = await this.apiCall<TransactionResult>(
          '/v1/tx/execute',
          'POST',
          { 
            intent,
            permissionId: permission.id,
          }
        );
        
        if (!response.success || !response.data) {
          this.telemetry.track('execute', { 
            success: false, 
            error_type: 'api_error',
            chain_id: intent.chainId 
          });
          throw new Error(response.error || 'Failed to execute transaction');
        }
        
        this.telemetry.track('execute', { 
          success: true, 
          chain_id: intent.chainId 
        });
        return response.data;
      } catch (error) {
        this.telemetry.track('execute', { 
          success: false, 
          error_type: 'execute_failed',
          chain_id: intent.chainId 
        });
        throw error;
      }
    }

    // Self-hosted mode - execute directly
    const result = await this.executeLocally(intent, permission);
    this.telemetry.track('execute', { 
      success: result.status !== 'failed', 
      chain_id: intent.chainId 
    });
    return result;
  }

  /**
   * Get current connection state
   */
  getState(): ConnectionState {
    const permissions = Array.from(this.permissions.values());
    const activePermissions = permissions.filter(
      p => p.expiresAt > new Date()
    );

    return {
      connected: activePermissions.length > 0,
      address: activePermissions[0]?.sessionAccount,
      permissions: activePermissions,
    };
  }

  /**
   * Get transaction status
   */
  async getTransaction(hash: Hex, chainId: number): Promise<TransactionResult> {
    const chain = CHAIN_MAP[chainId as keyof typeof CHAIN_MAP];
    if (!chain) {
      throw new Error(`Unsupported chain: ${chainId}`);
    }

    const client = createPublicClient({
      chain,
      transport: http(this.config.rpcUrls[chainId]),
    });

    const receipt = await client.getTransactionReceipt({ hash });

    return {
      hash,
      chainId,
      blockNumber: receipt.blockNumber,
      status: receipt.status === 'success' ? 'confirmed' : 'failed',
      gasUsed: receipt.gasUsed,
    };
  }

  /**
   * Revoke a permission
   */
  async revokePermission(permissionId: string): Promise<void> {
    this.permissions.delete(permissionId);
    this.log('Permission revoked:', permissionId);

    if (this.config.apiKey) {
      await this.apiCall('/v1/permissions/' + permissionId, 'DELETE');
    }
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private buildErc7715Permissions(request: PermissionRequest): object[] {
    const permissions: object[] = [];

    // Add spend permissions
    const spends = Array.isArray(request.spend)
      ? request.spend
      : request.spend
        ? [request.spend]
        : [];

    for (const spend of spends) {
      permissions.push({
        type: 'erc20-spend',
        token: spend.token,
        limit: spend.limit,
        period: spend.period,
      });
    }

    // Add chain restrictions
    if (request.chains?.length) {
      permissions.push({
        type: 'chain-allowlist',
        chains: request.chains,
      });
    }

    // Add contract restrictions
    if (request.contracts?.length) {
      permissions.push({
        type: 'contract-allowlist',
        contracts: request.contracts,
      });
    }

    return permissions;
  }

  private findPermissionForChain(chainId: number): GrantedPermission | undefined {
    for (const permission of this.permissions.values()) {
      if (
        permission.expiresAt > new Date() &&
        permission.chains.includes(chainId)
      ) {
        return permission;
      }
    }
    return undefined;
  }

  private async validateSpendingLimits(
    permission: GrantedPermission,
    intent: TransactionIntent
  ): Promise<void> {
    // TODO: Implement actual spending limit validation
    // This would check the transaction value against the permission limits
    this.log('Validating spending limits for permission:', permission.id);
  }

  private async executeLocally(
    intent: TransactionIntent,
    permission: GrantedPermission
  ): Promise<TransactionResult> {
    const chain = CHAIN_MAP[intent.chainId as keyof typeof CHAIN_MAP];
    if (!chain) {
      throw new Error(`Unsupported chain: ${intent.chainId}`);
    }

    // In production, this would:
    // 1. Create the transaction using the session account
    // 2. Sign with the session key
    // 3. Submit via the delegation framework
    
    // For now, return a mock pending result
    this.log('Local execution not yet implemented - use hosted API');
    
    return {
      hash: '0x' + '0'.repeat(64) as Hex,
      chainId: intent.chainId,
      status: 'pending',
    };
  }

  private async apiCall<T>(
    path: string,
    method: 'GET' | 'POST' | 'DELETE' = 'GET',
    body?: object
  ): Promise<ApiResponse<T>> {
    const url = `${this.config.apiUrl}${path}`;
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();
      return data as ApiResponse<T>;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private log(...args: unknown[]): void {
    if (this.config.debug) {
      console.log('[WalletPilot]', ...args);
    }
  }
}
