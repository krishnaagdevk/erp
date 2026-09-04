# School Management ERP Dashboard 🎓

A modern, full-stack, enterprise-grade School Management & ERP system built with **Next.js 16 (App Router & Turbopack)**, **React 19**, **Prisma ORM**, **PostgreSQL**, and **Tailwind CSS**. It also includes cross-platform mobile capabilities via **Capacitor 8**.

---

## 🌟 Key Features

### 1. 👥 Multi-Role Role-Based Access Control (RBAC)

- **Admin**: Full control over academic sessions, user management (teachers, students, parents), finance/fees, classes, lessons, exams, assignments, attendance, and announcements.
- **Teacher**: Manage assigned classes, subjects, schedules, lesson plans, student attendance, exams, assignments, and results.
- **Student**: View personalized timetables, exam schedules, grades/results, attendance metrics, assignments, fee balance, and school notices.
- **Parent**: Track student performance, attendance records, exam results, and monitor fee payment receipts.
- **Accountant**: Dedicated finance workflows, fee structure creation, fee collection, partial/full payment recording, and automated receipt generation.

### 2. 📊 Interactive Analytics & Insights

- **User Demographics & Counts**: Radial bar charts visualizing student/teacher counts.
- **Attendance Visualizations**: Daily & weekly attendance tracking by class with interactive charts (`Recharts`).
- **Financial Analytics**: Inflows, outstanding dues, and cashflow charts.
- **Interactive Academic Timetable**: Powered by `react-big-calendar` with customizable views.

### 3. ⚡ Smart Filtering, Search & Sorting

- Real-time client & server-side search across all entities.
- Contextual multi-parameter filters (Class, Teacher, Subject, Date, Status).
- Dynamic ascending/descending sorting for any table column.
- Accessible, fuzzy-searchable select & multi-select components (`SearchableSelect`, `SearchableMultiSelect`) designed for large datasets.

### 4. 💰 Comprehensive Fee & Finance Engine

- Configurable fee types (Tuition, Transport, Examination, Lab, Library, etc.) with customizable due dates.
- Partial payment support with automatic balance calculations.
- Printable, branded fee payment receipts with transaction IDs.

### 5. 📱 Mobile Ready (Capacitor & Responsive)

- Responsive, adaptive layout for desktop, tablet, and mobile browsers.
- Integrated Capacitor Android wrapper for native mobile APK builds.

---

## 🛠️ Tech Stack

| Layer                  | Technology                                                                                              |
| :--------------------- | :------------------------------------------------------------------------------------------------------ |
| **Framework**          | [Next.js 16](https://nextjs.org/) (App Router, Turbopack, Server Actions)                               |
| **Frontend Library**   | [React 19](https://react.dev/) (`useActionState`, Server Components)                                    |
| **Database & ORM**     | [PostgreSQL](https://www.postgresql.org/) & [Prisma ORM](https://www.prisma.io/)                        |
| **Styling**            | [Tailwind CSS](https://tailwindcss.com/) & Vanilla CSS                                                  |
| **Form Management**    | [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)                               |
| **Data Visualization** | [Recharts](https://recharts.org/) & [React Big Calendar](https://github.com/jquense/react-big-calendar) |
| **Media Uploads**      | [Cloudinary](https://cloudinary.com/) (`next-cloudinary`)                                               |
| **Mobile Runtime**     | [@capacitor/core](https://capacitorjs.com/) (Android)                                                   |
| **Package Manager**    | [pnpm](https://pnpm.io/)                                                                                |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v20+` or `v22+`
- **pnpm**: `pnpm install -g pnpm`
- **PostgreSQL Database**: Local or hosted (Neon, Supabase, Railway, etc.)

### 1. Clone & Install Dependencies

```bash
git clone <repo-url>
cd full-stack-school
pnpm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/schooldb?schema=public"
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your_cloud_name"
NEXT_PUBLIC_CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
JWT_SECRET="your_jwt_secret_key"
```

### 3. Initialize Database & Seed Demo Data

```bash
# Push Prisma schema to database
pnpm prisma db push

# (Optional) Seed sample data
pnpm prisma db seed
```

### 4. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📜 Available Scripts

- `pnpm dev`: Start local development server on port 3000 (`0.0.0.0:3000`).
- `pnpm build`: Build the production bundle with full TypeScript and route verification.
- `pnpm start`: Start the production server.
- `pnpm format`: Format all source code with Prettier and Tailwind plugin.
- `pnpm format:check`: Check code formatting consistency.
- `pnpm cap:build`: Sync Capacitor web assets and compile debug Android APK.

---

## 📂 Project Architecture

```plaintext
src/
├── app/
│   ├── (dashboard)/             # Role-gated dashboard views
│   │   ├── admin/               # Admin dashboard & controls
│   │   ├── teacher/             # Teacher dashboard
│   │   ├── student/             # Student dashboard
│   │   ├── parent/              # Parent dashboard
│   │   ├── accountant/          # Finance & fees dashboard
│   │   └── list/                # Data management views (Teachers, Students, Classes, Fees, etc.)
│   └── api/                     # Backend API endpoints (Auth, Me, etc.)
├── components/
│   ├── forms/                   # Modular entity forms with validation
│   ├── FormModal.tsx            # Universal CRUD modal controller
│   ├── SearchableSelect.tsx     # Filterable single-select dropdown
│   ├── SearchableMultiSelect.tsx# Filterable multi-select chip component
│   ├── TableActions.tsx         # Interactive Sort & Filter popups
│   └── ...                      # Visual charts & widgets
└── lib/
    ├── actions.ts               # Next.js Server Actions (CRUD logic)
    ├── formValidationSchemas.ts # Zod validation schemas
    ├── prisma.ts                # Prisma singleton instance
    └── utils.ts                 # Formatting & serialization helpers
```
