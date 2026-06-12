# Database Selection: PostgreSQL for IRCTC User Service

## Why PostgreSQL > MySQL & MongoDB

### 1. ACID Compliance & Data Integrity (Critical for IRCTC)

- **PostgreSQL**: Full ACID guarantees, crucial for handling user registrations, bookings, and financial transactions in rail booking systems
- **MySQL**: Until recently, MyISAM engine lacked transaction support; InnoDB is more complex
- **Interview angle**: _"For a booking/reservation system like IRCTC, data consistency is non-negotiable. If an OTP is sent, we must guarantee it's recorded. PostgreSQL ensures this atomically."_

### 2. Advanced Data Types & Schema Flexibility

- **PostgreSQL**: You get JSON, UUID (native), Arrays, Enums, Custom types—all natively indexed
- **Your schema uses**:
  - `uuid()` for IDs (PostgreSQL generates these efficiently)
  - `DateTime` timestamps (better handling)
  - Boolean flags for `emailVerified`
- **MongoDB**: Schemaless but lacks type safety; requires validation in app code
- **Interview angle**: _"PostgreSQL validates at the DB layer, reducing bugs. With 10M users (IRCTC scale), this is essential."_

### 3. Unique Constraints & Email Validation

Your schema has `@unique` on email:

```sql
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
```

- **PostgreSQL**: Concurrent requests checking for duplicate emails → DB handles atomically (no race conditions)
- **MySQL**: Less efficient index locking; race conditions possible under load
- **MongoDB**: No native unique index guarantees (application-level workaround needed)
- **Interview angle**: _"In IRCTC, two simultaneous registrations with the same email must be prevented. PostgreSQL's SERIALIZABLE isolation prevents this."_

### 4. Scalability for Relational Growth

- **Your future needs**: Users → Bookings → Payments → Cancellations (all related)
- **PostgreSQL**: Foreign keys, joins, and cascading deletes work flawlessly
- **MongoDB**: Document fragmentation, manual data consistency
- **Interview angle**: _"IRCTC isn't just users—it's tickets, seats, prices, routes. PostgreSQL's JOIN performance scales better than MongoDB document lookups."_

### 5. Row-Level Security & Auth

- **PostgreSQL**: Built-in RLS (Row-Level Security) policies
- For IRCTC: Users can only see their own bookings
- **Interview angle**: _"Security policies can be enforced at DB level, not just application layer."_

### 6. Full-Text Search (Booking Optimization)

- **PostgreSQL**: Native FTS (route search like "Mumbai to Delhi")
- **MongoDB**: Text search works but less optimized
- **Interview angle**: _"IRCTC needs fast route/train searches. PostgreSQL FTS is 10-20% faster than MongoDB."_

---

## Why NOT MongoDB?

- ❌ No ACID until v4.0, still weaker than PostgreSQL
- ❌ Less efficient for relational data
- ❌ Memory overhead for JSON storage (vs structured tables)
- ❌ Slower for analytical queries

## Why NOT MySQL?

- ❌ InnoDB is good but less feature-rich than PostgreSQL
- ❌ No native UUID support (uses CHAR)
- ❌ Worse handling of concurrent writes
- ❌ No RLS, JSON support limited

---

## Best Interview Answer (30 seconds)

> _"I chose PostgreSQL because IRCTC is a transactional system handling user registrations and bookings. PostgreSQL provides ACID compliance, atomic unique constraint checking (preventing duplicate emails), and efficient relational operations. It also has native support for UUIDs, proper indexing for concurrent access, and better row-level security—critical for a system with millions of users. MongoDB would introduce complexity managing relationships, and MySQL lacks the advanced features needed for reliability at scale."_

---

## Technical Stack Used

- **Database**: PostgreSQL 14+
- **ORM**: Prisma v7.7.0
- **Adapter**: @prisma/adapter-pg
- **Schema Features**:
  - UUID primary keys
  - Unique email constraint
  - Timestamp tracking (createdAt, updatedAt)
  - Boolean email verification flag
  - Optional password field for OAuth integration

---

## Key Decision Factors

| Factor                | PostgreSQL    | MySQL              | MongoDB               |
| --------------------- | ------------- | ------------------ | --------------------- |
| ACID Compliance       | ✅ Full       | ⚠️ InnoDB only     | ❌ Weak               |
| Concurrent Access     | ✅ Excellent  | ⚠️ Good            | ❌ Document locks     |
| Native UUID           | ✅ Yes        | ❌ No              | ✅ Yes                |
| Unique Constraints    | ✅ Atomic     | ⚠️ Race conditions | ❌ No guarantees      |
| Relational Queries    | ✅ Optimized  | ✅ Good            | ❌ Manual joins       |
| Row-Level Security    | ✅ Native     | ❌ No              | ❌ No                 |
| Full-Text Search      | ✅ Native FTS | ⚠️ Basic           | ⚠️ Slower             |
| Scalability for IRCTC | ✅ Excellent  | ⚠️ Good            | ❌ Poor for relations |

---

_This document serves as technical justification for PostgreSQL selection in interview discussions._
