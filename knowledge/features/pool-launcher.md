# Pool Launcher Feature Implementation Plan

## Overview
A new feature allowing users to create Sui tokens and launch STEAMM liquidity pools in a streamlined process.

## Technical Prerequisites Review
✓ Existing pool creation code reviewed in `/src/components/pool/PoolActionsCard.tsx` and `/src/components/admin/pools/CreatePoolCard.tsx`
✓ Reusable form components identified:
  - `TextInput.tsx` for general text input
  - `PercentInput.tsx` for percentage inputs
  - `CoinInput.tsx` for token amount inputs
  - `SubmitButton.tsx` for form submission
  - `Parameter.tsx` for form field layout
  - `Dialog.tsx` for modals
❌ IPFS integration with NFT.Storage documented in architecture.md but not yet implemented
✓ Navigation patterns consistent with existing routes
✓ Mobile-friendly UI patterns implemented across all components
✓ Direct entry to Pool creation with existing tokens implemented

## Implementation Checklist

### 1. Project Setup (Completed)
- [x] Create new route `/launch` (confirmed as public feature)
- [x] Set up component directory structure:
  ```
  /src/components/launch/
  ├── TokenCreationForm/
  │   ├── index.tsx
  │   ├── validation.ts
  ├── TokenBasicInfo/
  │   ├── index.tsx  
  ├── TokenAdvancedOptions/
  │   ├── index.tsx
  ├── TokenCreationConfirmDialog.tsx
  ├── TokenCreationStatus.tsx
  ├── LaunchStepper.tsx
  ```
- [x] Add route to main navigation
- [x] Implement responsive UI for mobile and desktop

### 2. Token Creation Form (Completed)
- [x] Create stepper component using existing UI patterns
- [x] Implement token creation form using existing form components:
  - [x] Use `TextInput` for name and symbol
  - [x] Use `CoinInput` for supply amount
  - [x] Use `Parameter` for form layout
- [x] Token name input with validation
  - [x] Required field
  - [x] Min/max length validation
- [x] Symbol input with validation
  - [x] Required field
  - [x] Uppercase only
- [x] Supply input with BigNumber handling
  - [x] Reuse `TextInput` component
- [x] Optional fields
  - [x] Description (with markdown support)
- [x] Token configuration options
  - [x] Maximum Supply
  - [x] Burnable toggle
  - [x] Mintable toggle
  - [x] Pausable toggle
  - [x] Upgradeable toggle

### 3. Token Creation Functionality (Completed)
- [x] Implement form validation enhancements
  - [x] Special character restrictions for name
  - [x] 2-6 character limits for symbol
  - [x] No special chars except $ for symbol
  - [x] Maximum supply validation
  - [x] Format with proper decimals
- [x] Create token deployment hook
  - [x] Handle transaction building
  - [x] Manage gas estimation
  - [x] Handle transaction signing
- [x] Implement transaction status handling
  - [x] Show progress indicators
  - [x] Handle success/failure states
  - [x] Provide transaction links
- [x] Add confirmation dialog
  - [x] Show transaction details
  - [x] Display fee estimates
  - [x] Request user approval
- [x] Create success/failure states
  - [x] Show completion messages
  - [x] Provide next steps
  - [x] Display transaction links
- [x] Add transaction error handling
  - [x] Show user-friendly messages
  - [x] Provide retry options
  - [x] Log detailed errors
- [x] Implement mobile-responsive design
  - [x] Responsive typography with sm: breakpoints
  - [x] Stacked button layouts on mobile
  - [x] Full-width inputs and buttons on small screens
  - [x] Proper spacing and margins for all screen sizes
- [x] Ensure styling consistency with application patterns
  - [x] Use Button component from UI library
  - [x] Consistent spacing and typography
  - [x] Match existing dialog patterns

### 4. Current Priority: Integrate Pool Creation into Launch Flow
- [x] Complete the launch flow integration
  - [x] Update launch.tsx to include the PoolCreationForm component for step 3
  - [x] Handle transition from token creation success to pool creation step
  - [x] Add success handling for pool creation
  - [x] Implement navigation between all steps
- [ ] Enhance pool creation experience
  - [x] Add pre-selection of created token in pool form
  - [x] Display token details in the pool creation step
  - [ ] Handle pool creation errors and retries
  - [x] Add success screen after pool creation
- [x] Improve session persistence for complete flow
  - [x] Store pool creation parameters in sessionStorage
  - [x] Add recovery for interrupted pool creation
  - [x] Clear all session data on final completion
  - [x] Add ability to start a new process after completion
- [x] Complete end-to-end testing
  - [x] Test the entire flow from token creation to pool creation
  - [x] Verify session persistence works across all steps
  - [x] Test error recovery and edge cases

### 5. Next Priority: UI/UX Enhancements
- [x] Add loading states and transitions
  - [x] Implement skeleton loaders for data-dependent components
- [x] Enhance form validation feedback
  - [x] Show inline validation messages
  - [x] Add field highlighting for errors
  - [x] Provide tooltip help for complex fields
- [x] Implement better mobile adaptations
  - [x] Optimize token selection on small screens
  - [x] Improve touch targets for mobile
  - [x] Adapt complex parameter sections for small screens

### 6. Future Implementation: Image Upload and IPFS Integration
- [ ] Implement IPFS integration with NFT.Storage as described in architecture.md
- [ ] Create IPFSUploader component
- [ ] Token logo upload with preview
  - [ ] Add image size/format validation
  - [ ] Show upload progress
- [ ] Add token metadata storage logic
  - [ ] Store metadata JSON on IPFS
  - [ ] Generate and store proper IPFS URIs
  - [ ] Implement retry logic
- [ ] Handle IPFS upload failures
  - [ ] Implement retry logic
  - [ ] Show upload progress
  - [ ] Provide fallback options
- [ ] Add IPFS upload progress indicators
  - [ ] Show file upload progress
  - [ ] Display processing status
  - [ ] Indicate completion

### 7. Testing & Documentation
- [ ] Add inline code documentation
  - [ ] Document complex logic
  - [ ] Explain validation rules
  - [ ] Note important flows
- [ ] Unit tests for form validation
  - [ ] Test all validation rules
  - [ ] Check error messages
  - [ ] Verify field interactions
- [ ] Integration tests for token creation
  - [ ] Test full token creation flow
  - [ ] Verify transaction handling
- [ ] E2E tests for full launch flow
  - [ ] Test complete user journey
  - [ ] Verify all success paths
  - [ ] Check error handling

## Metadata Structure (For Future IPFS Integration)
```json
{
  "name": "Token Name",
  "symbol": "TKN",
  "description": "Token description",
  "image": "ipfs://<CID>/logo.png",
  "decimals": 9,
  "properties": {
    "website": "https://...",
    "socials": {
      "twitter": "...",
      "telegram": "..."
    }
  }
}
```

## Success Criteria
1. Users can successfully create new tokens
   - Correct token configuration
   - Transaction success
2. Tokens are properly configured
   - Proper name and symbol
   - Correct supply amounts
   - Configured with selected features (burnable, mintable, etc.)
3. Pool creation works with new tokens
   - Correct liquidity addition
   - Proper fee configuration
   - Valid token pair setup
   - Ability to use existing tokens
   - Session persistence across page navigations
4. UI matches existing application style
   - ✓ Consistent components
   - ✓ Proper form layout
   - ✓ Clear navigation
   - ✓ Mobile-friendly design
   - ✓ Responsive layouts
5. All error cases are handled gracefully
   - ✓ Clear error messages
   - ✓ Recovery options
   - ✓ Data persistence
6. Tests pass and cover critical paths
   - Unit test coverage
   - Integration test coverage
   - E2E test coverage

## Dependencies
- Existing pool creation code in `CreatePoolCard.tsx`
- Form components from `/src/components/`
  - `TextInput.tsx`
  - `Parameter.tsx`
  - UI components from `/src/components/ui/`
    - `Button`
    - `Switch`
    - `Dialog`
    - `Separator`
    - `Card` and related components
- Sui SDK for token creation
- Navigation system
- Mobile responsive design utility hooks (`useBreakpoint`)

## Suggestions 📝
- Consider adding token verification system
- Add token/pool templates for common use cases
- Implement token/pool creation preview
- Add guided mode for new users
- Consider implementing metadata validation service
- Add token symbol availability check
- Consider adding token/pool creation templates
- Implement automatic fee tier suggestions based on token types
- Add token verification badge system
- Consider implementing a token launch checklist
- Add tooltip explanations for complex pool parameters like quoters and fee tiers

## Technical Implementation Notes

### State Persistence Strategy
To implement the flexible entry points and session persistence:

1. **Token Creation State**
   - Store token creation progress in localStorage with a unique session ID
   - Save all form inputs after each step completion
   - Include created token data (token type, treasury cap ID) when available
   - Implement automatic cleanup of stale data (older than 24 hours)

2. **Direct Pool Creation Entry**
   - Add URL parameter support (e.g., `/launch?step=pool-creation`)
   - Implement token selector component showing user's wallet tokens
   - Filter tokens by those created by the user
   - Display token metadata (name, symbol, supply) in selection UI

3. **Recovery Flow**
   - Check for existing session data on page load
   - Allow users to resume from their last completed step
   - Provide option to start fresh if desired
   - Handle edge cases (e.g., token created but page closed before status shown)

4. **UX Considerations**
   - Clear visual indication of which step user is resuming from
   - Option to view newly created token details before proceeding to pool creation
   - Intuitive navigation between token creation and pool creation 

### Component Structure Updates
The feature now includes the following new components:

1. **Card Components for UI Consistency**
   - `Card`: Container with consistent styling for content sections
   - `CardHeader`: Header section with standardized spacing
   - `CardTitle`: Standardized title styling
   - `CardDescription`: Subtitle/description text with consistent styling
   - `CardContent`: Main content area with consistent padding
   - `CardFooter`: Footer section for action buttons

2. **Pool Creation Components**
   - `PoolCreationForm`: Wrapper component that applies Card styling to existing CreatePoolCard component
   - Maintains session data for token types created in previous steps

### Mobile UI Enhancements
The feature's mobile adaptations include:

1. **Responsive Token Selection**
   - Token selection components redesigned for touch-friendly interfaces
   - Optimized layout that stacks vertically on small screens
   - Condensed token information display for small screens

2. **Improved Parameter Controls**
   - Fee tier selection presented in a grid format on mobile
   - Touch-friendly buttons with appropriate sizing for mobile
   - Visual indicators to show selected options clearly

3. **Form Layout Adaptations**
   - Full-width inputs and controls on small screens
   - Reduced padding and spacing for mobile views
   - Stack controls vertically that appear side-by-side on desktop 

## Comprehensive Mobile Experience Improvements

Our enhanced mobile experience focuses on creating a seamless and user-friendly interface across all devices. We've implemented the following improvements throughout the entire launch flow:

### 1. LaunchStepper Component
- Simplified mobile stepper with progress indicators
- Current step clearly highlighted on mobile with numerical indicators
- Compact step description display for small screens
- Touch-friendly navigation between completed steps

### 2. TokenBasicInfo Component
- Larger input fields (height increased from 10px to 12px on mobile)
- Increased text size for better readability on mobile
- Optimized tooltip positioning for touch devices
- Improved spacing between form elements
- Better visual feedback with success/error indicators
- Properly sized action buttons for touch targets (min 44px touch targets)

### 3. TokenAdvancedOptions Component
- Redesigned toggle UI for mobile with:
  - Column layout for toggle options on small screens
  - Additional descriptive text visible only on mobile
  - Larger touch targets for switches (44px minimum)
  - Entire toggle card clickable to improve touch usability
- Better button layout for mobile:
  - Stacked buttons on small screens
  - Full-width buttons with proper sizing
  - Increased vertical spacing between elements

### 4. TokenCreationConfirmDialog Component
- Mobile-optimized layout with stacked content
- Larger buttons in a column layout on mobile 
- Improved spacing and padding for small screens
- Enhanced token property display for better readability
- Larger checkboxes and interactive elements

### 5. PoolCreationForm Component
- Better card layout with appropriate margins for small screens
- Improved back button with larger touch target area
- Enhanced pool details display with:
  - Stacked label-value pairs on mobile
  - Better text formatting for readability
  - Monospace font for pool addresses with proper wrapping
- Mobile-friendly success screen with proper spacing

### 6. CreatePoolCard Adaptations
- Token selection UI redesigned for mobile with:
  - Full-width selectors with clear visual focus
  - Simplified token information display
  - Touch-friendly balance selection
- Fee tier selection in a responsive grid:
  - 2-column grid on mobile, 4-column on desktop
  - Clear visual indication of selected tier
  - Appropriately sized buttons for touch interaction
- Input controls with better touch ergonomics

### 7. Global Mobile Enhancements
- Responsive typography that scales appropriately
- Consistent spacing and alignment across all components
- Skeleton loaders properly sized for mobile displays
- Improved error message display for small screens
- Better button ordering for one-handed mobile operation
- Appropriate font sizes across all screens (larger on mobile)
- Improved validation feedback that's clearly visible on small screens

These improvements create a consistent, touch-friendly experience across the entire token creation and pool launch flow, making the application fully usable on mobile devices without sacrificing functionality or visual appeal. 