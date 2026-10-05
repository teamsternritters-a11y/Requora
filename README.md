# ReverseMarket

A needs-first reverse marketplace where customers post requirements and providers submit offers. Built with React, Vite, TailwindCSS, and Supabase.

## Features

- **Customer Flow**: Post requirements, set budgets/deadlines, receive and compare offers, shortlist, and select providers.
- **Provider Flow**: Browse requirements, submit offers with price/delivery/proposal, and manage portfolio.
- **Smart Matching Engine**: AI-powered scoring system (Budget Fit, Delivery Fit, Relevance) for transparent comparison.
- **Real-time Notifications**: Get notified instantly on new offers, shortlists, and selections.
- **Glassmorphism UI**: Modern, premium design with micro-animations and responsive layouts.

## Tech Stack

- React 18
- Vite
- React Router DOM
- TailwindCSS (Vanilla)
- Supabase (Database, Auth, Storage, RLS)
- React Hook Form + Zod (Validation)
- date-fns (Date Formatting)

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Supabase Setup**:
   - Create a new project on [Supabase](https://supabase.com).
   - Run the SQL script located in `supabase/schema.sql` in your Supabase SQL Editor to create tables, policies, and seed categories.
   - Set up two Storage buckets: `avatars` (public) and `reference-files` (authenticated).

3. **Environment Variables**:
   Copy `.env.example` to `.env` and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```

## Production Build

To build the application for production:

```bash
npm run build
```

## Architecture

- `src/components/`: Reusable UI components (Cards, Modals, Navbar, Layouts).
- `src/pages/`: Page-level components organized by role (Customer, Provider, Public).
- `src/hooks/`: Custom React hooks (Auth context, Notifications).
- `src/services/`: API layer abstracting Supabase interactions.
- `src/utils/`: Helper functions (Matching Engine, Formatters).
- `src/types/`: TypeScript type definitions matching the database schema.
