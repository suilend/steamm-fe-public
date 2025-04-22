# Styling Patterns and Conventions

## Core Styling Approach
- TailwindCSS as primary styling solution
- CSS Modules for complex components
- Global styles in `src/styles`
- Component-specific styles co-located

## Design System
1. Colors
   - Primary: Brand colors
   - Secondary: Accent colors
   - Semantic: Success, error, warning
   - Neutral: Grays, backgrounds

2. Typography
   - Font families: System fonts
   - Scale: Tailwind defaults
   - Weights: 400, 500, 600, 700
   - Line heights: Responsive

3. Spacing
   - Base unit: 4px
   - Scale: Tailwind defaults
   - Responsive breakpoints
   - Container widths

## Component Patterns
1. Layout Components
   - Container
   - Grid
   - Stack
   - Flex

2. Form Components
   - Input
   - Button
   - Select
   - Checkbox

3. Card Components
   - Card: `rounded-lg border border-border bg-card text-card-foreground shadow-sm`
   - CardHeader: `flex flex-col space-y-1.5 p-6`
   - CardTitle: `text-2xl font-semibold leading-none tracking-tight`
   - CardDescription: `text-sm text-muted-foreground`
   - CardContent: `p-6 pt-0`
   - CardFooter: `flex items-center p-6 pt-0`

4. Feedback Components
   - Alert
   - Toast
   - Modal
   - Loading

## Responsive Design
- Mobile-first approach
- Breakpoint system
- Fluid typography
- Flexible layouts

## Animation Guidelines
- Transitions: 150-300ms
- Easing functions
- Loading states
- Hover effects

## Dark Mode
- System preference detection
- Color palette adaptation
- Component variants
- UI element contrast

## Accessibility
- ARIA labels
- Color contrast
- Keyboard navigation
- Focus management

## Best Practices
- Consistent class ordering
- Component composition
- Responsive patterns
- State management

## Progress Indicators

### Horizontal Step Indicators

For multi-step processes like wizards or sequential forms, we use a horizontal step indicator with connected circles/dots:

```tsx
<div className="flex w-full max-w-md flex-col items-center gap-6 pt-4">
  <div className="relative flex w-full max-w-[240px] items-center justify-between">
    {/* Step indicator with circles and connecting line */}
    <div className="flex flex-col items-center">
      <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-[color] bg-[bg-color] text-[text-color]">
        {/* Content: number, spinner, or checkmark */}
      </div>
      <span className="mt-2 text-xs text-secondary-foreground">Step Label</span>
    </div>

    {/* Connecting line */}
    <div className="absolute left-0 top-5 h-[2px] w-full -translate-y-1/2 bg-[color]"></div>

    {/* Additional steps... */}
  </div>
</div>
```

States for step indicators:
- Pending: `border-border bg-background` with step number
- Active: `border-foreground bg-foreground text-background` with spinner
- Completed: `border-success bg-success text-background` with checkmark
- Error: `border-error bg-error text-background` with X icon

This pattern is mobile-friendly and provides clear visual feedback for the current step in a process. It's used in components like `TokenCreationStatus` and aligns with the `LaunchStepper` design language.

## Color System Standardization
- Always use theme color variables instead of direct color utility classes
- Semantic color usage:
  - `text-success` for positive indicators and success messages
  - `text-error` for error messages and destructive actions
  - `text-warning` for warnings and caution indicators
  - `border-error` for highlighting invalid form inputs
  - `bg-success` for success state backgrounds
- Status indicators should use consistent colors:
  - Success: `text-success`, `bg-success`
  - Error: `text-error`, `bg-card border-error`
  - Pending/Processing: `animate-spin border-secondary border-t-primary`
- Form validation error messaging should use `text-error`
- Never use raw color classes like `text-red-500` or `bg-green-500` directly

### Example for Success State
```tsx
<div className="flex items-center gap-2">
  <CheckCircle className="h-5 w-5 text-success" />
  <span>Operation completed successfully</span>
</div>
```

### Example for Error State
```tsx
<div className="max-w-md rounded-md bg-card p-4 text-left text-sm border border-error">
  <p className="font-semibold">Error details:</p>
  <p className="mt-1 break-words text-error">{errorMessage}</p>
</div>
```

## Suggestions Section 📝
- Consider adding CSS-in-JS solution
- Implement design token system
- Add component documentation 