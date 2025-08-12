# Contributing to Ark Dumpster

## 🎯 Code Standards

### Code Style

- **Prettier**: Automatic code formatting on save
- **ESLint**: Strict rules with TypeScript integration
- **TypeScript**: Strict mode with comprehensive type safety
- **Imports**: Absolute imports with `@/` prefix

### Component Guidelines

```typescript
// ✅ Good: Proper TypeScript interface
interface QuoteFormProps {
  onSubmit: (data: QuoteData) => void;
  initialData?: Partial<QuoteData>;
}

// ✅ Good: Descriptive component names
export function QuoteManagementTable({ quotes }: Props) {
  // Component logic
}

// ❌ Bad: Missing types
export function Table({ data }) {
  // Component logic
}
```

### Naming Conventions

- **Components**: PascalCase (`QuoteForm`, `AdminDashboard`)
- **Files**: kebab-case (`quote-form.tsx`, `admin-dashboard.tsx`)
- **Variables**: camelCase (`quoteData`, `isLoading`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`, `MAX_FILE_SIZE`)

## 🔄 Development Workflow

### Branch Strategy

```bash
main              # Production-ready code
├── develop       # Integration branch
├── feature/*     # New features
├── bugfix/*      # Bug fixes
└── hotfix/*      # Critical production fixes
```

### Commit Messages

```bash
# Format: type(scope): description

feat(admin): add quote bulk actions
fix(email): resolve template escaping issue
docs(readme): update installation guide
style(components): format with prettier
refactor(api): optimize database queries
test(quotes): add form validation tests
```

## 🧪 Testing Guidelines

### Test Structure

```typescript
// ✅ Good: Descriptive test names
describe('QuoteForm', () => {
  it('should validate required fields before submission', () => {
    // Test implementation
  });

  it('should display success message after successful submission', () => {
    // Test implementation
  });
});
```

### Coverage Requirements

- **Components**: 80% minimum
- **Utilities**: 90% minimum
- **API Routes**: 85% minimum
- **Business Logic**: 95% minimum

## 📦 Adding Dependencies

### Before Adding a Package

1. Check if functionality exists in current dependencies
2. Evaluate bundle size impact
3. Check maintenance status and community support
4. Consider tree-shaking compatibility

### Preferred Packages

- **UI**: Radix UI primitives with shadcn/ui
- **Icons**: Lucide React or Tabler Icons
- **State**: React built-in hooks, Context API
- **Forms**: React Hook Form with Zod validation
- **HTTP**: Native fetch with proper error handling

## 🚀 Performance Guidelines

### Component Optimization

```typescript
// ✅ Good: Proper memoization
const ExpensiveComponent = memo(({ data }: Props) => {
  const processedData = useMemo(() =>
    heavyComputation(data), [data]
  );

  return <div>{processedData}</div>;
});

// ✅ Good: Debounced API calls
const useSearchQuotes = () => {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  // API call with debounced query
};
```

### Bundle Size Optimization

- Tree-shake unused imports
- Use dynamic imports for heavy components
- Optimize images with Next.js Image component
- Monitor bundle size with analyzer

## 🔐 Security Guidelines

### Data Validation

```typescript
// ✅ Good: Input validation
const quoteSchema = z.object({
  customerName: z.string().min(1).max(100),
  email: z.string().email(),
  dumpsterSize: z.enum(['10', '20', '30', '40']),
});
```

### Environment Variables

- Never commit `.env.local` files
- Use descriptive variable names
- Validate required environment variables at startup
- Use different values for different environments

## 📚 Documentation

### Code Documentation

```typescript
/**
 * Calculates quote pricing based on dumpster size and duration
 * @param size - Dumpster size in cubic yards
 * @param duration - Rental duration in days
 * @param location - Delivery location for distance calculation
 * @returns Calculated quote with base price and additional fees
 */
export function calculateQuotePrice(
  size: DumpsterSize,
  duration: number,
  location: Location
): QuoteCalculation {
  // Implementation
}
```

### Component Documentation

- Add JSDoc comments for complex components
- Include usage examples in component files
- Document prop interfaces thoroughly
- Add accessibility considerations

## 🎨 UI/UX Guidelines

### Design System

- Follow shadcn/ui design patterns
- Maintain consistent spacing (Tailwind scale)
- Use semantic HTML elements
- Implement proper ARIA attributes

### Responsive Design

- Mobile-first approach
- Test on multiple screen sizes
- Ensure touch-friendly interactions
- Optimize for both desktop and mobile workflows

## 🔧 Development Tools

### Required Setup

```bash
# Install dependencies
npm install

# Setup development environment
cp .env.example .env.local

# Run development server
npm run dev

# Format code
npm run format

# Check types
npm run type-check
```

### Recommended VS Code Extensions

- TypeScript Hero
- Prettier - Code formatter
- ESLint
- Tailwind CSS IntelliSense
- Auto Rename Tag
- GitLens
