/**
 * @walletpilot/sdk
 * 
 * SDK for AI agents to execute on-chain transactions with user-granted permissions.
 * Built on MetaMask's ERC-7715 standard and Smart Accounts Kit.
 * 
 * @example
 * ```ts
 * import { WalletPilot, PermissionBuilder } from '@walletpilot/sdk';
 * 
 * const pilot = new WalletPilot({ apiKey: 'wp_...' });
 * 
 * // Build permission request
 * const permission = new PermissionBuilder()
 *   .spend('USDC', '100', 'day')
 *   .chains([1, 137])
 *   .expiry('30d')
 *   .build();
 * 
 * // Request permission (user approves in MetaMask)
 * const { deepLink } = await pilot.requestPermission(permission);
 * console.log('Open in MetaMask:', deepLink);
 * 
 * // Later, execute transaction without user approval
 * const result = await pilot.execute({
 *   to: '0x...',
 *   data: '0x...',
 *   chainId: 1
 * });
 * ```
 * 
 * @packageDocumentation
 */

// Main client
export { WalletPilot } from './client.js';

// Permission builder
export { 
  PermissionBuilder,
  parseDuration,
  calculateExpiry,
  formatPermission,
} from './permissions.js';

// Types
export type {
  // Config
  WalletPilotConfig,
  ConnectionState,
  
  // Permissions
  PermissionRequest,
  SpendPermission,
  GrantedPermission,
  PermissionRequestResponse,
  
  // Transactions
  TransactionIntent,
  TransactionResult,
  
  // API
  ApiResponse,
} from './types.js';

// Version
export const VERSION = '0.1.0';
