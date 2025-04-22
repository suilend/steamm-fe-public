# Technical Decisions

## Framework Choices
1. Next.js
   - Server-side rendering capabilities
   - Built-in routing
   - TypeScript support
   - API routes support

2. TailwindCSS
   - Utility-first approach
   - Easy customization
   - Good performance
   - Consistent styling

## State Management
1. React Context over Redux
   - Simpler implementation
   - Built into React
   - Sufficient for app needs
   - Better TypeScript integration

2. Custom Hooks Pattern
   - Reusable logic
   - Better testing
   - Separation of concerns
   - Consistent API

## Build Tools
1. Bun over npm/yarn
   - Better performance
   - Built-in bundler
   - TypeScript support
   - Package management

## Testing Strategy
1. Unit Tests
   - Critical utilities
   - Pure functions
   - Complex calculations

2. Integration Tests
   - Component interactions
   - User workflows
   - API integration

## Error Handling
1. Sentry Integration
   - Production monitoring
   - Error tracking
   - Performance monitoring
   - User session tracking

## Code Organization
1. Feature-based Structure
   - Better scalability
   - Clear boundaries
   - Easier maintenance
   - Module independence

## Performance Optimizations
1. Code Splitting
   - Route-based splitting
   - Component lazy loading
   - Dynamic imports
   - Bundle size optimization

## Suggestions Section 📝
- Consider adding state machine for complex flows
- Evaluate GraphQL for data fetching
- Consider adding E2E testing framework

## Token Metadata Storage (2024-03)

### Context
For the new token launch feature, we needed to decide on a solution for storing token metadata and images that would be:
1. Decentralized and persistent
2. Compatible with Sui's token standards
3. Cost-effective
4. Reliable with high availability

### Decision
We chose to use NFT.Storage for token metadata and image storage because:
1. It provides permanent storage backed by Filecoin and IPFS
2. It's free for public data
3. It's widely used in the blockchain space
4. It provides proper IPFS URIs that work well with token contracts
5. It has good developer tooling and documentation

### Alternatives Considered
1. **Centralized Storage (S3/CDN)**
   - Rejected due to centralization concerns
   - Would create single point of failure
   - Monthly costs could scale significantly

2. **Arweave**
   - Good permanent storage solution
   - Requires upfront payment
   - Less widely used in Sui ecosystem

3. **Pure IPFS (self-hosted)**
   - Would require maintaining own IPFS node
   - No guaranteed persistence
   - More complex infrastructure

### Implementation Notes
- Using `ipfs://` URI scheme for metadata and images
- Implementing proper error handling for upload failures
- Adding progress indicators for better UX
- Storing metadata in standardized JSON format

### Success Metrics
- Successful upload rate > 99%
- Metadata retrieval speed < 2s
- Zero data loss incidents
- Cost effectiveness (free tier sufficient for launch) 

## Token Creation Implementation (2024-04)

### Context
We needed to implement token creation functionality that follows Sui's one-time witness pattern. This presented a challenge since creating tokens in Sui requires:
1. Creating a Move module with proper naming conventions
2. Compiling this module to bytecode
3. Publishing the module to the blockchain

The compilation step traditionally requires the Sui CLI or a specialized backend service.

### Decision
We adopted a bytecode template approach where:
1. We use a pre-compiled Move module bytecode as a template
2. We dynamically update identifiers and constants in the bytecode using `@mysten/move-bytecode-template`
3. We directly publish the modified bytecode in a transaction

This approach was successfully used in our admin UI for creating LP tokens and has now been extended to general token creation.

### Alternatives Considered
1. **Server-side Compilation**
   - Would require a backend service
   - Additional infrastructure costs
   - More complex security considerations

2. **Limiting Token Creation to CLI**
   - Poor user experience
   - Requires technical knowledge
   - Limited adoption potential

3. **Using External Token Creation Services**
   - Dependency on third parties
   - Additional integration complexity
   - Potential fees for users

### Implementation Notes
- Base64-encoded bytecode template for efficiency
- Dynamic updates to module name, type name, token symbol, name, and description
- Proper error handling and transaction monitoring
- Success confirmation with transaction details

### Success Metrics
- Creation success rate > 98%
- Transaction processing time < 10s
- Bytecode size < 10KB
- No violations of Sui's one-time witness requirements 