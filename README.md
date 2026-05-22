# StockPulse — Military Inventory Management System

[Live Demo](https://timely-croissant-26e162.netlify.app/) · [![Netlify Status](https://api.netlify.com/api/v1/badges/bdf2edfe-59ca-4dc1-a32a-fd8d85621657/deploy-status)](https://app.netlify.com/projects/timely-croissant-26e162/deploys)

A logistics and inventory management system for military warehouses. Built with **Next.js 16** (App Router), **Supabase** (PostgreSQL), and deployed on **Netlify**.

Authentication is implemented with a custom session layer (iron-session + bcrypt) to minimise dependency on external providers and simplify future migrations to on-premise deployments.

> DB status: [/api/debug](https://timely-croissant-26e162.netlify.app/api/debug)
>
> [Documentation](https://documenter.getpostman.com/view/40522977/2sBXwjvtDk)

---

## Features

- **Product management** — create, edit, and delete inventory items with SKU, category, price, and stock thresholds
- **Location tracking** — assign products to warehouse locations (row / column / level) and track allocated vs. unallocated quantities
- **Allocation indicator** — visual balance status per product: Balanced, Unallocated, or Exceeded
- **User management** — role-based access with admin controls
- **Authentication** — cookie-based sessions with bcrypt password hashing
- **Search & sort** — filter products and locations by name, SKU, and category
- **Low stock alerts** — configurable per-product threshold with dashboard indicators

---

## Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v3, shadcn/ui (Radix UI), Lucide icons |
| State | TanStack Query v5 |
| Forms | React Hook Form + Zod |
| Auth | iron-session (cookie-based), bcrypt |
| Database | Supabase (PostgreSQL) via `@supabase/supabase-js` |
| Deployment | Netlify + `@netlify/plugin-nextjs` |

---

## Roadmap - prioritate by positioning (upper = more critical)

- [x] CRUD with in-memory database
- [x] Supabase (PostgreSQL) integration
- [x] Authentication via iron-session + bcrypt
- [x] Product categories, filters, and classifications
- [x] View product info by ID and location
- [x] Bulk location upload form
- [x] Per-product location breakdown with quantity tracking
- [ ] Set enclosure for Adding/Editing products throught usual module (Locations) (without OrderID)
- [ ] User action logging
- [ ] Create module for In/Out bound products into system
  - [ ] Automatic/manual loading into field stores
- [ ] Mobile-optimised layout
- [ ] Set different SKUs filtering by user access level (UAL)
- [ ] Limit to one login conection for Users

---

## Database Setup (Supabase)

### 1. Create a project
1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Choose a name, password, and region (EU-Central recommended).
3. Wait for provisioning to complete.

### 2. Run migrations
Open **SQL Editor** in the Supabase dashboard and execute in order:

1. `supabase/schema.sql` — creates `products`, `users`, `locations`, and `product_locations` tables with foreign key constraints
2. `supabase/seed.sql` — inserts default admin user and sample products

### 3. Get your API keys
Go to **Supabase Dashboard → Settings → API** and copy:
- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.local.example .env.local
# Fill in your Supabase URL, keys, and session secret

# 3. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Demo credentials**
| Field | Value |
|---|---|
| Username | `admin` |
| Password | `admin123` |

---

## Environment Variables

| Variable | Source | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL | Public Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role | Secret key — never expose to client |
| `SESSION_SECRET` | Generate manually (32+ chars) | Cookie encryption secret |

Generate a session secret:
```bash
openssl rand -base64 32
```

---

## Build

```bash
npm run build
```

---

## Contributing

1. Fork the repository and clone your fork
2. Create a branch: `feature/<name>` or `bugfix/<name>`
3. Install dependencies and verify the build passes locally
4. Run lint and type check:
   ```bash
   npm run lint
   npx tsc --noEmit
   ```
5. Commit with a clear message and push to your fork
6. Open a Pull Request against the `dev` branch — include a short description of the change and any related issue numbers

**Code style**
- Follow existing ESLint and Prettier config — `npm run lint` fixes most issues automatically
- Keep TypeScript types accurate; avoid `any` unless absolutely necessary
- Write small, focused commits — one logical change per commit

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET/POST | `/api/products` | List and create products |
| GET/PATCH/DELETE | `/api/products/[id]` | Get, update, or delete a product |
| GET/POST | `/api/products/[id]/locations` | List and assign locations to a product |
| PATCH/DELETE | `/api/product-locations/[id]` | Update or remove a location assignment |
| GET | `/api/locations` | Search available warehouse locations |
| GET/POST | `/api/users` | List and create users |
| PATCH/DELETE | `/api/users/[id]` | Update or delete a user |
| POST | `/api/auth/login` | Authenticate and create session |
| POST | `/api/auth/logout` | Destroy session |
| GET | `/api/auth/me` | Get current session user |
| GET | `/api/stats` | Dashboard KPI summary |

All endpoints require authentication. Unauthenticated requests return `401 Unauthorized`.
