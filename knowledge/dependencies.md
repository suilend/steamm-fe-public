# Dependencies Overview

## Core Dependencies
- Next.js: Frontend framework
- React: UI library
- TailwindCSS: Styling framework
- @mysten/sui.js: Sui blockchain SDK
- @suilend/sdk: Lending protocol SDK

## Blockchain Dependencies
- Sui Network: Main blockchain platform
- Sui Wallet: For transaction signing
- AMM Smart Contracts: Core protocol contracts

## Development Dependencies
- TypeScript: Static typing
- ESLint: Code linting
- Prettier: Code formatting
- Sentry: Error tracking

## External Services
- Sui RPC Nodes: Blockchain interaction
- Price Feeds: Token price data
- Analytics: User tracking

## Version Requirements
- Node.js: >=18.x
- Bun: Latest version
- Sui SDK: Compatible with mainnet

## Critical Packages
- @mysten/sui.js: Core blockchain interactions
- @suilend/sdk: Protocol-specific functions
- @pythnetwork/pyth-sui-js: Price oracle integration

## Environment Variables
Required in `.env.local`:
- NEXT_PUBLIC_SUI_NETWORK
- NEXT_PUBLIC_SUI_RPC_URL
- NEXT_PUBLIC_ANALYTICS_ID

## Build Dependencies
- postcss: CSS processing
- autoprefixer: CSS compatibility
- tailwindcss: Utility CSS

## Suggestions Section 📝
- Consider adding fallback RPC nodes
- Evaluate adding offline capability packages
- Consider adding type checking for env variables 