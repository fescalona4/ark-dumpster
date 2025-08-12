# Code Architecture Documentation

## 🏗️ System Architecture

### Application Layers

```
┌─────────────────────────────────────┐
│              UI Layer               │
│  (React Components, Pages, Layouts) │
├─────────────────────────────────────┤
│            Business Logic           │
│    (Custom Hooks, Services)        │
├─────────────────────────────────────┤
│            Data Layer               │
│     (Supabase, API Routes)         │
├─────────────────────────────────────┤
│          External Services          │
│   (Email, Google Places, Proxy)    │
└─────────────────────────────────────┘
```

## 🔄 Data Flow Patterns

### Quote Management Flow

1. **User Input** → Form validation → Client-side state
2. **API Call** → Server validation → Database operation
3. **Response** → UI update → Toast notification
4. **Email** → Customer notification → Admin alert

### Authentication Flow

1. **Supabase Auth** → Session management → Route protection
2. **Admin Access** → Role validation → Dashboard access

## 🎯 Design Patterns Used

### Component Patterns

- **Compound Components**: Complex UI components with sub-components
- **Render Props**: Flexible component composition
- **Custom Hooks**: Reusable stateful logic
- **Provider Pattern**: Context-based state management

### Data Patterns

- **Repository Pattern**: Database operations abstraction
- **Service Layer**: Business logic separation
- **Error Boundaries**: Graceful error handling
- **Optimistic Updates**: Immediate UI feedback

## 🔐 Security Architecture

### Client-Side Security

- Input validation and sanitization
- XSS prevention with proper escaping
- CSRF protection via SameSite cookies
- Content Security Policy headers

### Server-Side Security

- Row Level Security (RLS) in Supabase
- Environment variable protection
- API rate limiting
- Request validation middleware

### Network Security

- Corporate proxy support
- HTTPS enforcement
- Secure cookie configuration
- CORS policy management

## 📊 Performance Optimizations

### Build Optimizations

- **Turbopack**: Lightning-fast development builds
- **Code Splitting**: Automatic route-based splitting
- **Tree Shaking**: Dead code elimination
- **Image Optimization**: Next.js automatic optimization

### Runtime Optimizations

- **React Suspense**: Loading state management
- **Memoization**: Component and computation caching
- **Virtual Scrolling**: Large dataset handling
- **Debounced Inputs**: API call optimization

## 🧪 Testing Strategy

### Testing Pyramid

```
        ┌─────────────┐
        │     E2E     │ ← Integration tests
        ├─────────────┤
        │ Integration │ ← Component tests
        ├─────────────┤
        │    Unit     │ ← Function tests
        └─────────────┘
```

### Coverage Areas

- **Components**: UI behavior and rendering
- **Hooks**: Custom logic and state management
- **Services**: Business logic and API calls
- **Utils**: Pure function correctness
