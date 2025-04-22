# Known Issues and Edge Cases

## Blockchain Interactions
- Transaction failures may occur due to network congestion
- Wallet connection can be lost during transactions
- Gas estimation may be inaccurate
- Price updates can be delayed

## State Management
- Race conditions in concurrent transactions
- Stale data after wallet operations
- Cache invalidation issues
- Context provider ordering matters

## Performance Issues
- Large token lists can cause rendering delays
- Multiple simultaneous transactions can slow UI
- Price feed updates can cause re-renders
- Initial load time with many LP positions

## UI/UX Considerations
- Wallet popup blockers
- Mobile wallet deep linking issues
- Network switching race conditions
- Token approval workflow clarity

## Error Handling
- Transaction timeout handling
- Network switch error recovery
- Failed transaction cleanup
- Wallet rejection handling

## Data Consistency
- Price feed synchronization
- Balance updates after transactions
- LP position calculations
- Token decimals handling

## Mobile-Specific Issues
- Wallet connection on iOS Safari
- Deep linking inconsistencies
- Touch event handling
- Viewport height calculations

## Browser Compatibility
- MetaMask mobile browser issues
- Safari private browsing limitations
- Local storage constraints
- Wallet extension conflicts

## Workarounds
1. Transaction failures:
   - Implement retry mechanism
   - Add fallback RPC nodes
   - Clear pending transactions

2. State management:
   - Use optimistic updates
   - Implement proper loading states
   - Add error boundaries

## Suggestions Section 📝
- Implement comprehensive error tracking
- Add automated testing for edge cases
- Create fallback UI states

## Token Creation
When creating custom tokens using our token creation feature, remember these important points:

1. **Initial Supply Minting**: After publishing the token module, a separate transaction is required to mint the initial supply. This is done automatically by calling the module's mint function with the TreasuryCap object obtained from publishing.

2. **Module Publishing and Minting**: Token creation requires two separate transactions - first publishing the Move module that defines the token, then minting the initial supply. This is necessary because the token type isn't known until after publication, so we can't reference it in the same transaction. While this requires two user signatures, our UI handles this automatically.

3. **Transaction Failures**: If the module publishing succeeds but minting fails, the token type will still exist but no tokens will be minted. Users can try minting again later.

4. **Token Module Names**: The module name is derived from the token symbol and must be a valid Move identifier (lowercase, no special chars except underscores).

5. **Package ID Extraction**: When working with newly published Move modules, the package ID can be extracted from the objectType of created objects (like TreasuryCap) rather than from transaction events. The objectType follows the format: `{packageId}::{moduleName}::ObjectType`.

6. **Module Name Consistency**: When interacting with a published module (e.g., for minting), extract the actual module name from the returned object types rather than recalculating it. The correct module name can be found as the second segment in the TreasuryCap's objectType: `{packageId}::{moduleName}::TreasuryCap<...>`.

7. **Token Type Structure**: For minting tokens, you need the correct package ID and module name which should be extracted from the token type, not the TreasuryCap object type. The token type follows this format: `{packageId}::{moduleName}::{TokenName}` and can be found within the TreasuryCap's object type as `TreasuryCap<{tokenType}>`.

8. **Minting Custom Tokens**: When minting tokens that follow the Sui Coin standard, use the standard library function `0x2::coin::mint` with type arguments and two arguments: TreasuryCap object and amount (as u64). The function returns a Coin object that must then be transferred to the recipient with a separate transfer command:
   ```typescript
   // After publishing the module, extract the token type from the TreasuryCap object type
   const tokenType = treasuryCapObjectType.split("<")[1]?.split(">")[0];
   
   // Create mint transaction
   const tx = new Transaction();
   
   // Mint tokens
   const mintedCoin = tx.moveCall({
     target: '0x2::coin::mint',
     arguments: [tx.object(treasuryCapId), tx.pure.u64(amount)],
     typeArguments: [tokenType]
   });
   
   // Transfer to recipient in the same transaction
   tx.transferObjects([mintedCoin], recipientAddress);
   ``` 