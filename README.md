# 🚛 ARK Dumpster Rentals

A modern, full-stack web application for dumpster rental services built with Next.js 15, TypeScript, and Supabase. Features a professional customer-facing website with an integrated contact/quote system and a comprehensive admin dashboard for business management.

## ✨ Features

### 🌐 Customer Experience

- **Modern Landing Page** - Professional homepage with service information
- **Interactive Quote System** - Smart form with Google Places autocomplete
- **Calendar Integration** - Advanced date picker with availability
- **Email Notifications** - Automated confirmations via Resend API
- **Responsive Design** - Mobile-first approach with dark/light mode
- **Service Pages** - Detailed information about dumpster rental services
- **Professional Email Templates** - React-based email designs

### 🔧 Admin Dashboard

- **Modern Interface** - Clean dashboard with shadcn/ui components and unified header
- **Comprehensive Quote Management** - Create, view, edit, update, and track all customer quotes
- **Advanced Data Table** - Interactive table with drag-and-drop sorting, filtering, and pagination
- **Real-time Analytics** - Live stats cards (total quotes, pending, completed, revenue)
- **Interactive Charts** - Visual analytics with Recharts for business insights
- **Smart Dialogs** - Confirmation dialogs for all destructive operations
- **Theme System** - Dark/light mode with next-themes integration
- **User Management** - Supabase auth integration with user profiles

### 🗄️ Database & Backend

- **Supabase Integration** - PostgreSQL database with Row Level Security
- **Structured Data Model** - Comprehensive quotes table with status and priority tracking
- **Dual Email System** - Customer notifications + company alerts via Resend
- **Environment-based Controls** - Development email skip functionality
- **Corporate Proxy Support** - Undici proxy agent for enterprise environments
- **Type Safety** - Full TypeScript coverage with generated database types

### 🛠️ Developer Experience

- **Clean Architecture** - Well-organized component structure and API routes
- **ESLint Configuration** - Production-ready linting with custom rules
- **Zero Unused Dependencies** - Optimized package.json (41 packages)
- **Type Safety** - Comprehensive TypeScript implementation
- **Build Optimization** - Next.js 15 with Turbopack for fast development

## 🚀 Tech Stack

- **Framework**: Next.js 15.4.5 (App Router with Turbopack)
- **Language**: TypeScript 5.x with strict configuration
- **Styling**: Tailwind CSS 4.x
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Database**: Supabase (PostgreSQL with RLS)
- **Email**: Resend API with React Email templates
- **Charts**: Recharts for analytics visualization
- **Icons**: Lucide React, Tabler Icons
- **Animation**: Framer Motion for smooth interactions
- **Forms**: React Hook Form with validation
- **Data Tables**: TanStack Table with drag-and-drop
- **Date Picker**: React Day Picker
- **Authentication**: Supabase Auth
- **Proxy Support**: Undici for corporate environments
- **Fonts**: Manrope (Google Fonts)

## 📁 Project Structure

```
ark-dumpster/
├── app/                    # Next.js App Router
│   ├── admin/             # Admin dashboard
│   │   ├── layout.tsx     # Admin layout with sidebar + unified header
│   │   ├── page.tsx       # Dashboard with analytics and data table
│   │   ├── quotes/        # Comprehensive quote management
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
│       └── supabase-proxy/ # Corporate proxy support
├── components/            # Reusable UI components
│   ├── ui/               # shadcn/ui base components (30+ components)
│   ├── admin-*           # Admin-specific components
│   ├── site-header.tsx   # Unified admin header with dynamic titles
│   ├── email-template.tsx # Customer email template
│   ├── company-notification-email.tsx # Internal notifications
│   ├── google-places-autocomplete.tsx # Address autocomplete
│   ├── data-table.tsx    # Advanced table with drag-and-drop
│   ├── chart-area-interactive.tsx # Analytics charts
│   └── dropoffCalendar.tsx # Date picker component
├── lib/                  # Utility functions and services
│   ├── supabase.ts       # Database client with proxy support
│   ├── supabase-server.ts # Server-side client
│   ├── database-service.ts # Database operations
│   ├── email-service.ts  # Email service with dual notifications
│   ├── image-loader.ts   # Image optimization
│   └── utils.ts          # Utility functions
├── hooks/                # Custom React hooks
│   ├── use-mobile.ts     # Mobile detection
│   └── use-toast.tsx     # Toast notifications
├── docs/                 # Documentation
│   ├── PROXY_SECURITY.md # Proxy configuration guide
│   └── google-places-setup.md # Google Places API setup
├── supabase/             # Database migrations and scripts
│   ├── 002_create_quotes_table.sql
│   ├── insert_dummy_quotes.sql
│   └── README.md
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
```

### 3. Database Setup

1. Create a new Supabase project
2. Run the migration: `supabase/002_create_quotes_table.sql`
3. (Optional) Add dummy data: `supabase/insert_dummy_quotes.sql`

### 4. Run Development Server

```bash
npm run dev
```

Visit:

- **Website**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3000/admin
- **Quote Form**: http://localhost:3000/contact

## 📊 Database Schema

### Quotes Table

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

## 🎨 UI Components

### Admin Dashboard Features

- **Interactive Data Table** - Sort, filter, paginate quotes
- **Statistics Cards** - Real-time business metrics
- **Professional Sidebar** - Navigation with user profile
- **Alert Dialogs** - Confirmation for destructive actions
- **Theme Toggle** - Dark/light mode switching
- **Charts** - Visual analytics and trends

### Form Components

- **Quote Request Form** - Multi-step form with validation
- **Calendar Picker** - Date selection for dropoff
- **Notification System** - Success/error feedback
- **Select Components** - Dumpster size and duration

## 🔐 Security Features

- **Row Level Security (RLS)** - Database access control
- **Type Safety** - Full TypeScript implementation
- **Input Validation** - Form data sanitization
- **Environment Variables** - Secure credential management

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables for Production

Ensure all `.env.local` variables are set in your deployment platform.

## 📈 Business Features

### Quote Management Workflow

1. **Customer Submission** - Quote request via contact form
2. **Admin Review** - View in dashboard, set status to "quoted"
3. **Customer Response** - Accept/decline quote
4. **Job Tracking** - Update status through completion
5. **Analytics** - Track conversion rates and business metrics

### Status Tracking

- `pending` - New quote request
- `quoted` - Price provided to customer
- `accepted` - Customer accepted quote
- `declined` - Customer declined quote
- `completed` - Job finished successfully

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support or questions about ARK Dumpster Rentals:

- Email: arkdumpsterrentals@gmail.com
- Phone: (727) 564-1794

## 📄 License

This project is private and proprietary to ARK Dumpster Rentals.

---

Built with ❤️ for ARK Dumpster Rentals
