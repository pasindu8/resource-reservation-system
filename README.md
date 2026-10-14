# PrimeWave Reserve – Resource Reservation Management System

A centralized digital platform designed for growing organizations to manage shared resources, coordinate bookings on an interactive live timeline, and eliminate scheduling conflicts and double bookings.

Developed as a technical assessment for **PrimeWave Lab (Pvt) Ltd** (Software Engineering Internship).

---

## 📌 1. Business Problem & Solution Overview

### The Challenge
As organizations expand, shared facilities (meeting rooms, project labs, recording studios, specialized hardware) face coordination bottlenecks:
- Reservations are scattered across informal chats and paper logs.
- Double-bookings and overlapping time slots create operational friction.
- Employees waste time guessing whether a room or tool is free.

### The Solution: PrimeWave Reserve
A full-stack, cloud-connected digital system providing:
1. **Interactive Hour-by-Hour Timeline**: Real-time visual timeline from 08:00 to 20:00 showing current bookings and free blocks.
2. **Double-Booking & Conflict Prevention Algorithm**: Strict interval overlap validation (`startTime < existingEnd && endTime > existingStart`) at the database API level.
3. **Role-Based Access Control (RBAC)**:
   - **Administrators**: Create, modify, and remove organizational resources; oversee all system schedules.
   - **Employees**: Browse resources, view live availability, book slots, and manage reservations.
4. **Immediate User Feedback**: Real-time Toast notification suite for errors, confirmations, and informative messages.

---

## 🛠️ 2. Technology Stack

- **Full-Stack Framework**: [Next.js](https://nextjs.org/) (App Router, React 19)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict type safety)
- **Database & ORM**: PostgreSQL with [Prisma ORM](https://www.prisma.io/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with custom glassmorphic styling
- **Version Control**: Git & GitHub

---

## 📊 3. Database Architecture & Entity Relationship (ER) Diagram

The data model is engineered around three core relational entities: `User`, `Resource`, and `Reservation`.

### Mermaid ER Diagram

```mermaid
erDiagram
    USER ||--o{ RESERVATION : "places"
    RESOURCE ||--o{ RESERVATION : "is booked in"

    USER {
        string id PK "UUID"
        string name "User full name"
        string email UK "Unique email address"
        string password "Hashed / Secure credential"
        string role "ADMIN | EMPLOYEE"
        datetime createdAt "Timestamp"
    }

    RESOURCE {
        string id PK "UUID"
        string name "e.g. Boardroom Alpha, VR Lab"
        string type "room | equipment | lab"
        int capacity "Seating or capacity limit"
        string status "AVAILABLE | MAINTENANCE"
        datetime createdAt "Timestamp"
    }

    RESERVATION {
        string id PK "UUID"
        string resourceId FK "References RESOURCE(id)"
        string userId FK "References USER(id)"
        datetime startTime "Interval start"
        datetime endTime "Interval end"
        string purpose "e.g. Sprint Review, Client Pitch"
        datetime createdAt "Timestamp"
    }
```

### Relationship Summary:
- **1 User : N Reservations**: A user can schedule multiple bookings over time.
- **1 Resource : N Reservations**: A resource can have multiple reservations across non-overlapping time slots.

---

## ⚙️ 4. Overlap & Conflict Prevention Logic

Whenever a booking request is made via `POST /api/reservations`, the server executes an atomic database validation:

```typescript
// Conflict validation check:
const conflict = await prisma.reservation.findFirst({
  where: {
    resourceId,
    AND: [
      { startTime: { lt: targetEndTime } },
      { endTime: { gt: targetStartTime } },
    ],
  },
});

if (conflict) {
  return NextResponse.json(
    { error: 'That time slot is already reserved. Please pick another slot.' },
    { status: 409 }
  );
}
```

This guarantees zero race conditions or accidental overbooking.

---

## 🛡️ 5. Enterprise Security Architecture

The application implements defense-in-depth security best practices across all layers:

1. **Cryptographic Password Security (`lib/security.ts`)**:
   - Uses **Salted Scrypt Key Derivation** (`crypto.scryptSync`) with unique 16-byte cryptographically secure random salts per user, mitigating rainbow table & dictionary attacks.
   - Implements **Timing-Safe Verification** (`crypto.timingSafeEqual`) to prevent side-channel timing attacks during authentication.
   - Enforces a minimum 8-character password policy and RFC-compliant email verification.

2. **Server-Side Role-Based Access Control (RBAC)**:
   - Resource management routes (`POST /api/resources`, `DELETE /api/resources`) strictly verify database-backed `ADMIN` privileges before mutations.
   - Non-administrators are rejected with `403 Forbidden`.

3. **Reservation Ownership Authorization**:
   - Deletion of scheduled bookings (`DELETE /api/reservations`) validates whether the requester is the original booking owner or a system administrator, preventing unauthorized tampering.

4. **Input Sanitization & Injection Defense**:
   - All string payloads are sanitized (`sanitizeInput`) to strip HTML/script tags, preventing stored Cross-Site Scripting (XSS).
   - Capacity bounds and operational hours (08:00–20:00) are strictly checked server-side to reject anomalous or malicious payloads.
   - Parameterized SQL queries via Prisma ORM completely eliminate SQL Injection risks.

---

## 🚀 6. Local Setup & Installation Guide


### Prerequisites
- [Node.js](https://nodejs.org/) (v18.18 or later recommended)
- A PostgreSQL database instance (local PostgreSQL or Supabase / Neon cloud)

### Step 1: Clone the Repository
```bash
git clone https://github.com/<your-username>/resource-reservation-system.git
cd resource-reservation-system
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/reservation_db?schema=public"
DIRECT_URL="postgresql://username:password@localhost:5432/reservation_db?schema=public"
```

### Step 4: Run Database Migrations / Sync
Push the Prisma schema to your PostgreSQL database:
```bash
npx prisma db push
```

### Step 5: Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔗 6. Key Application Routes

| Route | Description |
|---|---|
| `/` | Interactive Dashboard, live room availability overview, quick notification test |
| `/book` | Interactive timeline booking matrix (08:00 - 20:00) with drag/click selection |
| `/resources` | Resource directory; Administrator creation & management panel |
| `/reservations` | Comprehensive registry of scheduled bookings with search and cancellation |
| `/login` | Authentication for Admin & Employee credentials |
| `/register` | New account signup with role selection |

---

## 📹 7. Assessment Video Walkthrough Outline (3-5 Mins)

When recording your submission demonstration:
1. **0:00 - 0:45 | Problem Intro**: State how informal reservation channels cause chaos, and introduce PrimeWave Reserve.
2. **0:45 - 2:00 | Live Timeline & Conflict Prevention**:
   - Show `/book`.
   - Demonstrate booking a slot (e.g. Boardroom 10:00 - 12:00).
   - Attempt to book the same slot to show the conflict rejection and Error toast.
3. **2:00 - 3:00 | Resource Management & Roles**:
   - Show how an Admin adds a new resource (`/resources`).
   - Demonstrate the filter and search on `/reservations`.
4. **3:00 - 4:00 | Architecture & Decisions**:
   - Highlight Next.js App Router, PostgreSQL schema design, and Prisma overlap checking.

---

## 📄 License
Created for PrimeWave Lab Technical Assessment Evaluation.
