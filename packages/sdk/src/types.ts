import type { Address, Hex } from 'viem';

// ============================================================================
// Permission Types (ERC-7715)
// ============================================================================

/**
 * Token spending permission
 */
export interface SpendPermission {
  /** Token symbol or address */
  token: string | Address;
  /** Maximum amount per period (in token decimals or human readable) */
  limit: string;
  /** Time period for the limit */
  period: 'hour' | 'day' | 'week' | 'month';
}

/**
 * Permission request configuration
 */
export interface PermissionRequest {
  /** Token spending limits */
  spend?: SpendPermission | SpendPermission[];
  /** Allowed chain IDs */
  chains?: number[];
  /** Allowed contract addresses */
  contracts?: Address[];
  /** Permission expiry (e.g., '7d', '30d', '1y') */
  expiry?: string;
  /** Human-readable description shown to user */
  description?: string;
}

/**
 * Granted permission from MetaMask
 */
export interface GrantedPermission {
  /** Unique permission ID */
  id: string;
  /** Delegation data from MetaMask */
  delegation: Hex;
  /** Session account address */
  sessionAccount: Address;
  /** Session private key (stored securely) */
  sessionKey: Hex;
  /** Chain IDs this permission is valid for */
  chains: number[];
  /** When the permission expires */
  expiresAt: Date;
  /** Permission constraints */
  constraints: PermissionRequest;
  /** Current usage */
  usage: {
    spent: Record<string, string>; // token -> amount spent
    txCount: number;
  };
}

// ============================================================================
// Transaction Types
// ============================================================================

/**
 * Transaction intent for execution
 */
export interface TransactionIntent {
  /** Target contract address */
  to: Address;
  /** ETH value to send (in wei) */
  value?: bigint | string;
  /** Calldata */
  data?: Hex;
  /** Chain ID */
  chainId: number;
  /** Gas limit override */
  gasLimit?: bigint;
}

/**
 * Transaction result
 */
export interface TransactionResult {
  /** Transaction hash */
  hash: Hex;
  /** Chain ID */
  chainId: number;
  /** Block number (after confirmation) */
  blockNumber?: bigint;
  /** Transaction status */
  status: 'pending' | 'confirmed' | 'failed';
  /** Gas used */
  gasUsed?: bigint;
  /** Error message if failed */
  error?: string;
}

// ============================================================================
// Client Configuration
// ============================================================================

/**
 * WalletPilot client configuration
 */
export interface WalletPilotConfig {
  /** API key for hosted WalletPilot API (optional for self-hosted) */
  apiKey?: string;
  /** API base URL (defaults to api.walletpilot.xyz) */
  apiUrl?: string;
  /** RPC URLs by chain ID */
  rpcUrls?: Record<number, string>;
  /** Enable debug logging */
  debug?: boolean;
  /** Enable anonymous telemetry (default: true, set to false to disable) */
  telemetry?: boolean;
}

/**
 * Connection state
 */
export interface ConnectionState {
  /** Whether connected to a wallet */
  connected: boolean;
  /** User's wallet address */
  address?: Address;
  /** Active permissions */
  permissions: GrantedPermission[];
}

// ============================================================================
// API Types
// ============================================================================

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Permission request response
 */
export interface PermissionRequestResponse {
  /** Request ID */
  requestId: string;
  /** Deep link to open MetaMask */
  deepLink: string;
  /** QR code data URL */
  qrCode?: string;
  /** Expiry of this request */
  expiresAt: Date;
}
