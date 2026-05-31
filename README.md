# ALiice - Medical CRM & ERP for Aesthetics Clinics

A multi-tenant B2B SaaS platform for managing aesthetics clinics, built with Next.js 15, React 19, and Supabase.

## 🏗️ Architecture

ALiice follows a **HubSpot-style multi-tenant architecture** where:

- **Organizations (Clinics)** are the top-level tenant entities
- All data is strictly scoped to organizations via `organization_id` foreign keys
- **Row Level Security (RLS)** policies ensure complete tenant isolation
- Users can belong to multiple organizations with different roles

## 🔐 Multi-Tenant Features

### Organization Management
- Create and manage clinic organizations
- Custom branding (logo, colors)
- Swiss-specific identifiers (GLN, ZSR, UID)
- Subscription tiers (Free, Starter, Professional, Enterprise)

### Team Management & RBAC
- **Roles**: Owner, Admin, Doctor, Staff, Receptionist, Billing
- Email-based invitation system with secure tokens
- Role-based permissions for all actions
- Users can switch between multiple organizations

### Data Isolation
- All tables have `organization_id` foreign key
- PostgreSQL RLS policies enforce isolation
- Automatic scoping in OrganizationContext

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A Supabase account (create a new project for ALiice)

### Setup

1. **Install dependencies:**
   ```bash
   cd aliiceapp
   npm install
   ```

2. **Create a new Supabase project:**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Copy the project URL and keys

3. **Configure environment:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

4. **Run database migrations:**
   ```sql
   -- Apply in Supabase SQL Editor in this order:
   -- 1. supabase/schema.sql (base schema)
   -- 2. supabase/migrations/20260531_001_multi_tenant_foundation.sql
   -- 3. supabase/migrations/20260531_002_add_organization_id_to_tables.sql
   -- 4. supabase/migrations/20260531_003_row_level_security.sql
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

## 📁 Project Structure

```
aliiceapp/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/organizations/  # Organization APIs
│   │   ├── invite/[token]/     # Invitation acceptance
│   │   ├── onboarding/         # Clinic creation flow
│   │   └── ...
│   ├── contexts/
│   │   └── OrganizationContext.tsx  # Multi-tenant context
│   └── types/
│       └── organization.ts     # Multi-tenant types
├── supabase/
│   ├── migrations/            # SQL migrations
│   └── schema.sql             # Base schema
└── ...
```

## 🗄️ Database Schema

### Core Multi-Tenant Tables

| Table | Description |
|-------|-------------|
| `organizations` | Clinic/workspace entities |
| `organization_members` | User-organization relationships with roles |
| `organization_invitations` | Email invitation tokens |
| `organization_settings` | Per-org configuration |

### Key Flows

1. **New User Signup** → Create Clinic → Owner role
2. **Team Invitation** → Email with token → Accept → Join as member
3. **Organization Switch** → Update current_organization_id

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI**: React 19, TailwindCSS 4
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Email**: Resend
- **Payments**: Stripe

## 📝 License

Private - All rights reserved
