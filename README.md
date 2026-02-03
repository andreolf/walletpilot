# WalletPilot

> SDK for AI agents to execute on-chain transactions with user-granted permissions.

Built on MetaMask's [ERC-7715](https://docs.metamask.io/smart-accounts-kit/concepts/erc7715/) standard and Smart Accounts Kit.

## The Problem

AI agents need to transact on-chain, but:
- Users won't share private keys
- Approving every transaction manually is painful
- No standardized way to say "agent can spend $50/day max"

## The Solution

WalletPilot lets users grant **scoped permissions** to AI agents via MetaMask:

```typescript
import { WalletPilot } from '@walletpilot/sdk';

const pilot = new WalletPilot({ apiKey: 'wp_...' });

// Request permission (user approves once in MetaMask)
const { deepLink } = await pilot.requestPermission({
  spend: { token: 'USDC', limit: '100', period: 'day' },
  chains: [1, 137, 42161],
  expiry: '30d'
});

// Later, execute without approval
await pilot.execute({
  to: '0x...',
  data: swapCalldata,
  chainId: 1
});
```

## How It Works

1. **User grants permission** via MetaMask (ERC-7715)
2. **Permission stored** as delegation to session account
3. **Agent executes** transactions within limits
4. **No per-tx approval** needed

```
User → MetaMask → Grant Permission → WalletPilot → Execute → Chain
         ↓
   "Allow Agent X to spend
    up to 100 USDC/day
    for 30 days"
```

## Features

- **No Private Keys** - Users keep their MetaMask. Permissions, not keys.
- **Guardrails** - Spend limits, chain allowlists, contract restrictions
- **Multi-Chain** - Ethereum, Polygon, Arbitrum, Optimism, Base
- **MetaMask Native** - Built on official ERC-7715 standard
- **Open Source** - SDK is fully open source

## Quick Start

```bash
npm install @walletpilot/sdk
```

```typescript
import { WalletPilot, PermissionBuilder } from '@walletpilot/sdk';

// Initialize client
const pilot = new WalletPilot({
  apiKey: 'wp_...', // Get at walletpilot.xyz
  debug: true,
});

// Build permission request
const permission = new PermissionBuilder()
  .spend('USDC', '100', 'day')
  .spend('ETH', '0.1', 'day')
  .chains([1, 137])
  .expiry('30d')
  .build();

// Request permission
const { deepLink } = await pilot.requestPermission(permission);
console.log('Open in MetaMask:', deepLink);

// Execute transaction
const result = await pilot.execute({
  to: '0x1234...',
  value: 0n,
  data: '0x...',
  chainId: 1,
});

console.log('Transaction:', result.hash);
```

## Project Structure

```
walletpilot/
├── packages/
│   └── sdk/          # @walletpilot/sdk - Core TypeScript SDK
├── apps/
│   ├── web/          # Landing page (walletpilot.xyz)
│   └── api/          # REST API (api.walletpilot.xyz)
├── turbo.json
└── package.json
```

## Development

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run dev server
npm run dev
```

## Built On

- [MetaMask Smart Accounts Kit](https://docs.metamask.io/smart-accounts-kit/)
- [ERC-7715](https://docs.metamask.io/smart-accounts-kit/concepts/erc7715/) - Wallet Permissions
- [ERC-4337](https://eips.ethereum.org/EIPS/eip-4337) - Account Abstraction
- [viem](https://viem.sh/) - TypeScript Ethereum library

## Roadmap

- [x] Core SDK
- [x] Landing page
- [ ] Hosted API
- [ ] Developer dashboard
- [ ] Cursor skill
- [ ] Python SDK
- [ ] Agent explorer

## License

MIT
