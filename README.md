# StockPulse — Military Inventory Management System 

A logistics and inventory management system for military warehouses. Built with **Next.js 16** (App Router), **Supabase** (PostgreSQL), and deployed on **Netlify**.

> (RN only for one division as the basis of the system)

Authentication is implemented with a custom session layer (iron-session + bcrypt) to minimise dependency on external providers and simplify future migrations to on-premise deployments.

---

[![Netlify Status](https://api.netlify.com/api/v1/badges/bdf2edfe-59ca-4dc1-a32a-fd8d85621657/deploy-status)](https://app.netlify.com/projects/timely-croissant-26e162/deploys)

[Docs](https://documenter.getpostman.com/view/40522977/2sBXwjvtDk)

---

## Features

- **Product management** — create, edit, and delete inventory items with SKU, category, price, stock thresholds, categories, filters, and classifications
- **Location tracking** — assign products to warehouse locations (row / column / level), view product info by ID and location, and track allocated vs. unallocated quantities with per-product location breakdown
- **Allocation indicator** — visual balance status per product: Balanced, Unallocated, or Exceeded
- **User management** — permissions-based access to functions with dedicated permission assignment module for administration
- **Authentication** — cookie-based sessions via iron-session with bcrypt password hashing
- **Search & sort** — filter products and locations by name, SKU, and category
- **Low stock alerts** — configurable per-product threshold with dashboard indicators
- **Database integration** — Supabase (PostgreSQL) used for persistent product, location, and access data storage

---

## Technology Stack

| Layer      | Technology                                          |
| ---------- | --------------------------------------------------- |
| Framework  | Next.js 15 (App Router), React 19, TypeScript       |
| Styling    | Tailwind CSS v3, shadcn/ui (Radix UI), Lucide icons |
| State      | TanStack Query v5                                   |
| Forms      | React Hook Form + Zod                               |
| Auth       | iron-session (cookie-based), bcrypt                 |
| Database   | Supabase (PostgreSQL) via `@supabase/supabase-js`   |
| Deployment | Netlify + `@netlify/plugin-nextjs`                  |

---

## Done

- [x] Build Supabase (PostgreSQL) integration
- [x] Authentication via iron-session + bcrypt
- [x] Add Product table with - Categories, Filters, and Classifications
- [x] View product info by ID and location
- [x] Per-product location breakdown with quantity tracking
- [x] Separate functions by permissions
- [x] Create module for permission assignment
- [x] Create module for logging changes with displaying differences
- [x] Mobile-optimised layout

***

## Security and accesible

- [ ] Set different SKUs filtering by UAL — юзер бачить тільки те, до чого має допуск
- [ ] Limit to one login connection per user — активна сесія одна, нова заходить і скидає стару

***

<<<<<<< Updated upstream
> [!IMPORTANT]
> **Current priority**
> ## Operational management (InBound / OutBound)
> 
> - [ ] Create InBound / OutBound module — форми надходження і видачі з часом, відповідальним і підписом
> - [ ] Automatic/manual loading into field stores — автоматична/ручна алокація по складах при InBound
> - [ ] Set enclosure for adding/editing products without OrderID — додати продукти безпосередньо через продуктовий модуль
> - [ ] Build Order Management module (Creating, Picking, Checking, Dispatching), which should connect warehouse workers with (products & locations)
> - [ ] System for Disposing of Damaged Products
=======
## Security Findings

### Vuln 1: Hardcoded Fallback Session Secret — `src/lib/auth.ts:19`

* **Severity:** High
* **Category:** `weak_cryptography` / `authentication_bypass`
* **Confidence:** 9/10
* **Description:** The `iron-session` password (used as the HMAC key to sign and encrypt all session cookies) falls back to the hardcoded literal `"stockpulse-dev-secret-must-be-at-least-32-chars"` when `SESSION_SECRET` is not set in the environment. This string is publicly visible in the repository.
* **Exploit Scenario:** An attacker who has read the repository clones it, reads the fallback string, and uses the `iron-session` library to seal a crafted session object `{ user_id: "<target-id>" }` with the known key. If any deployment (staging, CI, a rushed production push) is missing `SESSION_SECRET`, the server accepts the forged cookie as a fully authenticated session, granting access to any user account without knowing the password.
* **Recommendation:** Remove the fallback entirely. Throw a hard startup error if `SESSION_SECRET` is absent:
  ```ts
  if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET environment variable is required");
  }
  password: process.env.SESSION_SECRET,
  ```

---

### Vuln 2: Debug Endpoint Left in Production Code — `src/app/api/debug/route.ts`

* **Severity:** Medium
* **Category:** `information_disclosure`
* **Confidence:** 9/10
* **Description:** A `/api/debug` endpoint exists in the production source tree. The file contains the developer comment `// ВИДАЛИТИ ПЕРЕД ПРОДАКШЕНОМ!` — confirming it was never removed. The endpoint is gated by `read_debug` permission, but that permission is a standard, freely-assignable entry in the user management UI alongside `read_products` and `read_users`. When called, it returns: up to 10 user records with `id`, `username`, `is_active`, and full permission sets; product count; and whether `SUPABASE_SERVICE_ROLE_KEY` and `SESSION_SECRET` are configured.
* **Exploit Scenario:** An attacker who compromises or social-engineers a `read_debug`-granted account calls `GET /api/debug`. They receive a complete map of all user accounts and their exact permission sets, identifying which accounts hold `write_users`, `delete_products`, etc. Combined with the session secret fallback (Vuln 1), they also learn whether the weak-key configuration is active — confirming whether cookie forgery will work.
* **Recommendation:** Delete the file entirely before any deployment. If a diagnostic endpoint is genuinely needed, restrict it to a hard-coded internal role (not a UI-assignable permission) and return only non-sensitive system health data.

---

### Vuln 3: Default `admin/admin123` Credential in Seed File — `supabase/seed.sql:6`

* **Severity:** Medium
* **Category:** `default_credentials`
* **Confidence:** 8/10
* **Description:** The database seed file creates an `admin` account (highest role, fully privileged) with a publicly documented password. Line 6 of the file reads `-- Пароль "admin123"` and the inserted bcrypt hash is a real hash of that password. Any deployment that ran `seed.sql` without a subsequent password rotation is directly vulnerable.
* **Exploit Scenario:** `POST /api/auth/login` with `{"username":"admin","password":"admin123"}` yields an authenticated admin session on any instance where the seed was applied and the password was not changed.
* **Recommendation:** Remove the plaintext password comment from the seed file. Replace the hardcoded hash with one generated from a randomly generated password printed once at seed time, or require the initial admin password to be supplied via an environment variable during setup. Force a password change on first login for any seeded admin account.

***

## Operational management (InBound / OutBound)

- [ ] Create InBound / OutBound module — форми надходження і видачі з часом, відповідальним і підписом
- [ ] Automatic/manual loading into field stores — автоматична/ручна алокація по складах при InBound
- [ ] Set enclosure for adding/editing products without OrderID — додати продукти безпосередньо через продуктовий модуль
- [ ] Build Order Management module (Creating, Picking, Checking, Dispatching), which should connect warehouse workers with (products & locations)
- [ ] System for Disposing of Damaged Products
>>>>>>> Stashed changes

***

## Logging

- [ ] Export audit log to CSV / PDF for reporting
- [ ] Add stock movement dashboard with time-based charts

***

## UX

- [ ] PWA support — встановити як застосунок на телефон без апстору
- [ ] Barcode / QR scan — замість ручного вводу SKU на складі
- [ ] Unify Windows by example of "User-form"

***

## Ideas for to do

| Функція | Чому важливо |
|---|---|
| Звіт по залишках (PDF/XLSX) | Офіцер звітує документом, не скріншотом |
| Threshold alerts у реальному часі | Email або браузерне сповіщення при low stock |
| Bulk import через CSV | Завести великий каталог без ручного введення |
| Історія руху по продукту | Скільки і коли прийшло/пішло по конкретній позиції |
| Multi-warehouse | Один інстанс для кількох об'єктів зі зведеним дашбордом |
| Друк документів | Накладна, акт списання, картка продукту для підпису |

***

## Prioritate

1. **Permissions module** — без цього все інше небезпечно
2. **InBound/OutBound module** — без цього система не ведеться як облік
3. **User action logging** — без цього немає підзвітності
4. **Mobile layout** — без цього система не використовується на складі
5. **Export документів** — без цього адміністративна робота ведеться в іншому місці

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

| Variable                    | Source                                   | Description                         |
| --------------------------- | ---------------------------------------- | ----------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`  | Supabase → Settings → API → Project URL  | Public Supabase project URL         |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role | Secret key — never expose to client |
| `SESSION_SECRET`            | Generate manually (32+ chars)            | Cookie encryption secret            |

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

| Method           | Endpoint                       | Description                            |
| ---------------- | ------------------------------ | -------------------------------------- |
| GET/POST         | `/api/products`                | List and create products               |
| GET/PATCH/DELETE | `/api/products/[id]`           | Get, update, or delete a product       |
| GET/POST         | `/api/products/[id]/locations` | List and assign locations to a product |
| PATCH/DELETE     | `/api/product-locations/[id]`  | Update or remove a location assignment |
| GET              | `/api/locations`               | Search available warehouse locations   |
| GET/POST         | `/api/users`                   | List and create users                  |
| PATCH/DELETE     | `/api/users/[id]`              | Update or delete a user                |
| POST             | `/api/auth/login`              | Authenticate and create session        |
| POST             | `/api/auth/logout`             | Destroy session                        |
| GET              | `/api/auth/me`                 | Get current session user               |
| GET              | `/api/stats`                   | Dashboard KPI summary                  |

All endpoints require authentication. Unauthenticated requests return `401 Unauthorized`.
