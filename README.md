# EGPB Ticket Management System

A modern, full-stack ticket management system built with Next.js 15, TypeScript, and Supabase for IT support and facility maintenance.

## 🚀 Features

### IT Dashboard
- **Ticket Management**: Create, view, update, and track IT support tickets
- **Real-time Notifications**: Instant browser notifications for new tickets
- **Advanced Filtering**: Search and filter by status, type, date range
- **Excel Export**: Export ticket data to Excel spreadsheets
- **User Management**: Admin panel for managing users and roles
- **Summary Dashboard**: Visual analytics with charts and statistics

### Engineer Dashboard
- **Facility Tickets**: Separate system for facility and maintenance tickets
- **Multi-category Support**: Air conditioning, plumbing, electrical, and more
- **Image Attachments**: Upload and view images for ticket documentation
- **Status Tracking**: Track tickets through their lifecycle (New → In Progress → Done)
- **Real-time Updates**: Live updates via Supabase Realtime

### User Roles
- **Admin**: Full access to all features and user management
- **IT Admin**: IT ticket management and viewing capabilities
- **Engineer Admin**: Facility ticket management capabilities
- **User**: Create and view own tickets

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) with App Router
- **Language**: TypeScript
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **Charts**: Recharts
- **Excel Export**: XLSX

## 📋 Prerequisites

Before you begin, ensure you have:
- Node.js 20.x or higher
- npm or yarn package manager
- A Supabase account and project

## 🚦 Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd ticket-form-app
```

### 2. Install dependencies

```bash
npm install
# or
yarn install
```

### 3. Set up environment variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

You can find these values in your [Supabase project settings](https://app.supabase.com).

### 4. Set up the database

Run the SQL migration files in your Supabase SQL Editor in this order:

1. `supabase_schema.sql` - Base schema
2. `create_engineer_tables.sql` - Engineer ticket tables
3. `supabase_rbac.sql` - Role-based access control
4. `fix_rls_policies.sql` - Row-level security policies
5. `enable_realtime.sql` - Enable real-time subscriptions
6. Any `update_schema_*.sql` files in order

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
ticket-form-app/
├── app/                      # Next.js App Router pages
│   ├── api/                  # API routes
│   │   └── admin/           # Admin API endpoints
│   ├── dashboard/           # Main IT dashboard
│   │   ├── create/          # Create IT ticket
│   │   ├── engineer/        # Engineer dashboard
│   │   ├── summary/         # Analytics dashboard
│   │   ├── ticket/[id]/     # IT ticket details
│   │   └── users/           # User management
│   ├── login/               # Login page
│   └── register/            # Registration page
├── components/              # Reusable React components
├── lib/                     # Utility libraries
│   ├── supabase.ts         # Supabase client (browser)
│   ├── supabase-admin.ts   # Supabase admin client
│   ├── imageUpload.ts      # Image upload utilities
│   └── exportToExcel.ts    # Excel export utilities
├── utils/                   # Additional utilities
│   └── supabase/           # Server-side Supabase helpers
└── public/                  # Static assets
```

## 🔐 Authentication

The system uses Supabase Authentication with email/password. Usernames are automatically converted to email format (`username@egpb.local`).

## 🎨 Customization

### Changing Colors

The app uses a green color scheme. To customize, edit `app/globals.css`:

```css
:root {
  --primary: #16a34a; /* green-600 */
  --accent: #22c55e; /* green-500 */
}
```

### Modifying Ticket Types

Edit the ticket type options in:
- `app/dashboard/create/page.tsx` (IT tickets)
- `app/dashboard/engineer/create/page.tsx` (Engineer tickets)

## 📊 Database Schema

### Main Tables
- **tickets**: IT support tickets
- **engineer_tickets**: Facility maintenance tickets
- **profiles**: User profiles and roles
- **ticket_images**: Image attachments for tickets
- **ticket_views**: Track ticket views for notifications
- **ticket_comments**: Comments on tickets

## 🚀 Deployment

### Deploy on Vercel

The easiest way to deploy is using Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add environment variables
4. Deploy!

### Environment Variables for Production

Make sure to set all required environment variables in your hosting platform:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## 📝 Scripts

```bash
npm run dev      # Start development server with Turbopack
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## 🐛 Troubleshooting

### Database Connection Issues
- Verify your Supabase URL and keys in `.env.local`
- Check if your Supabase project is active
- Ensure RLS policies are properly configured

### Image Upload Failures
- Check Supabase Storage bucket permissions
- Verify file size limits (default: 5MB)
- Ensure bucket is publicly accessible

### Authentication Errors
- Clear browser cookies and cache
- Verify email format in database
- Check Supabase Auth settings

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is proprietary and confidential.

## 👥 Support

For support and questions:
- Create an issue in the repository
- Contact the development team

## 🔄 Version History

- **v1.0.0** - Initial release with IT and Engineer dashboards
  - User authentication and role management
  - Ticket creation and management
  - Real-time notifications
  - Excel export functionality
  - Summary analytics dashboard

---

Built with ❤️ for EGPB
