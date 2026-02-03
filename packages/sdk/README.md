# walletpilot-sdk

SDK for AI agents to execute on-chain transactions with user-granted permissions. Built on MetaMask's ERC-7715 standard.

## Installation

```bash
npm install walletpilot-sdk
```

## Quick Start

```typescript
import { WalletPilot, PermissionBuilder } from 'walletpilot-sdk';

const pilot = new WalletPilot({ apiKey: 'wp_...' });

// Request permission (user approves once in MetaMask)
const permission = new PermissionBuilder()
  .spend('USDC', '100', 'day')   // Max 100 USDC per day
  .spend('ETH', '0.1', 'day')    // Max 0.1 ETH per day
  .chains([1, 137, 42161])       // Ethereum, Polygon, Arbitrum
  .expiry('30d')                 // Valid for 30 days
  .build();

const { deepLink } = await pilot.requestPermission(permission);
console.log('Open in MetaMask:', deepLink);

// Later, execute without approval
const result = await pilot.execute({
  to: '0x...',
  data: swapCalldata,
  chainId: 1
});

console.log('Transaction:', result.hash);
```

## Features

- **No Private Keys** — Users keep their MetaMask. Grant scoped permissions, not keys.
- **Guardrails** — Spend limits, chain allowlists, contract restrictions.
- **Multi-Chain** — Ethereum, Polygon, Arbitrum, Optimism, Base.
- **MetaMask Native** — Built on official ERC-7715 standard.

## How It Works

1. **User grants permission** via MetaMask (ERC-7715)
2. **Permission stored** as delegation to session account
3. **Agent executes** transactions within limits
4. **No per-tx approval** needed

## API

### `WalletPilot`

Main client class.

```typescript
const pilot = new WalletPilot({
  apiKey: 'wp_...',        // API key (get at walletpilot.xyz)
  apiUrl: 'https://...',   // Custom API URL (optional)
  debug: true,             // Enable logging (optional)
});
```

### `PermissionBuilder`

Fluent builder for permission requests.

```typescript
const permission = new PermissionBuilder()
  .spend(token, limit, period)  // Add spending limit
  .chains([1, 137])             // Set allowed chains
  .contracts(['0x...'])         // Set allowed contracts
  .expiry('30d')                // Set expiration
  .description('...')           // Human-readable description
  .build();
```

### `pilot.requestPermission(permission)`

Request permission from user. Returns deep link to open in MetaMask.

```typescript
const { deepLink, requestId, expiresAt } = await pilot.requestPermission(permission);
```

### `pilot.execute(intent)`

Execute a transaction using granted permissions.

```typescript
const result = await pilot.execute({
  to: '0x...',      // Target address
  data: '0x...',    // Calldata
  value: 0n,        // ETH value (optional)
  chainId: 1,       // Chain ID
});
// Returns: { hash, chainId, status }
```

### `pilot.getState()`

Get current connection state and active permissions.

```typescript
const state = pilot.getState();
// { connected: true, address: '0x...', permissions: [...] }
```

### `pilot.getTransaction(hash, chainId)`

Get transaction status from chain.

```typescript
const tx = await pilot.getTransaction('0x...', 1);
// { hash, chainId, status, blockNumber, gasUsed }
```

## Supported Chains

| Chain | ID |
|-------|-----|
| Ethereum | 1 |
| Polygon | 137 |
| Arbitrum | 42161 |
| Optimism | 10 |
| Base | 8453 |

## Links

- [Website](https://walletpilot.xyz)
- [GitHub](https://github.com/andreolf/walletpilot)
- [Documentation](https://docs.walletpilot.xyz)

## License

MIT
