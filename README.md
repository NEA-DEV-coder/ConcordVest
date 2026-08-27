# ConcordVest

A premium real estate and renovation platform for Abuja, Nigeria. Built with React, TypeScript, and Supabase.

## Features

- **Property Catalogue** - Browse land, apartments, and homes with advanced filtering
- **Renovation Services** - Quote-led renovation and finishing packages
- **Project Portfolio** - Case studies of completed renovation projects
- **Editorial Content** - Architectural inspiration and practical guidance
- **Admin Dashboard** - Manage properties, leads, content, and staff

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Routing**: Wouter
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React

## Quick Start

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

## Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_CONCORDVEST_WHATSAPP_NUMBER=2348156648952
```

### Supabase Setup

1. Create a Supabase project
2. Run `supabase/schema.sql` in the SQL Editor
3. (Optional) Run `supabase/seed.sql` for demo data
4. Create storage buckets for media uploads
5. Create an admin user and set their role to `admin`

See [SETUP.md](./SETUP.md) for detailed instructions.

## Project Structure

```
concordvest/
├── client/
│   └── src/
│       ├── components/     # Reusable UI components
│       ├── contexts/       # React contexts (Auth, Theme)
│       ├── hooks/          # Data fetching hooks
│       ├── lib/            # Utilities and demo data
│       ├── pages/          # Page components
│       └── test/           # Test setup and utilities
├── supabase/
│   ├── schema.sql          # Database schema
│   └── seed.sql            # Demo data
├── server/
│   └── index.ts            # Express server
└── dist/                   # Production build
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Run production server |
| `npm run test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage |
| `npm run check` | Type check without emitting |
| `npm run format` | Format with Prettier |

## Architecture

### Data Flow

- **Public pages** use `useProperties`, `useProjects`, `useServices`, `useArticles` hooks
- **Admin pages** use `useAdminProperties`, `useAdminLeads` hooks with CRUD operations
- **Fallback**: When Supabase is not configured, demo data is used

### Authentication

- Supabase Auth with Row Level Security
- Role-based access: `admin`, `editor`, `staff`, `user`
- Admin dashboard requires staff+ role

### Database Schema

- `profiles` - User accounts
- `properties` - Real estate listings
- `projects` - Renovation portfolio
- `services` - Service packages
- `articles` - Editorial content
- `leads` - Customer enquiries

## Testing

```bash
# Run tests
npm run test

# Run with coverage
npm run test:coverage
```

## Deployment

The app can be deployed to:
- Vercel / Netlify (static hosting)
- Docker (included Dockerfile)
- Node.js server

Build output:
- `dist/public/` - Static frontend
- `dist/index.js` - Server entry

## License

MIT

## Credits

Built by the ConcordVest team.
