# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Frontend development
npm run dev          # Start Next.js development server
npm run build        # Build production bundle
npm run start        # Start production server
npm run lint         # Run ESLint

# Package management
npm install          # Install dependencies
npm ci               # Clean install (faster for CI/CD)

# Move contract development (in contracts/suigive/)
sui move build       # Build Move contracts
sui move test        # Run Move tests

# Contract initialization (from project root)
npx ts-node scripts/initialize-contract.ts  # Initialize Registry and update config
```

## Architecture Overview

### Frontend Stack
- **Framework**: Next.js 15 with React 19
- **Styling**: Tailwind CSS with shadcn/ui components
- **Blockchain**: Sui blockchain integration via @mysten/dapp-kit
- **State**: React hooks with @tanstack/react-query for data fetching
- **Forms**: react-hook-form with zod validation
- **Charts**: Chart.js and Recharts for data visualization

### Smart Contract Architecture
The project uses a multi-token system built on Sui Move:

1. **Core Crowdfunding** (`contracts/suigive/sources/crowdfunding.move`)
   - Campaign creation and management
   - Dual token donations (SUI and sgUSD)
   - Goal-based fund distribution
   - Service provider fund management

2. **Token System**:
   - **SG_USD** (`sg_usd.move`): Manager-controlled stablecoin with 9 decimals
     - SGUSD_Manager object controls treasury cap
     - Initial supply: 10,000 sgUSD minted to deployer
   - **SG_SUI** (`sg_sui_token.move`): Closed-loop token for service providers
     - Service providers receive SG_SUI when funds are distributed
     - Redeemable back to SUI through treasury
   - **Donation Receipts** (`donation_receipt.move`): NFT-based donation tracking
     - Unique NFT per donation with metadata
     - Contains campaign info, amount, and donor details

3. **Registry Pattern**: Centralized campaign storage via `REGISTRY_ID`

### Key Configuration
- **Static Config** (`lib/sui-config.ts`): Deployed contract addresses
  - Package ID: `0x049c3080b5e17baf41f64b2fd8503f057bfe79cb1790e23ded612860ed91f187`
  - Registry ID: `0x0a2dc4ae45c86463b38198fb0f44020b79025e7fb67f620ba38b389cde50933b`
  - Treasury and Manager IDs for token operations
- **Dynamic Config** (`lib/env-config.ts`): Environment variables with fallbacks
- **CORS Proxy**: `/api/sui-proxy/route.ts` for client-side blockchain calls

### Wallet Integration
Multiple wallet compatibility layers:
- Primary: `@mysten/dapp-kit` with transaction execution in `lib/wallet-adapter.ts`
- Enhanced adapter: `lib/wallet-adapter-enhanced.ts` for additional features
- Fallback adapters in `lib/` for different wallet types
- Monitoring components for debugging wallet interactions

### Frontend Structure
- **Pages**: App router structure (`app/`)
- **Components**: Reusable UI components (`components/`) including token-specific components
- **Hooks**: Custom hooks for Sui integration (`hooks/`)
- **Services**: Blockchain interaction logic (`lib/`)

### Testing Architecture
- **Move Tests**: Primary testing through Move test modules
  - `tests.move` - Main integration tests
  - `enhanced_tests.move` - Extended test scenarios
  - `sg_usd_tests.move` - Token-specific tests
- **No JS Testing Framework**: Testing focused on smart contracts

### Data Flow
1. Frontend components use custom hooks (`useSuiContract`, `useSuiTokens`)
2. Hooks call service functions in `lib/sui-contract.ts`
3. Services construct TransactionBlocks and execute via wallet adapters
4. Results are cached using React Query

### Contract Initialization Workflow
1. Deploy contracts: `sui move build` && `sui client publish`
2. Run initialization script to create Registry and update config
3. Script automatically updates `sui-config.ts` with new Registry ID

When working with contracts, always reference `SUI_CONFIG` for deployed addresses and use the proxy API route for client-side blockchain calls.