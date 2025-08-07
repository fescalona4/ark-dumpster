# 🚛 ARK Dumpster Rentals

A modern, full-stack web application for dumpster rental services built with Next.js 15, TypeScript, and Supabase. Features a professional customer-facing website with an integrated contact/quote system and a comprehensive admin dashboard for business management.

## ✨ Features

### 🌐 Customer Experience
- **Modern Landing Page** - Professional homepage with service information
- **Quote Request System** - Interactive form with calendar date picker
- **Contact Integration** - Email notifications via Resend API
- **Responsive Design** - Mobile-first approach with dark/light mode
- **Service Pages** - Detailed information about dumpster rental services

### 🔧 Admin Dashboard
- **Professional Interface** - Modern dashboard with shadcn/ui components
- **Quote Management** - View, edit, update, and track all customer quotes
- **Data Table** - Interactive table with sorting, filtering, and pagination
- **Analytics Cards** - Real-time stats (total quotes, pending, completed, etc.)
- **Charts & Graphs** - Visual analytics for business insights
- **Alert Dialogs** - Confirmation dialogs for delete operations
- **Dark Mode Support** - Theme toggle integrated in sidebar

### 🗄️ Database & Backend
- **Supabase Integration** - PostgreSQL database with Row Level Security
- **Structured Data** - Comprehensive quotes table with status tracking
- **Email System** - Automated notifications via Resend
- **Type Safety** - Full TypeScript coverage with database types

## 🚀 Tech Stack

- **Framework**: Next.js 15.4.5 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Email**: Resend API
- **Icons**: Lucide React, Tabler Icons
- **Fonts**: Manrope (Google Fonts)

## 📁 Project Structure

```
ark-dumpster/
├── app/                    # Next.js App Router
│   ├── admin/             # Admin dashboard pages
│   │   ├── layout.tsx     # Admin-specific layout with sidebar
│   │   ├── page.tsx       # Dashboard with stats and data table
│   │   └── quotes/        # Detailed quote management
│   ├── contact/           # Contact/quote form
│   ├── services/          # Service information pages
│   └── api/send/          # Email API endpoint
├── components/            # Reusable UI components
│   ├── ui/               # shadcn/ui base components
│   ├── admin-*           # Admin-specific components
│   ├── email-template.tsx # Email template
│   └── dropoffCalendar.tsx # Date picker
├── lib/                  # Utility functions
│   ├── supabase.ts       # Database client & types
│   └── supabase-server.ts # Server-side client
└── supabase/             # Database migrations
    ├── 002_create_quotes_table.sql
    ├── 003_drop_contacts_table.sql
    └── insert_dummy_quotes.sql
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
