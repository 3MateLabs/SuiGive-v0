# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Frontend development
npm run dev          # Start Next.js development server
npm run build        # Build production bundle
npm run lint         # Run ESLint

# Package management
npm install             # Install dependencies
npm ci                  # Clean install

# Move contract development (in contracts/suigive/)
sui move build       # Build Move contracts
sui move test        # Run Move tests
```

## Architecture Overview

### Frontend Stack
- **Framework**: Next.js 15 with React 19
- **Styling**: Tailwind CSS with shadcn/ui components
- **Blockchain**: Sui blockchain integration via @mysten/dapp-kit
- **State**: React hooks with @tanstack/react-query for data fetching

### Smart Contract Architecture
The project uses a multi-token system built on Sui Move:

1. **Core Crowdfunding** (`contracts/suigive/sources/crowdfunding.move`)
   - Campaign creation and management
   - Dual token donations (SUI and sgUSD)
   - Goal-based fund distribution

2. **Token System**:
   - **SG_USD** (`sg_usd.move`): Stablecoin for donations
   - **SG_SUI** (`sg_sui_token.move`): Closed-loop token system
   - **Donation Receipts** (`donation_receipt.move`): NFT-based donation tracking

3. **Registry Pattern**: Centralized campaign storage via `REGISTRY_ID`

### Key Configuration
Contract configuration is centralized in `lib/sui-config.ts` with deployed addresses:
- Package ID: `0x049c3080b5e17baf41f64b2fd8503f057bfe79cb1790e23ded612860ed91f187`
- Registry ID: `0x0a2dc4ae45c86463b38198fb0f44020b79025e7fb67f620ba38b389cde50933b`
- Treasury and Manager IDs for token operations

### Wallet Integration
Multiple wallet compatibility layers:
- Primary: `@mysten/dapp-kit` with transaction execution in `lib/wallet-adapter.ts`
- Fallback adapters in `lib/` for different wallet types
- CORS proxy at `/api/sui-proxy/route.ts` for blockchain calls

### Frontend Structure
- **Pages**: App router structure (`app/`)
- **Components**: Reusable UI components (`components/`) including token-specific components
- **Hooks**: Custom hooks for Sui integration (`hooks/`)
- **Services**: Blockchain interaction logic (`lib/`)

### Data Flow
1. Frontend components use custom hooks (`useSuiContract`, `useSuiTokens`)
2. Hooks call service functions in `lib/sui-contract.ts`
3. Services construct TransactionBlocks and execute via wallet adapters
4. Results are cached using React Query

When working with contracts, always reference `SUI_CONFIG` for deployed addresses and use the proxy API route for client-side blockchain calls.