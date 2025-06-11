# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SuiGives is a decentralized crowdfunding platform built on the Sui blockchain. It enables users to create campaigns, donate using SUI or sgUSD tokens, receive NFT donation receipts, and track campaign progress with analytics.

## Development Commands

```bash
# Frontend development
npm run dev          # Start Next.js development server
npm run build        # Build production bundle
npm run start        # Start production server
npm run lint         # Run ESLint

# Package management
npm install             # Install dependencies
npm ci                  # Clean install

# Database management (Prisma)
npx prisma generate     # Generate Prisma client
npx prisma db push      # Push schema changes to database
npx prisma migrate dev  # Create and apply migrations
npx prisma studio       # Open Prisma Studio GUI

# Move contract development (in contracts/suigive/)
sui move build       # Build Move contracts
sui move test        # Run Move tests
sui move test --coverage  # Run tests with coverage report

# Testing and debugging (Node.js scripts)
node test-contract.js           # Test contract connectivity
node test-frontend.js           # Test frontend configuration
node scripts/test-db-connection.js  # Test database connection
node scripts/sync-blockchain-database.js  # Sync blockchain data to database
node scripts/check-blockchain-donations.js  # Inspect on-chain donations
node scripts/monitor-blockchain-campaigns.js  # Monitor campaign activity
```

## Architecture Overview

### Frontend Stack
- **Framework**: Next.js 15 with React 19
- **Styling**: Tailwind CSS with shadcn/ui components
- **Blockchain**: Sui blockchain integration via @mysten/dapp-kit
- **State**: React hooks with @tanstack/react-query for data fetching
- **Database**: PostgreSQL with Prisma ORM
- **Charts**: Chart.js and Recharts for data visualization

### Smart Contract Architecture
The project uses a multi-token system built on Sui Move:

1. **Core Crowdfunding** (`contracts/suigive/sources/crowdfunding.move`)
   - Campaign creation and management
   - Dual token donations (SUI and sgUSD)
   - Goal-based fund distribution with automatic closure
   - Beneficiary commission system: 6% on successful campaigns, 3% on failed campaigns

2. **Token System**:
   - **SG_USD** (`sg_usd.move`): Stablecoin for donations with treasury-controlled minting
   - **SG_SUI** (`sg_sui_token.move`): Closed-loop token system for fund distribution
   - **Donation Receipts** (`donation_receipt.move`): NFT-based donation tracking with metadata

3. **Registry Pattern**: Centralized campaign storage via `REGISTRY_ID` for efficient querying

4. **Test Coverage**: Comprehensive test suite in `contracts/suigive/tests/` including:
   - `donation_receipt_tests.move`: NFT receipt functionality
   - `sg_sui_token_tests.move`: Token operations
   - `sg_usd_tests.move`: Stablecoin operations
   - `beneficiary_tests.move`: Commission system
   - `enhanced_tests.move`: Integration scenarios

### Key Configuration
Contract configuration is centralized in `lib/sui-config.ts` with deployed addresses:
- Package ID: `0x2c197bad6a8f24f57755ebbae999f70cd36dab9934dece4e20b95b6c44743e70`
- Campaign Manager ID: `0x3238492b12878201b67444e5fd41eb7be91657563ba7cf0e0b772cdd49821cd8`
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

### Database Architecture
The application uses PostgreSQL with Prisma ORM for off-chain data storage:
- **Campaign**: Stores campaign metadata and analytics (linked to blockchain campaigns by ID)
- **Donation**: Tracks donation history with blockchain transaction references
- **User**: User profiles with donation statistics and privacy settings

Database is synced with blockchain data through scripts in `scripts/` directory. Always use `prisma.campaign.upsert()` to sync blockchain data to avoid duplicates.

### Environment Variables
Required environment variables (see `.env`):
- `DATABASE_URL`: PostgreSQL connection string (pooled connection)
- `DATABASE_DIRECT_URL`: Direct PostgreSQL connection (for Prisma migrations)
- Additional Sui network configuration may be required for production

### Important Architectural Decisions

1. **Hybrid On-Chain/Off-Chain Model**: 
   - Critical data (donations, campaign state) stored on-chain
   - Metadata and analytics cached in PostgreSQL for performance
   - Scripts in `scripts/` handle synchronization

2. **Transaction Execution Pattern**:
   - All blockchain calls go through `lib/wallet-adapter.ts`
   - CORS proxy (`/api/sui-proxy`) handles client-side RPC calls
   - Transaction blocks are constructed in service functions

3. **Token Design**:
   - sgUSD is the primary donation currency (stablecoin)
   - SUI native token also accepted
   - SG_SUI tokens used for internal fund distribution only

4. **Campaign Lifecycle**:
   - Campaigns auto-close when goal is reached
   - Failed campaigns allow beneficiary to claim partial funds
   - All donations generate NFT receipts for tax/tracking purposes