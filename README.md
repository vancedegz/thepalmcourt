# Pickleball Courts - Court Booking System

A full-stack pickleball court booking system built with Next.js 15, TypeScript, Prisma, PostgreSQL, and Auth.js v5.

## Features

### Customer Features
- **Court Booking**: Browse available courts and book time slots
- **Calendar View**: Visual calendar interface for selecting dates
- **Dynamic Pricing**: Time-based pricing tiers (morning, afternoon, evening)
- **Payment Upload**: Upload payment screenshots for verification
- **Booking Management**: View all bookings and their status
- **Profile Management**: Update personal information and change password

### Admin/Staff Features
- **Dashboard**: Overview with statistics (bookings, payments, revenue, courts)
- **Courts Management**: Add, edit, delete, and toggle court maintenance status
- **Bookings Management**: View all bookings and cancel if needed
- **Payment Verification**: Review and approve/reject payment screenshots
- **Business Settings**: Configure operating hours, contact info, and policies
- **Pricing Tiers**: Create time-based pricing rules for different hours/days

### Technical Features
- **Role-Based Access Control**: Customer, Staff, and Admin roles
- **Shared Authentication**: Single login page for all user types
- **Server Actions**: Next.js Server Actions for all mutations
- **Server Components**: React Server Components by default
- **Responsive Design**: Mobile-friendly UI with Tailwind CSS v4
- **shadcn/ui Components**: Consistent design system across all pages

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Database**: PostgreSQL
- **ORM**: Prisma 6
- **Authentication**: Auth.js v5 (NextAuth)
- **State Management**: TanStack Query v5, Zustand v5
- **File Upload**: UploadThing v7
- **Date Handling**: date-fns v4
- **Icons**: Lucide React

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database

## Installation

1. **Clone the repository**
   ```bash
   cd pickleball-courts
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

   Update the `.env` file with your values:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/pickleball_courts"

   # NextAuth
   NEXTAUTH_SECRET="your-secret-key-here"
   NEXTAUTH_URL="http://localhost:3000"

   # UploadThing (optional)
   UPLOADTHING_SECRET="your-uploadthing-secret"
   UPLOADTHING_APP_ID="your-uploadthing-app-id"
   ```

4. **Generate Prisma Client**
   ```bash
   npm run db:generate
   ```

5. **Run database migrations**
   ```bash
   npm run db:migrate
   ```

6. **Seed the database**
   ```bash
   npm run db:seed
   ```

## Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Test Credentials

After seeding, you can log in with these accounts:

- **Admin**: `admin` / `admin123`
- **Staff**: `staff` / `staff123`
- **Customer**: `customer` / `customer123`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma Client
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with sample data
- `npm run db:studio` - Open Prisma Studio

## Project Structure

```
pickleball-courts/
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts            # Database seed script
├── src/
│   ├── app/
│   │   ├── actions/       # Server Actions
│   │   ├── admin/         # Admin pages
│   │   ├── api/           # API routes
│   │   ├── book/          # Booking page
│   │   ├── login/         # Login page
│   │   ├── my-bookings/   # Customer bookings
│   │   ├── profile/       # Profile page
│   │   ├── register/      # Registration page
│   │   └── page.tsx       # Landing page
│   ├── components/
│   │   ├── layout/        # Layout components
│   │   └── ui/            # shadcn/ui components
│   ├── lib/
│   │   ├── auth.ts        # Auth.js configuration
│   │   ├── prisma.ts      # Prisma client
│   │   └── utils.ts       # Utility functions
│   ├── types/             # TypeScript types
│   └── middleware.ts      # Route protection
├── .env.example           # Environment variables template
├── components.json        # shadcn/ui configuration
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## Database Schema

### Models
- **User**: Customer, staff, and admin accounts
- **BusinessSettings**: Singleton for business configuration
- **PricingTier**: Time-based pricing rules
- **Court**: Pickleball court information
- **Booking**: Court reservations
- **Payment**: Payment records and verification

## Authentication Flow

1. User logs in at `/login` with username and password
2. Auth.js validates credentials and creates session
3. Middleware checks role and redirects:
   - Admin/Staff → `/admin`
   - Customer → `/book`
4. Protected routes require authentication and proper role

## Business Logic

### Booking Process
1. Customer selects court, date, and time slots
2. System calculates price based on active pricing tiers
3. Booking created with "pending" status
4. Payment record created with "pending" status
5. Customer uploads payment screenshot
6. Admin verifies payment
7. Booking status changes to "confirmed"

### Pricing Calculation
- Each hour is priced individually
- Pricing tiers match by time range and day of week
- Falls back to default price if no tier matches
- Price breakdown stored in JSON for transparency

### Reference Numbers
- Format: `PB-YYYYMMDD-XXXX`
- Auto-generated for each booking
- Used for tracking and customer reference

## Deployment

### Environment Variables
Ensure all required environment variables are set in production:
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Random secret for session encryption
- `NEXTAUTH_URL`: Production URL

### Build
```bash
npm run build
```

### Database Setup
```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

## Future Enhancements

Potential features to add:
- Email notifications for booking confirmations
- SMS reminders for upcoming bookings
- Online payment integration (Stripe, PayPal)
- Court availability calendar widget
- Booking history export
- Revenue analytics dashboard
- Multi-language support
- Mobile app (React Native)
- Recurring bookings
- Loyalty program

## License

MIT

## Support

For issues or questions, please open an issue on the repository.
