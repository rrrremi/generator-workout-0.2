# Counter App

A minimalist Next.js 14 application integrated with Supabase for authentication and database, featuring a persistent user-specific counter, user profiles, and an admin panel.

## Features

- **Authentication**: Complete auth flow with signup, login, logout, and password reset
- **Counter**: User-specific persistent counter with optimistic UI updates
- **User Profile**: View and manage user information
- **Admin Panel**: Admin-only access to view all users and their click counts
- **Responsive Design**: Mobile-friendly black and white minimalist design

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (Authentication, Database)
- **Security**: Row Level Security (RLS) policies

## Project Structure

```
counter-app/
├── app/
│   ├── api/
│   │   └── clicks/
│   │       └── route.ts
│   ├── auth/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── signup/
│   │   │   └── page.tsx
│   │   └── reset-password/
│   │       └── page.tsx
│   ├── protected/
│   │   ├── admin/
│   │   │   └── page.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   └── profile/
│   │       └── page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── auth/
│   │   ├── AuthForm.tsx
│   │   └── SignOutButton.tsx
│   ├── counter/
│   │   └── CounterButton.tsx
│   ├── layout/
│   │   ├── Footer.tsx
│   │   └── Header.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Card.tsx
│       └── Input.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   └── utils/
│       ├── auth.ts
│       └── counter.ts
├── types/
│   └── database.ts
├── middleware.ts
├── .env.local
├── package.json
├── tailwind.config.ts
├── postcss.config.js
└── tsconfig.json
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project

### Environment Variables

Create a `.env.local` file with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Database Setup

1. Create the following tables in Supabase:
   - `profiles`: User profiles with admin flag
   - `clicks`: Individual click records
   - `user_statistics`: View for aggregated user data

2. Set up RLS policies to secure your data

### Installation

```bash
npm install
npm run dev
```

## Testing

- Test auth flow completely
- Verify RLS policies work correctly
- Test counter persistence
- Check admin access control
- Test responsive design on mobile

## Deployment

1. Set up environment variables
2. Configure Supabase production project
3. Run database migrations
4. Test all features in production mode
5. Set up error monitoring

## Best Practices

- Data sanitization before display
- Proper error handling
- Optimistic UI updates
- Protected routes with middleware
- Type safety with TypeScript
