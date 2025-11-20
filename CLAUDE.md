# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 16 payment management application built with React 19, tRPC, Drizzle ORM, Better Auth, and Stripe. The application is written in TypeScript and uses Bun as the package manager/runtime. It handles payment links, subscriptions, memberships, and product orders for a business.

## Development Commands

### Running the Application

```bash
bun dev                    # Start Next.js dev server on port 9090 with turbopack
bun run build              # Build the application for production
bun start                  # Start production server
```

### Database Management

```bash
bun db:studio              # Open Drizzle Studio on port 9091 for DB inspection
bun db:generate            # Generate migrations from schema changes (also applies triggers)
bun db:migrate             # Run pending migrations
bun db:seed                # Seed the database with initial data
bun db:reset               # Full reset: delete data, regenerate, migrate, and seed
bun db:delete              # Delete all data from the database
bun db:apply-triggers      # Apply SQL triggers to latest migration
```

**Important**: The `db:generate` command automatically runs `db:apply-triggers` after generating migrations. Custom SQL triggers in `src/server/database/triggers/*.sql` are automatically appended to the latest migration file.

### Email Development

```bash
bun email:dev              # Start email preview server for development
bun email:build            # Build email templates
bun email:export           # Export email templates
```

### Docker

```bash
bun docker:start           # Start Docker containers (likely PostgreSQL)
bun docker:stop            # Stop Docker containers
```

### Code Quality

```bash
bun lint                   # Check code with Biome
bun lint:fix               # Format and fix code with Biome
```

## Architecture

### Directory Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── (app)/                    # Authenticated app routes
│   │   ├── (admin)/              # Admin-only routes (users, products management)
│   │   ├── payment-links/        # Payment link management
│   │   ├── subscriptions/        # Subscription management
│   │   ├── memberships/          # Membership management
│   │   └── orders/               # Order management
│   ├── (auth)/                   # Authentication routes (sign-in, email verification)
│   ├── checkout/                 # Public checkout flow
│   ├── update-payment/           # Payment method update flow
│   └── api/                      # API routes
│       ├── trpc/                 # tRPC endpoint
│       ├── webhooks/stripe/      # Stripe webhook handler
│       └── cron/                 # Cron job endpoints
├── client/                       # Client-side code
│   ├── components/               # Reusable UI components
│   │   ├── ui/                   # Base UI components (shadcn/ui style)
│   │   └── form/                 # Form field components
│   ├── modules/                  # Page-specific feature modules
│   ├── hooks/                    # Custom React hooks
│   ├── lib/                      # Client utilities and providers
│   └── trpc/                     # tRPC client setup
├── server/                       # Server-side code
│   ├── database/                 # Database layer
│   │   ├── schema/               # Drizzle ORM schemas
│   │   │   ├── authentication/   # User and auth tables
│   │   │   ├── business/         # Business domain tables
│   │   │   └── product/          # Product tables
│   │   ├── triggers/             # SQL triggers (auto-applied to migrations)
│   │   ├── seed/                 # Seeding scripts
│   │   └── drizzle.ts            # Database client
│   ├── trpc/                     # tRPC configuration and routers
│   │   ├── config.ts             # tRPC setup with 3 procedure types
│   │   └── router/               # API routers
│   │       ├── public/           # Unauthenticated endpoints
│   │       ├── protected/        # User-authenticated endpoints
│   │       └── admin/            # Admin-only endpoints
│   ├── services/                 # Business logic services
│   │   ├── authentication/       # Better Auth configuration
│   │   ├── stripe.ts             # Stripe integration
│   │   ├── email.ts              # Email service (Resend)
│   │   ├── scheduledEvents.ts           # Calendly integration
│   │   └── dates.ts              # Date utilities
│   └── handlers/                 # Request handlers
├── emails/                       # React Email templates
├── shared/                       # Shared code between client/server
│   ├── enums/                    # TypeScript enums
│   ├── validation/               # Zod schemas and validators
│   │   ├── schemas/              # Business logic schemas
│   │   └── tables/               # Database table validators
│   └── create-*-form/            # Form schemas and parsers
└── assets/                       # Static assets
```

### Tech Stack

**Frontend:**

- Next.js 16 (App Router) with React 19
- TypeScript with strict mode
- Tailwind CSS v4 (PostCSS)
- React Compiler enabled
- shadcn/ui components (Radix UI primitives)
- TanStack Form for form management
- TanStack Query for data fetching
- next-intl for internationalization (Romanian locale)

**Backend:**

- tRPC for type-safe APIs
- Drizzle ORM with PostgreSQL
- Better Auth for authentication (magic links, phone verification)
- Stripe for payments
- Resend for transactional emails
- Vercel Blob for file storage

**Dev Tools:**

- Bun runtime and package manager
- Biome for linting/formatting
- Drizzle Studio for database inspection
- React Email for email development

### Key Patterns

#### 1. tRPC Procedure Types

There are three procedure types defined in `src/server/trpc/config.ts`:

- `publicProcedure`: No authentication required
- `protectedProcedure`: User must be authenticated (enforces `ctx.session` exists)
- `adminProcedure`: User must be ADMIN or SUPER_ADMIN role

All procedures include a timing middleware that adds artificial delays in development.

#### 2. Database Schema Organization

Schemas are organized into three domains in `src/server/database/schema/`:

- `authentication`: Users, accounts, sessions, verifications (Better Auth tables)
- `business`: Orders, subscriptions, memberships, contracts, payments
- `product`: Products, extensions, installments

Each schema file exports Drizzle table definitions and uses `drizzle-zod` to generate validators.

#### 3. Database Triggers

SQL triggers are stored in `src/server/database/triggers/*.sql` and automatically appended to the latest migration when running `bun db:generate`. This ensures triggers are version-controlled and deployed with migrations.

#### 4. Form Management

Forms use a shared pattern:

- Schema defined in `src/shared/*-form/*-schema.ts` (Zod)
- Parser in `src/shared/*-form/*-parser.ts` (transforms form data)
- Client component uses TanStack Form
- Server receives parsed data in tRPC procedure

#### 5. Module Structure

Client-side features are organized as modules in `src/client/modules/`, typically containing:

- `index.tsx`: Main component/page
- `_components/`: Feature-specific components (prefixed with `_` to indicate private)

#### 6. Path Aliases

Use `~/` prefix for all imports (configured in `tsconfig.json`):

```typescript
import { database } from "~/server/database/drizzle";
import { Button } from "~/client/components/ui/button";
```

#### 7. Authentication

Authentication is powered by Better Auth with:

- Magic link authentication (via Resend)
- Phone number verification (OTP)
- Change email functionality
- Role-based access control (USER, ADMIN, SUPER_ADMIN)
- Custom session schema validation

**Important**: The `customSession` plugin in `src/server/services/authentication/index.ts` crashes seeding scripts. Comment it out when running `bun db:seed`.

#### 8. Environment Variables

Required environment variables (see `.env.example`):

- `DATABASE_URL`: PostgreSQL connection string
- `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`: Authentication config
- `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLIC_KEY`, `STRIPE_WEBHOOK_SECRET`: Stripe
- `RESEND_SENDER_EMAIL`, `RESEND_TOKEN`: Email sending
- `CALENDLY_TOKEN`: ScheduledEvent scheduling
- `BLOB_READ_WRITE_TOKEN`: Vercel Blob storage
- `CRON_SECRET`: Cron job authentication

## Important Notes

- **Runtime**: This project uses Bun, not Node.js. Run all commands with `bun` instead of `npm/yarn/pnpm`.
- **Port**: Dev server runs on port 9090 (not default 3000)
- **Turbopack**: Development uses Next.js Turbopack for faster builds
- **Database**: Must have PostgreSQL running (use `bun docker:start` if using Docker setup)
- **Seeding Issue**: Comment out `customSession` plugin in `src/server/services/authentication/index.ts` before seeding
- **Triggers**: Custom SQL triggers are automatically applied to migrations during generation
- **TypeScript**: Strict mode enabled, `src/client/components/ui` excluded from type checking (shadcn/ui components)
- **i18n**: Application uses Romanian locale (`ro`) by default

## Testing Changes

When making database changes:

1. Modify schema in `src/server/database/schema/`
2. Run `bun db:generate` to create migration
3. Review generated migration in `src/server/database/drizzle/`
4. Run `bun db:migrate` to apply
5. Update seed scripts if needed, then `bun db:seed`

When adding new tRPC procedures:

1. Create procedure in appropriate router (public/protected/admin)
2. Use correct procedure type based on auth requirements
3. Client-side access via `useTRPC()` hook from `~/client/trpc/react`

## Git Branch Strategy

- Main branch: Not specified in git status
- Current development branch: `dev`
- Prefix feature branches appropriately when creating PRs
