# Architecture Overview

## Core Structure
- Next.js-based frontend application
- Sui blockchain integration via SDK
- Component-based architecture with strict separation of concerns

## Key Directories
- `/src/components`: Reusable UI components
- `/src/contexts`: React contexts for global state management
- `/src/hooks`: Custom React hooks for shared logic
- `/src/lib`: Core utilities and shared functions
- `/src/pages`: Next.js page components and routing
- `/src/styles`: Global styles and theming
- `/src/fetchers`: Data fetching and API integration
- `/sdk`: Sui blockchain interaction layer

## Page Structure
- Feature-based routing (`/swap`, `/pool`, `/portfolio`)
- Corresponding component directories for each route
- Shared UI components in `/components/ui`
- Feature-specific components in respective directories

## Component Organization
1. Page Components
   - Located in `/src/pages`
   - Handle routing and layout
   - Import feature components
   - Manage page-level state

2. Feature Components
   - Located in feature-specific directories
   - Contain business logic
   - Handle data fetching
   - Manage feature-specific state

3. Shared Components
   - Located in `/components/ui`
   - Reusable across features
   - Presentation-focused
   - Accept props for customization

## Core Patterns
- Server-side rendering with Next.js
- React Context for state management
- Custom hooks for blockchain interactions
- Component composition for UI building

## Data Flow
- Blockchain interactions handled through SDK layer
- State management via React Context
- Server-side data fetching for initial state
- Client-side updates for real-time data

## Security Considerations
- Environment variable management for sensitive data
- Client-side validation for transactions
- Error boundary implementation
- Rate limiting for API calls

## Performance Patterns
- Dynamic imports for code splitting
- Optimized blockchain interactions
- Memoization of expensive computations
- Image optimization via Next.js

## Blockchain Integration
- Sui SDK integration for transaction handling
- Wallet connection management
- Transaction signing and validation
- AMM contract interactions
- Token creation and management

## IPFS Integration

### Overview
The IPFS integration is handled through NFT.Storage, providing decentralized storage for token metadata and images. This integration is primarily used in the Pool Launcher feature.

### Components

#### IPFSUploader Component
- Handles file uploads to IPFS
- Provides progress feedback
- Validates file types and sizes
- Returns IPFS URIs for successful uploads

#### Metadata Structure
```json
{
  "name": "Token Name",
  "symbol": "TKN",
  "description": "Token description",
  "image": "ipfs://bafybeihsecbomd7sxfsnqwfzi57ajqqeh6ph4sfj4g4l4ycrbiboqsxrnq/image.png",
  "attributes": [
    {
      "trait_type": "Creator",
      "value": "address"
    },
    {
      "trait_type": "Total Supply",
      "value": "1000000"
    }
  ],
  "properties": {
    "files": [
      {
        "uri": "ipfs://bafybeihsecbomd7sxfsnqwfzi57ajqqeh6ph4sfj4g4l4ycrbiboqsxrnq/image.png",
        "type": "image/png"
      }
    ]
  }
}
```

### Flow
1. User selects image file
2. Image is uploaded to IPFS via NFT.Storage
3. Metadata JSON is created with image IPFS URI
4. Metadata JSON is uploaded to IPFS
5. Final IPFS URI is used in token contract

### Error Handling
- Retry logic for failed uploads
- Graceful fallback for network issues
- User feedback for all states
- Validation before upload

### Security Considerations
- File type validation
- Size limits
- Content verification
- Rate limiting

## New Feature Implementation
1. Page Creation
   - Add new page in `/src/pages`
   - Create corresponding component directory
   - Set up routing and layout
   - Add to navigation if needed

2. Component Structure
   - Create feature-specific directory
   - Implement core components
   - Reuse existing UI components
   - Add new shared components if needed

3. State Management
   - Create necessary contexts
   - Implement custom hooks
   - Set up data fetching
   - Handle blockchain interactions

## Suggestions Section 📝
- Consider implementing a global error handling system
- Evaluate adding a service worker for offline capabilities
- Consider implementing transaction queueing system
- Add TypeScript interfaces for token launch functionality 