# ConcordVest Setup Guide

This guide will help you set up the ConcordVest application with Supabase for production use.

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)
- Git installed

## 1. Supabase Project Setup

### Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Name your project (e.g., "concordvest")
4. Set a secure database password
5. Choose a region closest to your users
6. Click "Create new project"

### Get Your Credentials

1. Go to Settings > API
2. Copy the following values:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`

## 2. Database Schema

### Run the Schema Migration

1. Go to SQL Editor in your Supabase dashboard
2. Create a new query
3. Copy the contents of `supabase/schema.sql` and paste it
4. Click "Run" to execute

This creates:
- `profiles` table for user management
- `properties` table for property listings
- `projects` table for renovation portfolio
- `services` table for service packages
- `articles` table for editorial content
- `leads` table for enquiries
- Row Level Security policies for all tables
- Indexes for common queries

### Seed Demo Data (Optional)

1. In SQL Editor, create another query
2. Copy the contents of `supabase/seed.sql`
3. Run to populate with demo content

## 3. Storage Buckets

### Create Storage Buckets

1. Go to Storage in Supabase dashboard
2. Create the following buckets:
   - `properties` - Property images
   - `projects` - Project portfolio images
   - `articles` - Article hero images
   - `services` - Service package images
   - `avatars` - User profile pictures

### Configure Bucket Policies

For each bucket, set public access for read operations:

```sql
-- Allow public read access
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'properties'); -- Repeat for each bucket
```

## 4. Create Admin User

### Create User via Supabase Auth

1. Go to Authentication > Users
2. Click "Add user" > "Create new user"
3. Enter email and password
4. Click "Create user"

### Set Admin Role

1. Go to Table Editor > profiles
2. Find your user's row
3. Set the `role` column to `admin`

Alternatively, run in SQL Editor:

```sql
UPDATE profiles
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

## 5. Environment Configuration

### Create .env File

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

### Fill in Values

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_CONCORDVEST_WHATSAPP_NUMBER=2348156648952
```

## 6. Install & Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 7. Testing

Run the test suite:

```bash
npm run test
```

Run tests with coverage:

```bash
npm run test:coverage
```

## Architecture Overview

### Frontend
- React + TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Wouter for routing

### Backend
- Supabase (PostgreSQL + Auth + Storage)
- Row Level Security for data protection
- Real-time subscriptions available

### Data Flow
- `useProperties`, `useProjects`, `useServices`, `useArticles` hooks fetch data
- Falls back to demo data when Supabase is not configured
- Admin dashboard uses `useAdmin*` hooks with CRUD operations

## Deployment

### Build for Production

```bash
npm run build
```

This creates:
- `dist/public/` - Static frontend files
- `dist/index.js` - Server entry point

### Deploy Options

1. **Vercel/Netlify** - Deploy the `dist/public` folder
2. **Docker** - Use the provided Dockerfile
3. **Node.js Server** - Run `node dist/index.js`

### Environment Variables

Set these in your deployment platform:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_CONCORDVEST_WHATSAPP_NUMBER` (optional)

## Troubleshooting

### "Supabase is not configured"
- Ensure `.env` file exists with correct values
- Restart the development server after creating `.env`

### Authentication Issues
- Check that the user exists in Supabase Auth
- Verify the user has a profile record with correct role
- Check RLS policies are not blocking access

### Database Errors
- Verify schema was run successfully
- Check RLS policies are correctly configured
- Review Supabase logs for detailed errors

## Support

For issues or questions:
- Check the GitHub Issues page
- Review Supabase documentation
- Contact the development team
