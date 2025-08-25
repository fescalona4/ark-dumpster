# 🚛 ARK Dumpster Rentals

A modern, full-stack web application for dumpster rental services built with Next.js 15, TypeScript, and Supabase. Features a professional customer-facing website with integrated analytics, comprehensive admin dashboard, and complete business management tools.

## ✨ Features

### 🌐 Customer Experience

- **Modern Landing Page** - Professional homepage with animated stats and service information
- **Interactive Quote System** - Smart form with Google Places autocomplete and validation
- **Calendar Integration** - Advanced date picker with availability checking
- **Email Notifications** - Automated confirmations via Resend API with professional templates
- **Responsive Design** - Mobile-first approach with dark/light mode support
- **Service Pages** - Detailed information about dumpster rental services
- **Interactive Maps** - Google Maps integration for service area visualization
- **Professional Email Templates** - React-based email designs with company branding

### 🔧 Admin Dashboard

- **Modern Interface** - Clean dashboard with shadcn/ui components and unified navigation
- **Comprehensive Quote Management** - Create, view, edit, update, and track all customer quotes
- **Advanced Data Tables** - Interactive tables with drag-and-drop sorting, filtering, and pagination
- **Order Management** - Full order lifecycle tracking and management
- **Dumpster Inventory** - Track available dumpsters and locations via interactive maps
- **Invoice System** - Generate and manage customer invoices
- **Real-time Analytics** - Live stats cards with business metrics and performance tracking
- **Interactive Charts** - Visual analytics with Recharts for business insights and trends
- **Website Analytics** - Comprehensive visitor tracking with geolocation and device analytics
- **Smart Dialogs** - Confirmation dialogs for all destructive operations
- **Theme System** - Dark/light mode with next-themes integration
- **User Management** - Supabase auth integration with user profiles and security

### 🗄️ Database & Backend

- **Supabase Integration** - PostgreSQL database with Row Level Security and real-time capabilities
- **Advanced Data Models** - Comprehensive quotes, orders, dumpsters, and analytics tables
- **Website Analytics** - Visitor tracking with geolocation, device detection, and session management
- **Dual Email System** - Customer notifications + company alerts via Resend
- **Environment-based Controls** - Development email skip functionality
- **Corporate Proxy Support** - Undici proxy agent for enterprise environments
- **Type Safety** - Full TypeScript coverage with generated database types
- **Image Management** - Optimized image handling and proxy support

### 🛠️ Developer Experience

- **Clean Architecture** - Well-organized component structure and API routes
- **ESLint Configuration** - Production-ready linting with custom rules
- **Zero Unused Dependencies** - Optimized package.json (41 packages)
- **Type Safety** - Comprehensive TypeScript implementation
- **Build Optimization** - Next.js 15 with Turbopack for fast development

## 🚀 Tech Stack

- **Framework**: Next.js 15.4.5 (App Router with Turbopack)
- **Language**: TypeScript 5.x with strict configuration
- **Styling**: Tailwind CSS 4.x with custom animations
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Database**: Supabase (PostgreSQL with RLS and real-time)
- **Email**: Resend API with React Email templates
- **Charts**: Recharts for analytics visualization
- **Icons**: Lucide React, Tabler Icons, Remix Icons
- **Animation**: Framer Motion for smooth interactions
- **Forms**: React Hook Form with Zod validation
- **Data Tables**: TanStack Table with drag-and-drop
- **Date Picker**: React Day Picker with date-fns
- **Authentication**: Supabase Auth
- **Maps**: Google Maps API with custom styling
- **Analytics**: Custom analytics system with geolocation
- **Proxy Support**: Undici for corporate environments
- **Performance**: Vercel Speed Insights
- **Fonts**: Manrope (Google Fonts)
- **Development**: Bundle Analyzer, ESLint, Prettier

## 📁 Project Structure

```
ark-dumpster/
├── app/                    # Next.js App Router
│   ├── admin/             # Admin dashboard
│   │   ├── layout.tsx     # Admin layout with sidebar + unified header
│   │   ├── page.tsx       # Dashboard with analytics and data table
│   │   ├── analytics/     # Comprehensive analytics dashboard
│   │   ├── quotes/        # Quote management system
│   │   ├── orders/        # Order management and tracking
│   │   ├── dumpsters/     # Inventory management with maps
│   │   ├── invoices/      # Invoice generation and management
│   │   └── create/        # Admin quote creation form
│   ├── contact/           # Customer contact/quote form
│   ├── services/          # Service information pages
│   ├── about/             # About us page
│   ├── email-preview/     # Email template preview (dev tool)
│   └── api/               # API routes
│       ├── send/          # Email sending endpoint
│       ├── config/        # Environment configuration
│       ├── proxy/         # General proxy utility
│       ├── test-proxy/    # Proxy testing (dev only)
│       ├── image-proxy/   # Image optimization proxy
│       ├── storage-list/  # Storage management
│       └── supabase-proxy/ # Corporate proxy support
├── components/            # Reusable UI components
│   ├── ui/               # shadcn/ui base components (30+ components)
│   ├── admin/            # Admin-specific components
│   ├── analytics/        # Analytics components and charts
│   ├── data-tables/      # Advanced table components
│   ├── dialogs/          # Dialog and modal components  
│   ├── email/            # Email template components
│   ├── forms/            # Form components and validation
│   ├── invoices/         # Invoice-related components
│   ├── layout/           # Layout and navigation components
│   ├── maps/             # Google Maps integration
│   ├── navigation/       # Navigation components
│   ├── providers/        # Context providers and auth guards
│   └── shared/           # Shared utility components
├── lib/                  # Utility functions and services
│   ├── supabase.ts       # Database client with proxy support
│   ├── supabase-server.ts # Server-side client
│   ├── database-service.ts # Database operations
│   ├── email-service.ts  # Email service with dual notifications
│   ├── analytics.ts      # Analytics tracking and data fetching
│   ├── image-loader.ts   # Image optimization
│   ├── constants.ts      # Application constants
│   └── utils.ts          # Utility functions
├── hooks/                # Custom React hooks
│   ├── use-mobile.ts     # Mobile detection
│   ├── use-toast.tsx     # Toast notifications
│   └── useAnalytics.ts   # Analytics tracking hooks
├── docs/                 # Documentation
│   ├── ARCHITECTURE.md   # System architecture overview
│   ├── PROXY_SECURITY.md # Proxy configuration guide
│   ├── DUMPSTER_MAP_SETUP.md # Maps setup documentation
│   ├── INVOICE_SYSTEM.md # Invoice system documentation
│   └── google-places-setup.md # Google Places API setup
├── supabase/             # Database migrations and scripts
│   ├── 002_create_quotes_table.sql
│   ├── orders-table.sql
│   ├── create-dumpsters-table.sql
│   ├── create-visits-table.sql
│   ├── insert_dummy_quotes.sql
│   ├── sample-visits-data.sql
│   └── README.md
├── types/                # TypeScript type definitions
│   ├── dumpster.ts       # Dumpster-related types
│   └── order.ts          # Order-related types
└── test-supabase.js      # Database connection test script
```

## 🛠️ Installation & Setup

### Prerequisites

- Node.js 18+
- npm/yarn/pnpm
- Supabase account
- Resend account (for email)

### 1. Clone & Install

```bash
git clone https://github.com/fescalona4/ark-dumpster.git
cd ark-dumpster
npm install
```

### 2. Environment Variables

Create `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Email (Resend)
RESEND_API_KEY=your_resend_api_key

# Google Maps (Optional - for maps functionality)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### 3. Database Setup

1. Create a new Supabase project
2. Run the core migration: `supabase/002_create_quotes_table.sql`
3. Set up additional tables:
   - Orders: `supabase/orders-table.sql`
   - Dumpsters: `supabase/create-dumpsters-table.sql`
   - Analytics: `supabase/create-visits-table.sql`
4. (Optional) Add sample data:
   - Quotes: `supabase/insert_dummy_quotes.sql`
   - Analytics: `supabase/sample-visits-data.sql`

### 4. Google Maps Setup (Optional)

For maps functionality, follow the setup guide in `docs/google-places-setup.md`

### 4. Run Development Server

```bash
npm run dev
```

Visit:

- **Website**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3000/admin
- **Quote Form**: http://localhost:3000/contact
- **Analytics**: http://localhost:3000/admin/analytics
- **Dumpster Management**: http://localhost:3000/admin/dumpsters

## 📊 Database Schema

### Core Tables

#### Quotes Table

```sql
quotes {
  id: UUID (Primary Key)
  first_name: VARCHAR
  last_name: VARCHAR
  email: VARCHAR
  phone: VARCHAR
  address: VARCHAR
  city: VARCHAR
  state: VARCHAR
  zip_code: VARCHAR
  dumpster_size: VARCHAR
  dropoff_date: VARCHAR
  time_needed: VARCHAR
  message: TEXT
  status: ENUM (pending, quoted, accepted, declined, completed)
  quoted_price: NUMERIC
  quote_notes: TEXT
  priority: ENUM (low, normal, high, urgent)
  assigned_to: VARCHAR
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
  quoted_at: TIMESTAMP
}
```

#### Website Visits Table (Analytics)

```sql
website_visits {
  id: UUID (Primary Key)
  page_path: VARCHAR
  user_agent: TEXT
  ip_address: VARCHAR
  referrer: VARCHAR
  session_id: VARCHAR
  device_type: VARCHAR
  browser: VARCHAR
  country: VARCHAR
  city: VARCHAR
  created_at: TIMESTAMP
}
```

#### Dumpsters Table

```sql
dumpsters {
  id: UUID (Primary Key)
  name: VARCHAR
  size: VARCHAR
  status: ENUM (available, rented, maintenance)
  current_location: VARCHAR
  latitude: NUMERIC
  longitude: NUMERIC
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}
```

#### Orders Table

```sql
orders {
  id: UUID (Primary Key)
  quote_id: UUID (Foreign Key)
  customer_name: VARCHAR
  phone: VARCHAR
  email: VARCHAR
  address: VARCHAR
  dumpster_size: VARCHAR
  status: ENUM (pending, confirmed, delivered, picked_up, completed)
  dropoff_date: DATE
  pickup_date: DATE
  total_amount: NUMERIC
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}
```

## 🎨 UI Components

### Admin Dashboard Features

- **Interactive Data Tables** - Sort, filter, paginate quotes, orders, and inventory
- **Statistics Cards** - Real-time business metrics with animated number tickers
- **Professional Sidebar** - Navigation with user profile and role management
- **Alert Dialogs** - Confirmation for destructive actions
- **Theme Toggle** - Dark/light mode switching with system preference detection
- **Interactive Charts** - Visual analytics, trends, and geographic data
- **Maps Integration** - Google Maps for dumpster locations and service areas
- **Advanced Analytics** - Visitor tracking, conversion metrics, and performance insights

### Form Components

- **Quote Request Form** - Multi-step form with validation and autocomplete
- **Calendar Picker** - Date selection with availability checking
- **Notification System** - Success/error feedback with toast notifications
- **Select Components** - Enhanced dropdowns for dumpster sizes and durations
- **File Upload** - Image upload with optimization and preview
- **Address Autocomplete** - Google Places integration for accurate addresses

### Business Components

- **Invoice Generation** - Professional invoice creation and management
- **Order Tracking** - Real-time status updates and workflow management
- **Inventory Management** - Dumpster tracking with location mapping
- **Customer Communication** - Automated email templates and notifications

## 🔐 Security Features

- **Row Level Security (RLS)** - Database access control with Supabase policies
- **Authentication Guards** - Protected admin routes with role-based access
- **Type Safety** - Full TypeScript implementation with strict mode
- **Input Validation** - Form data sanitization with Zod schemas
- **Environment Variables** - Secure credential management
- **CORS Protection** - API route security with proper headers
- **Session Management** - Secure user sessions with automatic cleanup
- **Proxy Security** - Corporate firewall support with secure proxy routing

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RESEND_API_KEY`
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (optional)
3. Deploy automatically on push to main branch
4. Configure custom domain if needed

### Other Platforms

The application is compatible with any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

### Environment Variables for Production

Ensure all environment variables from `.env.local` are configured in your deployment platform.

## 🔧 Development Tools

### Available Scripts

```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format code with Prettier
npm run format:check # Check code formatting
npm run type-check   # Run TypeScript check
npm run clean        # Clean build artifacts
npm run analyze      # Analyze bundle size
```

### Code Quality

- **ESLint** - Comprehensive linting with custom rules
- **Prettier** - Code formatting with consistent style
- **TypeScript** - Strict type checking
- **Husky** - Git hooks for pre-commit validation

## 📈 Business Features

### Complete Business Management

1. **Quote Management Workflow**
   - Customer quote requests via contact form
   - Admin review with priority and status assignment
   - Automated email notifications to customers
   - Quote approval/rejection tracking
   - Conversion to orders upon acceptance

2. **Order Processing**
   - Order creation from accepted quotes
   - Delivery scheduling and route optimization
   - Real-time status tracking (pending → confirmed → delivered → picked up → completed)
   - Customer communication at each stage
   - Inventory allocation and management

3. **Inventory Management**
   - Dumpster tracking with GPS coordinates
   - Availability status monitoring
   - Maintenance scheduling
   - Location-based assignment
   - Interactive map visualization

4. **Analytics & Reporting**
   - Website visitor tracking with geolocation
   - Conversion rate analysis
   - Revenue tracking and forecasting
   - Customer acquisition metrics
   - Geographic service area analysis

5. **Financial Management**
   - Invoice generation and tracking
   - Payment status monitoring
   - Revenue reporting
   - Pricing optimization insights

### Status Tracking Systems

#### Quote Status Flow
- `pending` - New quote request awaiting review
- `quoted` - Price provided to customer
- `accepted` - Customer accepted quote (ready for order creation)
- `declined` - Customer declined quote
- `completed` - Quote process finalized

#### Order Status Flow
- `pending` - Order created, awaiting confirmation
- `confirmed` - Order confirmed, scheduled for delivery
- `delivered` - Dumpster delivered to customer
- `picked_up` - Dumpster collected from customer
- `completed` - Order fully completed and invoiced

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following the code style guidelines
4. Run tests and linting (`npm run lint` and `npm run type-check`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use the established component patterns
- Write meaningful commit messages
- Update documentation for new features
- Test your changes thoroughly

## 📚 Documentation

- [`ARCHITECTURE.md`](docs/ARCHITECTURE.md) - System architecture overview
- [`PROXY_SECURITY.md`](docs/PROXY_SECURITY.md) - Corporate proxy configuration
- [`DUMPSTER_MAP_SETUP.md`](docs/DUMPSTER_MAP_SETUP.md) - Maps integration setup
- [`INVOICE_SYSTEM.md`](docs/INVOICE_SYSTEM.md) - Invoice system documentation
- [`google-places-setup.md`](docs/google-places-setup.md) - Google Places API setup

## 📞 Support

For support or questions about ARK Dumpster Rentals:

- Email: info@arkdumpsterrentals.com
- Phone: (727) 564-1794

## 📄 License

This project is private and proprietary to ARK Dumpster Rentals.

---

Built with ❤️ for ARK Dumpster Rentals
