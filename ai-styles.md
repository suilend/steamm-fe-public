# AI Code Style Guide

This document outlines the coding patterns, conventions, and architectural decisions to be followed when working with this codebase. This guide ensures consistency and maintains the existing patterns.

## Project Structure

### Directory Organization
- `frontend/` - Main application code
  - `src/`
    - `components/` - React components
    - `contexts/` - React context providers
    - `fetchers/` - Data fetching hooks and utilities
    - `hooks/` - Custom React hooks
    - `lib/` - Utility functions and constants
    - `pages/` - Next.js pages
    - `styles/` - CSS and styling files

### File Naming Conventions
- React components: PascalCase (e.g., `CoinInput.tsx`, `SubmitButton.tsx`)
- Hooks and utilities: camelCase with descriptive prefixes (e.g., `useFetchAppData.ts`, `useBreakpoint.ts`)
- Context files: PascalCase with 'Context' suffix (e.g., `AppContext.ts`)
- Type definitions: Placed in the same file as their usage or in dedicated type files

## TypeScript Patterns

### Type Definitions
1. Interface Naming:
   - Use PascalCase
   - Props interfaces end with 'Props' (e.g., `CoinInputProps`, `SubmitButtonProps`)
   - Data interfaces are descriptive of their content (e.g., `AppData`, `UserData`)

2. Type Usage:
   ```typescript
   interface ComponentProps {
     className?: ClassValue;  // Common pattern for styling
     children?: ReactNode;    // For components that accept children
     // Component-specific props
   }
   ```

### Type Exports
- Export interfaces and types that are used across multiple files
- Keep internal types local to their files
- Use explicit type annotations for function parameters and returns

## React Patterns

### Component Structure
1. Functional Components:
   ```typescript
   export default function ComponentName({ prop1, prop2 }: ComponentProps) {
     // Hooks at the top
     const { data } = useContext();
     
     // Business logic
     
     // Render
     return (
       // JSX
     );
   }
   ```

2. Props Pattern:
   - Use interface for props definition
   - Destructure props in function parameters
   - Document complex props with JSDoc comments

### Custom Hooks
1. Naming:
   - Prefix with 'use'
   - Descriptive of functionality (e.g., `useFetchAppData`, `useFetchUserData`)

2. Structure:
   ```typescript
   export default function useHookName(dependencies) {
     // Context/other hooks
     const { contextData } = useContext();

     // Data fetching/state management
     const dataFetcher = async () => {
       // Implementation
     };

     // SWR pattern for data fetching
     const { data, mutate } = useSWR<DataType>(
       key,
       dataFetcher,
       {
         refreshInterval: 30 * 1000,  // Common refresh interval
         onSuccess: (data) => {
           console.log("Refreshed data", data);
         },
         onError: (err) => {
           showErrorToast("Failed to refresh data", err);
           console.error(err);
         },
       }
     );

     return { data, mutateData: mutate };
   }
   ```

## Data Fetching Patterns

### SWR Usage
1. Common Configuration:
   - 30-second refresh interval for real-time data
   - Error handling with toast notifications
   - Console logging on success
   - Conditional fetching based on dependencies

2. Data Mutation:
   - Return `mutateData` for manual refresh
   - Use optimistic updates when applicable

### Error Handling
1. Toast Notifications:
   - Use `showErrorToast` for user-facing errors
   - Include both error message and technical details
   - Console.error for debugging

2. Error Recovery:
   - Graceful degradation when data is unavailable
   - Clear error messages to users
   - Retry mechanisms built into SWR

## State Management

### Context Usage
1. Context Structure:
   - Separate contexts by domain (e.g., App, User, Settings)
   - Provide both raw data and derived state
   - Include TypeScript types for context values

2. Context Consumption:
   - Use custom hooks to access context (e.g., `useAppContext`)
   - Handle undefined states explicitly
   - Memoize complex calculations

## Styling Patterns

### CSS and Styling
1. Utility-First Approach:
   - Use Tailwind CSS classes
   - Accept `className` prop for component customization
   - Use `cn()` utility for class name merging

2. Style Organization:
   - Component-specific styles in component files
   - Global styles in `styles/` directory
   - Use CSS modules when needed

## Performance Considerations

1. Data Fetching:
   - Use pagination where appropriate
   - Implement rate limiting with `pLimit`
   - Cache responses with SWR
   - Batch related requests when possible

2. Component Optimization:
   - Memoize expensive calculations
   - Use React.memo for pure components
   - Lazy load components when appropriate
   - Keep component file size under 300 lines

## Environment Handling

1. Configuration:
   - Use environment variables for configuration
   - Support different environments (dev, test, prod)
   - Clear distinction between client and server variables

2. Feature Flags:
   - Use environment variables for feature toggles
   - Clear documentation of feature flag impact
   - Fallback behavior when flags are not set

## Testing Guidelines

1. Test Coverage:
   - Unit tests for utility functions
   - Component tests for user interactions
   - Integration tests for data flow
   - Mock external services appropriately

2. Test Organization:
   - Co-locate tests with implementation
   - Use descriptive test names
   - Follow AAA pattern (Arrange, Act, Assert)

## Documentation

1. Code Documentation:
   - JSDoc for public APIs and complex functions
   - Inline comments for non-obvious logic
   - README files for directory-level documentation

2. Type Documentation:
   - Document complex types and interfaces
   - Include examples for non-obvious usage
   - Document breaking changes

## Best Practices

1. Code Organization:
   - Single responsibility principle
   - DRY (Don't Repeat Yourself)
   - Consistent file structure
   - Clear separation of concerns

2. Performance:
   - Optimize bundle size
   - Implement proper error boundaries
   - Use proper React hooks dependencies
   - Implement proper loading states

3. Security:
   - Validate user input
   - Sanitize data display
   - Handle sensitive data appropriately
   - Implement proper authentication checks

4. Accessibility:
   - Semantic HTML
   - ARIA labels where needed
   - Keyboard navigation support
   - Color contrast compliance