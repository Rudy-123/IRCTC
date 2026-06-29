


https://youtube.com/playlist?list=PLhNPruYZ0mVOF-poB1cDcU8ICktc_ehxs&si=7NNrrZA6Q5msCS01 i m following this playlist for the irctc so just wanted a readme for this with full all things epxlained ocrrcetly i would give u samplel but understand i hv not implemented the whole project but for readme u hv to create an overll so do not implement anything just make readme file so i hv given u the link of the youtube 
12:25 AM


Research completion timer: Timer has expired
Error from Codebase Structure Researcher (research)
12:25 AM



Baseline model quota reached
Your plan's baseline quota will refresh on 6/30/2026, 5:02:37 AM. You can upgrade to a Google AI Ultra plan to receive higher rate limits. See plans.

Dismiss
See Plans
Enable Overages




Overview

Review Changes
https://youtube.com/playlist?list=PLhNPruYZ0mVOF-poB1cDcU8ICktc_ehxs&si=7NNrrZA6Q5msCS01 i m following this playlist for the irctc so just wanted a readme for this with full all things epxlained ocrrcetly i would give u samplel but understand i hv not implemented the whole project but for readme u hv to create an overll so do not implement anything just make readme file so i hv given u the link of the youtube




<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" />
  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" />
  <img src="https://img.shields.io/badge/Apache_Kafka-231F20?style=for-the-badge&logo=apachekafka&logoColor=white" />
  <img src="https://img.shields.io/badge/Elasticsearch-005571?style=for-the-badge&logo=elasticsearch&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
  <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Razorpay-0C2451?style=for-the-badge&logo=razorpay&logoColor=white" />
</p>
# 🚆 IRCTC Railway Booking System
> A production-grade, **microservices-based** railway ticket booking platform inspired by [IRCTC](https://www.irctc.co.in/) — India's official rail booking system that handles **25M+ daily users** and **2000+ bookings/second** during peak hours.
> Built with **Node.js**, **Express**, **PostgreSQL**, **Redis**, **Apache Kafka**, **Elasticsearch**, **Razorpay**, and **React**.
---
## 📑 Table of Contents
- [Overview](#-overview)
- [System Architecture](#-system-architecture)
- [Microservices Breakdown](#-microservices-breakdown)
  - [API Gateway](#1-api-gateway)
  - [User Service](#2-user-service)
  - [Admin Service](#3-admin-service)
  - [Search Service](#4-search-service)
  - [Inventory Service](#5-inventory-service)
  - [Booking Service](#6-booking-service)
  - [Payment Service](#7-payment-service)
  - [Notification Service](#8-notification-service)
  - [Frontend](#9-frontend-react)
- [The Complete Booking Flow](#-the-complete-booking-flow)
- [Key Design Patterns & Concepts](#-key-design-patterns--concepts)
- [Database Design](#-database-design)
- [Kafka Event Topology](#-kafka-event-topology)
- [Tech Stack](#-tech-stack)
- [Infrastructure (Docker Compose)](#-infrastructure-docker-compose)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [License](#-license)
---
## 🌐 Overview
This project is a **full-stack distributed system** that replicates the core functionality of India's IRCTC railway booking platform. It is designed as a **portfolio/resume project** to demonstrate industry-level understanding of:
- **Microservices Architecture** — 7 independently deployable services
- **Saga Orchestration Pattern** — for distributed transactions across booking, payment, and inventory
- **Event-Driven Architecture** — Apache Kafka for asynchronous, decoupled communication
- **Distributed Locking** — Redis Lua scripts + PostgreSQL advisory locks for concurrency control
- **Optimistic Concurrency Control** — versioned updates with Compare-And-Swap (CAS)
- **Idempotency** — every critical operation is safely retryable
- **Circuit Breaker Pattern** — API Gateway resilience against cascading service failures
- **Rate Limiting** — sliding window algorithm via Redis sorted sets
- **Segment-Based Booking** — passengers can book seats for partial journeys (e.g., Station A → Station C on a A → E route), and the same seat can be reused for non-overlapping segments
- **Payment Gateway Abstraction** — factory pattern allowing seamless switching between Razorpay, Stripe, etc.
- **Two-Token Authentication** — access + refresh token rotation with httpOnly cookies and device fingerprinting
---
## 🏗 System Architecture
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            FRONTEND (React + Zustand)                       │
│   Login/Register → Search Trains → Select Seats → Pay (Razorpay) → Status  │
└───────────────────────────────┬──────────────────────────────────────────────┘
                                │  HTTP
                                ▼
                    ┌───────────────────────┐
                    │      API GATEWAY      │   ← Circuit Breaker, Rate Limiting,
                    │      (Port 3000)      │      JWT Validation, Proxy
                    └───────┬───┬───┬───┬───┘
                            │   │   │   │
            ┌───────────────┘   │   │   └──────────────────┐
            │                   │   │                      │
            ▼                   ▼   ▼                      ▼
   ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌──────────────────┐
   │  USER SERVICE  │ │ SEARCH SERVICE │ │BOOKING SERVICE │ │ ADMIN SERVICE    │
   │  (Port 4001)   │ │  (Port 4003)   │ │  (Port 4005)   │ │  (Port 4002)     │
   │                │ │                │ │                │ │                  │
   │ Auth, OTP,     │ │ Elasticsearch  │ │ Saga           │ │ Trains, Routes,  │
   │ Profile, JWT   │ │ Train Search   │ │ Orchestrator   │ │ Schedules CRUD   │
   └────────────────┘ └────────────────┘ └──────┬─────────┘ └──────────────────┘
                                                │
                              ┌─────────────────┼──────────────────┐
                              │ HTTP (sync)      │ HTTP (sync)       │
                              ▼                  ▼                   │
                   ┌──────────────────┐ ┌──────────────────┐        │
                   │INVENTORY SERVICE │ │ PAYMENT SERVICE  │        │
                   │   (Port 4004)    │ │   (Port 4006)    │        │
                   │                  │ │                  │        │
                   │ Seat Locking,    │ │ Razorpay Orders, │        │
                   │ Segment Booking, │ │ Webhook Handler, │        │
                   │ Lock Expiry      │ │ Refunds          │        │
                   └──────────────────┘ └──────────────────┘        │
                                                                    │
            ┌───────────────────────────────────────────────────────┘
            │                  KAFKA EVENT BUS
            │  ┌──────────────────────────────────────────────────┐
            │  │  schedule.created    → inventory-service         │
            │  │  schedule.cancelled  → inventory + booking       │
            │  │  payment.success     → booking-service           │
            │  │  payment.failed      → booking-service           │
            │  │  booking.confirmed   → search + notification     │
            │  │  booking.cancelled   → notification              │
            │  │  booking.failed      → notification              │
            │  │  seat.availability   → search-service            │
            │  └──────────────────────────────────────────────────┘
            │
            ▼
   ┌──────────────────┐
   │  NOTIFICATION    │
   │  SERVICE         │
   │  (Port 4007)     │
   │                  │
   │ Email (SendGrid) │
   │ Booking Alerts   │
   └──────────────────┘
    ┌──────────┐  ┌──────────┐  ┌───────────────┐  ┌──────────┐
    │PostgreSQL│  │  Redis   │  │ Elasticsearch │  │  Kafka   │
    │  (5432)  │  │  (6379)  │  │    (9200)     │  │  (9092)  │
    └──────────┘  └──────────┘  └───────────────┘  └──────────┘
```
### Key Architectural Principles
|
 Principle 
|
 Implementation 
|
|
-----------
|
---------------
|
|
**
Database per Service
**
|
 Each microservice owns its own PostgreSQL schema — no shared tables 
|
|
**
Saga Orchestration
**
|
 Booking-service orchestrates multi-step distributed transactions 
|
|
**
Event Sourcing
**
|
 Kafka decouples services; events are the source of truth for async flows 
|
|
**
Distributed Locking
**
|
 Redis Lua scripts for atomic seat locking; PostgreSQL advisory locks for leader election 
|
|
**
Idempotency
**
|
 Every write operation uses idempotency keys — safe retries everywhere 
|
|
**
Fail-Fast
**
|
`FOR UPDATE NOWAIT`
 prevents slow cascading waits 
|
|
**
Zero Trust
**
|
 JWT validation at gateway level; httpOnly cookie-based auth 
|
---
## 🔧 Microservices Breakdown
### 1. API Gateway
> **The single entry point** for all client requests. Implements resilience patterns and security middleware.
|
 Feature 
|
 Details 
|
|
---------
|
---------
|
|
**
Port
**
|
`3000`
|
|
**
Proxy
**
|
 Custom Axios-based proxy middleware (not 
`http-proxy-middleware`
) 
|
|
**
Circuit Breaker
**
|
 3-state (CLOSED → OPEN → HALF_OPEN) per downstream service 
|
|
**
Rate Limiting
**
|
 Sliding Window Log via Redis Sorted Sets (ZSET) 
|
|
**
Rate Limit Strategies
**
|
 IP-based, User-based, Endpoint-specific, Combined 
|
|
**
Auth
**
|
 JWT validation & forwarding (
`Authorization`
 header pass-through) 
|
|
**
Header Sanitization
**
|
 Strips 
`host`
, recalculates 
`content-length`
|
|
**
Error Handling
**
|
 Transparent status forwarding (
`validateStatus: () => true`
) 
|
**Rate Limit Headers Injected:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1719700000
Retry-After: 300  (only on 429)
```
---
### 2. User Service
> **Handles authentication, authorization, and user management** with a highly secure two-token system.
|
 Feature 
|
 Details 
|
|
---------
|
---------
|
|
**
Port
**
|
`4001`
|
|
**
ORM
**
|
 Prisma v7 with 
`@prisma/adapter-pg`
|
|
**
Auth Strategy
**
|
 Access Token (15 min) + Refresh Token (7 days) in httpOnly cookies 
|
|
**
Token Rotation
**
|
 Every refresh generates new access + refresh tokens, invalidating old ones 
|
|
**
Device Fingerprinting
**
|
 Snapshot of device/browser to detect stolen refresh tokens 
|
|
**
OTP Verification
**
|
 Email-based OTP for registration with SendGrid 
|
|
**
Password Hashing
**
|
 bcrypt with salt rounds 
|
**Auth Endpoints:**
```
POST   /auth/register           — Register with email, name, password
POST   /auth/send-otp           — Send OTP to email (rate limited: 5/hour)
POST   /auth/verify-otp         — Verify OTP and activate account
POST   /auth/login              — Login → returns access + refresh tokens (httpOnly cookies)
POST   /auth/refresh            — Rotate tokens silently
POST   /auth/logout             — Invalidate refresh token
GET    /auth/profile            — Get current user profile
```
**Prisma Schema (User):**
```prisma
model User {
  id             String    @id @default(uuid())
  email          String    @unique
  name           String
  password       String?   // Optional for OAuth
  emailVerified  Boolean   @default(false)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
}
```
---
### 3. Admin Service
> **Administrative CRUD operations** for trains, routes, stations, and schedules. The "seed data" service.
|
 Feature 
|
 Details 
|
|
---------
|
---------
|
|
**
Port
**
|
`4002`
|
|
**
Purpose
**
|
 Create and manage trains, stations, routes (with stops), and schedules 
|
|
**
Events Published
**
|
`schedule.created`
, 
`schedule.cancelled`
 via Kafka 
|
**Key Endpoints:**
```
POST   /admin/trains             — Create a train (name, trainNumber, totalSeats)
POST   /admin/stations           — Create a station (name, code)
POST   /admin/routes             — Create a route with ordered stops
POST   /admin/schedules          — Create a schedule (train + route + date + prices)
PATCH  /admin/schedules/:id      — Update schedule status (ACTIVE / CANCELLED)
GET    /admin/trains             — List all trains
GET    /admin/routes             — List all routes with stops
```
**When a schedule is created**, the admin service publishes a `SCHEDULE_CREATED` Kafka event, which triggers the inventory service to initialize all seat records.
---
### 4. Search Service
> **Fast, fuzzy train search** powered by Elasticsearch.
|
 Feature 
|
 Details 
|
|
---------
|
---------
|
|
**
Port
**
|
`4003`
|
|
**
Search Engine
**
|
 Elasticsearch 8.12 
|
|
**
Data Sync
**
|
 Consumes Kafka events (
`booking.confirmed`
, 
`seat.availability`
) to keep search index updated 
|
|
**
Search Features
**
|
 Station name/code search, date filtering, availability counts 
|
**Endpoints:**
```
GET    /search/trains?from=NDLS&to=MMCT&date=2025-01-15
GET    /search/stations?q=mum               — Autocomplete station search
```
**How data flows into Elasticsearch:**
1. Admin creates a schedule → Kafka `schedule.created`
2. Inventory initializes seats → Kafka `seat.availability.updated`
3. Search service indexes the schedule with availability counts
4. On every booking/cancellation, availability is re-synced via Kafka events
---
### 5. Inventory Service
> **The seat state manager** — handles locking, unlocking, confirming, and releasing seats with support for segment-based booking.
|
 Feature 
|
 Details 
|
|
---------
|
---------
|
|
**
Port
**
|
`4004`
|
|
**
Concurrency Control
**
|
 PostgreSQL 
`FOR UPDATE NOWAIT`
 (pessimistic, fail-fast) 
|
|
**
Segment Booking
**
|
 Overlapping segment detection via 
`SeatSegmentLock`
 rows 
|
|
**
Lock Expiry
**
|
 Background job every 60s, single-instance via 
`pg_try_advisory_lock`
|
|
**
Aggregate Recounting
**
|
 Always recounts from actual rows (never increment/decrement) 
|
**Core Operations:**
|
 Operation 
|
 Endpoint 
|
 Trigger 
|
|
-----------
|
----------
|
---------
|
|
**
Get Seats
**
|
`GET /inventory/schedules/:id/seats?fromSeq&toSeq`
|
 Frontend seat selection 
|
|
**
Lock Seats
**
|
`POST /inventory/seats/lock`
|
 Booking saga step 1 
|
|
**
Unlock Seats
**
|
`POST /inventory/seats/unlock`
|
 Booking failure/cancellation 
|
|
**
Confirm Seats
**
|
`POST /inventory/seats/confirm`
|
 After payment success 
|
|
**
Cancel Booking
**
|
`POST /inventory/seats/cancel-booking`
|
 Post-payment cancellation 
|
|
**
Get Availability
**
|
`GET /inventory/schedules/:id/availability`
|
 Validation check 
|
**Segment Booking Explained:**
A train goes from Station A → B → C → D → E. User 1 books Seat S1 for A→C (segments 1-3). User 2 can still book the **same seat S1** for C→E (segments 3-5) because the segments don't overlap. The system uses `SeatSegmentLock` rows to track which segments of each seat are locked/booked:
```
Seat S1:
  ├── SeatSegmentLock { fromSeq: 1, toSeq: 3, status: BOOKED, user: User1 }
  └── SeatSegmentLock { fromSeq: 3, toSeq: 5, status: BOOKED, user: User2 }
```
Overlap detection formula: `newFromSeq < existing.toSeq AND newToSeq > existing.fromSeq`
**Lock Expiry Job:**
```
Runs every 60 seconds
  ├── Acquires PostgreSQL advisory lock (pg_try_advisory_lock(800001))
  │   └── Only ONE instance across all replicas runs the cleanup
  ├── Deletes expired SeatSegmentLock rows (status=LOCKED, lockExpiresAt < NOW)
  ├── Resets expired SeatInventory rows (status=LOCKED → AVAILABLE)
  ├── Recomputes affected seat statuses
  └── Publishes availability update events
```
---
### 6. Booking Service
> **The saga orchestrator** — coordinates the entire distributed booking transaction across inventory and payment services.
|
 Feature 
|
 Details 
|
|
---------
|
---------
|
|
**
Port
**
|
`4005`
|
|
**
Pattern
**
|
 Saga Orchestration (not Choreography) 
|
|
**
Concurrency
**
|
 Optimistic locking with version field (Compare-And-Swap) 
|
|
**
Distributed Locks
**
|
 Redis Lua scripts for atomic all-or-nothing seat locking 
|
|
**
Idempotency
**
|
`IdempotencyRecord`
 table prevents duplicate bookings 
|
**Booking State Machine:**
```
PENDING → SEATS_HELD → PAYMENT_PENDING → CONFIRMING → CONFIRMED
   │          │              │                            │
   │          │              │                            ▼
   │          │              │                        CANCELLED
   │          │              │                     (post-confirm)
   │          │              ▼
   └──────────┴──────── FAILED / EXPIRED
                     (compensating txns)
```
**Saga Steps:**
|
 Step 
|
 Action 
|
 Service Called 
|
 Compensation (on failure) 
|
|
------
|
--------
|
---------------
|
--------------------------
|
|
 1 
|
**
Hold Seats
**
|
 Inventory Service (
`POST /seats/lock`
) 
|
 Release Seats (
`POST /seats/unlock`
) 
|
|
 2 
|
**
Create Payment
**
|
 Payment Service (
`POST /orders`
) 
|
_
(no compensation needed — order just expires)
_
|
|
 3 
|
**
Confirm Seats
**
|
 Inventory Service (
`POST /seats/confirm`
) 
|
 Cancel Booking (
`POST /seats/cancel-booking`
) 
|
**Redis Distributed Lock (Lua Script):**
```lua
-- Atomic all-or-nothing lock acquisition
-- Keys are sorted to prevent deadlocks
for i, key in ipairs(KEYS) do
  local ok = redis.call('SET', key, ARGV[1], 'NX', 'EX', ARGV[2])
  if not ok then
    -- ROLLBACK: delete all previously acquired locks
    for j = 1, i - 1 do
      redis.call('DEL', KEYS[j])
    end
    return 0  -- Failed
  end
end
return 1  -- All seats locked
```
**Key Endpoints:**
```
POST   /bookings/bookings                        — Create booking (with idempotency key)
GET    /bookings/bookings/:id                    — Get booking status (for polling)
POST   /bookings/bookings/:id/verify-payment     — Verify Razorpay payment
POST   /bookings/bookings/:id/cancel             — Cancel a confirmed booking
GET    /bookings/bookings/user/my-bookings       — User's booking history
```
---
### 7. Payment Service
> **Razorpay integration** with webhook handling, signature verification, refund processing, and gateway abstraction.
|
 Feature 
|
 Details 
|
|
---------
|
---------
|
|
**
Port
**
|
`4006`
|
|
**
Gateway
**
|
 Razorpay (abstracted via Factory Pattern — Stripe-ready) 
|
|
**
Webhooks
**
|
 Handles 
`payment.captured`
, 
`payment.failed`
, 
`refund.processed`
|
|
**
Security
**
|
 HMAC-SHA256 signature verification, 
`crypto.timingSafeEqual()`
|
|
**
Audit Trail
**
|
 Full 
`PaymentAuditLog`
 for every state transition 
|
**Payment State Machine:**
```
CREATED ──→ CAPTURED ──→ REFUND_INITIATED ──→ REFUNDED
   │                         │
   │                         └──→ PARTIALLY_REFUNDED
   ▼
 FAILED
```
**Dual Verification Paths:**
|
 Path 
|
 Trigger 
|
 Purpose 
|
|
------
|
---------
|
---------
|
|
**
Client-Side
**
|
 Frontend calls 
`/verify-payment`
 after Razorpay modal 
|
 Fast confirmation 
|
|
**
Webhook
**
|
 Razorpay POSTs to 
`/webhooks/razorpay`
|
 Reliable fallback (even if client fails) 
|
Both paths are idempotent — if both arrive, only the first one processes; the second returns immediately.
**Gateway Abstraction (Factory Pattern):**
```
              ┌───────────────────┐
              │ BasePaymentGateway│  (Abstract)
              │ - createOrder()   │
              │ - verifySignature│
              │ - initiateRefund()│
              └────────┬──────────┘
                       │
          ┌────────────┴────────────┐
          │                         │
┌─────────┴─────────┐   ┌──────────┴──────────┐
│ RazorpayGateway   │   │  StripeGateway      │
│ (implemented)     │   │  (plug & play)      │
└───────────────────┘   └─────────────────────┘
```
---
### 8. Notification Service
> **Email notifications** for booking confirmations, cancellations, and failures via SendGrid.
|
 Feature 
|
 Details 
|
|
---------
|
---------
|
|
**
Port
**
|
`4007`
|
|
**
Email Provider
**
|
 SendGrid (
`@sendgrid/mail`
) 
|
|
**
Trigger
**
|
 Kafka consumer — listens to 
`booking.confirmed`
, 
`booking.cancelled`
, 
`booking.failed`
|
|
**
Templates
**
|
 HTML email templates for different booking states 
|
---
### 9. Frontend (React)
> **Modern React SPA** with Zustand state management, Razorpay integration, and real-time status polling.
|
 Feature 
|
 Details 
|
|
---------
|
---------
|
|
**
Framework
**
|
 React (Vite) 
|
|
**
State Management
**
|
 Zustand (lightweight, minimal boilerplate) 
|
|
**
API Layer
**
|
 Axios with interceptors for auto token refresh 
|
|
**
Payment UI
**
|
 Razorpay Checkout (dynamically loaded SDK) 
|
|
**
Forms
**
|
 React Hook Form with validation 
|
**User Journey:**
```
Search Trains → Select Train → Pick Seats (color-coded grid) →
Fill Passenger Details → Confirm & Pay → Razorpay Modal →
Status Polling → Booking Confirmed ✅
```
**Seat Status Colors:**
- 🟢 **Green** — Available
- 🟡 **Yellow** — Locked (someone is booking)
- 🔴 **Red** — Booked
---
## 🔄 The Complete Booking Flow
A step-by-step walkthrough of what happens from seat selection to confirmation:
```
USER                    FRONTEND              API GATEWAY          BOOKING SVC         INVENTORY SVC        PAYMENT SVC           KAFKA
 │                         │                      │                    │                    │                    │                   │
 │  1. Select Seats        │                      │                    │                    │                    │                   │
 ├────────────────────────►│  GET /seats           │                    │                    │                    │                   │
 │                         ├─────────────────────►│─────────────────────────────────────────►│                    │                   │
 │                         │◄────────────────────────────────────────────────────────────────┤  seat availability │                   │
 │  ◄─────────────────────┤  render seat grid     │                    │                    │                    │                   │
 │                         │                      │                    │                    │                    │                   │
 │  2. Fill Passengers     │                      │                    │                    │                    │                   │
 │  3. "Confirm & Pay"     │                      │                    │                    │                    │                   │
 ├────────────────────────►│  POST /bookings       │                    │                    │                    │                   │
 │                         ├─────────────────────►│───────────────────►│                    │                    │                   │
 │                         │                      │                    │                    │                    │                   │
 │                         │                      │                    │─── Redis Lock ─────│                    │                   │
 │                         │                      │                    │  (Lua: all-or-none)│                    │                   │
 │                         │                      │                    │                    │                    │                   │
 │                         │                      │                    │── SAGA Step 1 ────►│  lockSeats()       │                   │
 │                         │                      │                    │  POST /seats/lock   │  FOR UPDATE NOWAIT │                   │
 │                         │                      │                    │◄────────────────────┤                    │                   │
 │                         │                      │                    │                    │                    │                   │
 │                         │                      │                    │── SAGA Step 2 ─────────────────────────►│  createOrder()    │
 │                         │                      │                    │  POST /orders       │                    │  Razorpay API     │
 │                         │                      │                    │◄──────────────────────────────────────── │  gatewayOrderId   │
 │                         │                      │                    │                    │                    │                   │
 │                         │◄─────────────────────│◄──────────────────┤  booking + paymentOrder                 │                   │
 │  ◄─────────────────────┤                      │                    │                    │                    │                   │
 │                         │                      │                    │                    │                    │                   │
 │  4. Razorpay Modal      │                      │                    │                    │                    │                   │
 │  (enter card/UPI)       │                      │                    │                    │                    │                   │
 │                         │                      │                    │                    │                    │                   │
 │  5. Payment Success     │                      │                    │                    │                    │                   │
 ├────────────────────────►│  POST /verify-payment │                    │                    │                    │                   │
 │                         ├─────────────────────►│───────────────────►│────────────────────────────────────────►│  verify signature │
 │                         │                      │                    │                    │                    │──── PAYMENT_SUCCESS ──►│
 │                         │                      │                    │◄────────────────────────────────────────────────────────────────┤
 │                         │                      │                    │                    │                    │                   │
 │                         │                      │                    │── SAGA Step 3 ────►│  confirmSeats()    │                   │
 │                         │                      │                    │  POST /seats/confirm│  LOCKED → BOOKED  │                   │
 │                         │                      │                    │◄────────────────────┤                    │                   │
 │                         │                      │                    │                    │                    │                   │
 │                         │                      │                    │──── BOOKING_CONFIRMED ──────────────────────────────────────►│
 │                         │                      │                    │                    │                    │                   │
 │  6. Poll Status         │                      │                    │                    │                    │                   │
 ├────────────────────────►│  GET /bookings/:id    │                    │                    │                    │                   │
 │  ◄─────────────────────┤  status: CONFIRMED ✅ │                    │                    │                    │                   │
```
---
## 🧠 Key Design Patterns & Concepts
### 1. Saga Orchestration Pattern
The **booking-service** acts as the central orchestrator that coordinates distributed transactions. Unlike choreography (where each service triggers the next), the orchestrator knows the full workflow and handles compensating transactions on failure.
### 2. Distributed Locking (Redis + Lua)
When a user selects seats, the system acquires **atomic, all-or-nothing** locks using a Redis Lua script. Seat IDs are **sorted before locking** to prevent deadlocks. Lock keys include segment information (`fromSeq:toSeq`) to allow the same seat to be booked for non-overlapping journey segments.
### 3. Optimistic Concurrency Control (CAS)
Every `Booking` and `PaymentOrder` row has a `version` field. Updates use `WHERE id = ? AND version = ?` — if the version has changed (another process updated it), the update returns `count: 0` and a `StaleStateError` is thrown. This prevents race conditions without heavy locking.
### 4. Idempotency
Every critical write operation checks an `IdempotencyRecord` table before executing. If the same `idempotencyKey` is seen again, the cached response is returned immediately. This makes the system safe against network retries and duplicate requests.
### 5. Circuit Breaker
The API Gateway wraps each downstream service call in a Circuit Breaker:
- **CLOSED** — requests flow normally
- **OPEN** — failures exceeded threshold → instant `503 Service Unavailable`
- **HALF_OPEN** — after timeout, allows one test request to check recovery
### 6. Sliding Window Rate Limiting
Instead of a fixed window counter (which has burst issues at window edges), the system uses Redis Sorted Sets to track exact request timestamps, enabling a true sliding window algorithm.
### 7. Two-Token Authentication with Rotation
- **Access Token** (15 min) — used for every API request
- **Refresh Token** (7 days) — used only to get new access tokens
- Both stored in **httpOnly cookies** (immune to XSS)
- On every refresh, **both tokens are rotated** — old refresh token is invalidated
- **Device fingerprinting** ensures refresh tokens can't be reused from a different device
### 8. Segment-Based Booking
The system supports partial journey bookings. A train with route A→B→C→D can have Seat S1 booked by User 1 for A→C, and by User 2 for C→D. Overlap is detected at the database level with segment lock rows.
### 9. Event-Driven Communication
Services communicate asynchronously via Kafka topics. This means:
- Services don't need to know about each other
- If notification-service is down, messages queue up and process when it recovers
- Eventual consistency is achieved without distributed transactions
### 10. Gateway Abstraction (Factory Pattern)
The payment service uses a factory pattern (`gateway.factory.js`) to create the appropriate payment gateway. Switching from Razorpay to Stripe requires only implementing the `BasePaymentGateway` interface and updating an environment variable.
---
## 💾 Database Design
Each service owns its database schema (Database per Service pattern):
### User Service
|
 Table 
|
 Key Fields 
|
|
-------
|
-----------
|
|
`User`
|
 id (UUID), email (unique), name, password, emailVerified 
|
|
`RefreshToken`
|
 token, userId, deviceFingerprint, expiresAt 
|
|
`Otp`
|
 email, code, expiresAt, verified 
|
### Booking Service
|
 Table 
|
 Key Fields 
|
|
-------
|
-----------
|
|
`Booking`
|
 id, userId, scheduleId, status, totalAmount, version, lockExpiresAt, fromSeq, toSeq 
|
|
`BookingSeat`
|
 bookingId, seatId, seatNumber, price 
|
|
`Passenger`
|
 bookingId, name, age, gender, seatId 
|
|
`SagaLog`
|
 bookingId, step (HOLD_SEATS/CREATE_PAYMENT/CONFIRM_SEATS), status, error 
|
|
`IdempotencyRecord`
|
 eventKey (unique), response (JSON) 
|
### Inventory Service
|
 Table 
|
 Key Fields 
|
|
-------
|
-----------
|
|
`ScheduleInventory`
|
 scheduleId, totalSeats, available, locked, booked, status 
|
|
`SeatInventory`
|
 scheduleId, seatId, seatNumber, seatType, price, status, lockedBy, bookingId 
|
|
`SeatSegmentLock`
|
 seatInventoryId, fromSeq, toSeq, status (LOCKED/BOOKED), lockedBy, bookingId 
|
|
`RouteStop`
|
 scheduleId, stationId, stationName, sequenceNumber 
|
|
`IdempotencyRecord`
|
 eventKey, response 
|
### Payment Service
|
 Table 
|
 Key Fields 
|
|
-------
|
-----------
|
|
`PaymentOrder`
|
 id, bookingId, amount, currency, status, gatewayOrderId, gatewayPaymentId, version 
|
|
`Refund`
|
 paymentOrderId, amount, status, gatewayRefundId, reason 
|
|
`PaymentAuditLog`
|
 paymentOrderId, action, metadata (JSON), timestamp 
|
|
`IdempotencyRecord`
|
 eventKey, response 
|
---
## 📡 Kafka Event Topology
```
┌──────────────────────┐     ┌──────────────────────┐     ┌──────────────────────┐
│    ADMIN SERVICE     │     │   PAYMENT SERVICE    │     │   BOOKING SERVICE    │
│                      │     │                      │     │                      │
│  Publishes:          │     │  Publishes:          │     │  Publishes:          │
│  • schedule.created  │     │  • payment.success   │     │  • booking.confirmed │
│  • schedule.cancelled│     │  • payment.failed    │     │  • booking.cancelled │
└──────────┬───────────┘     └──────────┬───────────┘     │  • booking.failed    │
           │                            │                  └──────────┬───────────┘
           ▼                            ▼                             ▼
    ┌──────────────────────────────────────────────────────────────────────────┐
    │                           APACHE KAFKA                                  │
    │                                                                          │
    │  Topics:                                                                 │
    │  ┌─────────────────────┐  ┌─────────────────────┐  ┌──────────────────┐ │
    │  │ schedule.created    │  │ payment.success     │  │ booking.confirmed│ │
    │  │ schedule.cancelled  │  │ payment.failed      │  │ booking.cancelled│ │
    │  │ seat.availability   │  │                     │  │ booking.failed   │ │
    │  └─────────────────────┘  └─────────────────────┘  └──────────────────┘ │
    └───────┬──────────────────────────┬──────────────────────────┬────────────┘
            │                          │                          │
            ▼                          ▼                          ▼
   ┌────────────────┐       ┌──────────────────┐      ┌───────────────────┐
   │INVENTORY SVC   │       │  BOOKING SVC     │      │NOTIFICATION SVC   │
   │                │       │                  │      │                   │
   │Consumes:       │       │Consumes:         │      │Consumes:          │
   │• schedule.*    │       │• payment.success │      │• booking.confirmed│
   │• seat.avail.   │       │• payment.failed  │      │• booking.cancelled│
   └────────────────┘       │• schedule.cancel │      │• booking.failed   │
                            └──────────────────┘      └───────────────────┘
```
---
## 🛠 Tech Stack
|
 Layer 
|
 Technology 
|
 Purpose 
|
|
-------
|
-----------
|
---------
|
|
**
Runtime
**
|
 Node.js 
|
 Server-side JavaScript 
|
|
**
Framework
**
|
 Express.js 
|
 HTTP server for each microservice 
|
|
**
ORM
**
|
 Prisma v7 
|
 Type-safe database access with migrations 
|
|
**
Primary DB
**
|
 PostgreSQL 15 
|
 Relational data storage (per-service isolation) 
|
|
**
Cache / Locks
**
|
 Redis (redis-stack 6.2) 
|
 Distributed locking (Lua), rate limiting (ZSET), caching 
|
|
**
Message Broker
**
|
 Apache Kafka (Confluent 7.5) 
|
 Async event-driven communication between services 
|
|
**
Search Engine
**
|
 Elasticsearch 8.12 
|
 Full-text train/station search 
|
|
**
Payment
**
|
 Razorpay 
|
 Payment orders, verification, webhooks, refunds 
|
|
**
Email
**
|
 SendGrid 
|
 Transactional email notifications 
|
|
**
Frontend
**
|
 React + Vite 
|
 Single-page application 
|
|
**
State Mgmt
**
|
 Zustand 
|
 Lightweight React state management 
|
|
**
HTTP Client
**
|
 Axios 
|
 API calls with interceptors for token refresh 
|
|
**
Containerization
**
|
 Docker Compose 
|
 Local development infrastructure 
|
|
**
Logging
**
|
 Winston 
|
 Structured logging across all services 
|
|
**
DB Admin
**
|
 pgAdmin 4 
|
 PostgreSQL web admin (port 8081) 
|
|
**
Kafka Admin
**
|
 Kafka UI 
|
 Kafka web admin (port 8080) 
|
|
**
Search Admin
**
|
 Kibana 
|
 Elasticsearch dashboard (port 5601) 
|
---
## 🐳 Infrastructure (Docker Compose)
All infrastructure services are containerized via `docker-compose.yaml`:
|
 Service 
|
 Image 
|
 Port(s) 
|
 Purpose 
|
|
---------
|
-------
|
---------
|
---------
|
|
**
PostgreSQL
**
|
`postgres:15`
|
`5432`
|
 Primary database 
|
|
**
pgAdmin
**
|
`dpage/pgadmin4`
|
`8081`
|
 DB admin UI 
|
|
**
Redis
**
|
`redis/redis-stack:6.2.6-v19`
|
`6379`
, 
`8001`
|
 Caching + distributed locks 
|
|
**
Zookeeper
**
|
`confluentinc/cp-zookeeper:7.5.0`
|
`2181`
|
 Kafka coordination 
|
|
**
Kafka
**
|
`confluentinc/cp-kafka:7.5.0`
|
`9092`
, 
`9093`
|
 Message broker 
|
|
**
Kafka UI
**
|
`provectuslabs/kafka-ui`
|
`8080`
|
 Kafka admin dashboard 
|
|
**
Elasticsearch
**
|
`elasticsearch:8.12.0`
|
`9200`
|
 Search engine 
|
|
**
Kibana
**
|
`kibana:8.12.0`
|
`5601`
|
 Elasticsearch dashboard 
|
All services are connected via a shared Docker bridge network (`irctc-network`) with persistent volumes.
---
## 📁 Project Structure
```
IRCTC/
├── docker-compose.yaml          # Infrastructure (PostgreSQL, Redis, Kafka, ES)
├── package.json                 # Root shared dependencies
│
├── shared/                      # Shared utilities across services
│   ├── src/
│   │   ├── kafka/               # Kafka producer/consumer base classes
│   │   ├── redis/               # Redis client configuration
│   │   ├── logger/              # Winston logger setup
│   │   ├── errors/              # Custom error classes (NotFound, Conflict, etc.)
│   │   └── middleware/          # Shared Express middleware
│   └── package.json
│
├── api-gateway/                 # API Gateway (Port 3000)
│   ├── src/
│   │   ├── middleware/
│   │   │   ├── proxy.js         # Custom Axios-based proxy
│   │   │   ├── circuitBreaker.js# Circuit Breaker implementation
│   │   │   ├── rateLimiter.js   # Sliding window rate limiter
│   │   │   └── auth.js          # JWT validation middleware
│   │   ├── routes/              # Route definitions per service
│   │   └── index.js             # Gateway entry point
│   └── package.json
│
├── User-Service/                # User & Auth Service (Port 4001)
│   ├── prisma/
│   │   └── schema.prisma        # User, RefreshToken, OTP models
│   ├── src/
│   │   ├── controllers/         # Auth controller
│   │   ├── services/            # Auth service (login, register, OTP)
│   │   ├── middleware/          # Auth middleware
│   │   ├── utils/               # JWT helpers, device fingerprint
│   │   └── index.js
│   └── package.json
│
├── admin-service/               # Admin Service (Port 4002)
│   ├── prisma/
│   │   └── schema.prisma        # Train, Station, Route, Schedule models
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── kafka/producer/      # Publishes schedule events
│   │   └── index.js
│   └── package.json
│
├── search-service/              # Search Service (Port 4003)
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── elasticsearch/       # Index management, queries
│   │   ├── kafka/consumer/      # Consumes availability events
│   │   └── index.js
│   └── package.json
│
├── inventory-service/           # Inventory Service (Port 4004)
│   ├── prisma/
│   │   └── schema.prisma        # ScheduleInventory, SeatInventory, SeatSegmentLock
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   │   └── inventory.service.js  # Core: lock/unlock/confirm/cancel
│   │   ├── kafka/
│   │   │   ├── consumer/        # Consumes schedule.created
│   │   │   └── producer/        # Publishes seat.availability.updated
│   │   ├── utils/
│   │   │   └── lockExpiry.js    # Background lock cleanup job
│   │   └── index.js
│   └── package.json
│
├── booking-service/             # Booking Service (Port 4005)
│   ├── prisma/
│   │   └── schema.prisma        # Booking, BookingSeat, Passenger, SagaLog
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   │   ├── booking.service.js    # Orchestrator
│   │   │   └── saga.service.js       # Saga step execution
│   │   ├── kafka/
│   │   │   ├── consumer/        # Consumes payment.success/failed
│   │   │   └── producer/        # Publishes booking.confirmed/cancelled
│   │   ├── clients/             # HTTP clients for inventory & payment
│   │   ├── utils/
│   │   │   └── distributedLock.js    # Redis Lua lock scripts
│   │   └── index.js
│   └── package.json
│
├── (payment-service/)           # Payment Service (Port 4006)
│   ├── prisma/
│   │   └── schema.prisma        # PaymentOrder, Refund, PaymentAuditLog
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── payment.controller.js
│   │   │   └── webhook.controller.js # Razorpay webhook handler
│   │   ├── services/
│   │   │   ├── payment.service.js
│   │   │   └── gateways/
│   │   │       ├── base.gateway.js        # Abstract interface
│   │   │       ├── razorpay.gateway.js    # Razorpay implementation
│   │   │       └── gateway.factory.js     # Factory pattern
│   │   ├── kafka/producer/      # Publishes payment.success/failed
│   │   └── index.js
│   └── package.json
│
├── Notification-Service/        # Notification Service (Port 4007)
│   ├── src/
│   │   ├── services/            # Email templates & sending logic
│   │   ├── kafka/consumer/      # Consumes booking events
│   │   └── index.js
│   └── package.json
│
└── frontend/                    # React Frontend
    ├── src/
    │   ├── components/
    │   │   ├── auth/            # Login, Register, OTP forms
    │   │   ├── search/          # Train search, results
    │   │   ├── seats/           # Seat grid, SeatTile
    │   │   ├── booking/         # PassengerForm, PaymentButton, StatusPoller
    │   │   └── common/          # Shared UI components
    │   ├── store/               # Zustand stores (auth, booking, search)
    │   ├── api/                 # Axios API layer
    │   ├── hooks/               # Custom React hooks
    │   └── App.jsx
    ├── package.json
    └── vite.config.js
```
---
## 🚀 Getting Started
### Prerequisites
- **Node.js** ≥ 18.x
- **Docker** & **Docker Compose**
- **Razorpay Account** (test mode) — [Sign up here](https://dashboard.razorpay.com/signup)
- **SendGrid Account** — [Sign up here](https://signup.sendgrid.com/)
### 1. Clone the Repository
```bash
git clone https://github.com/Rudy-123/IRCTC.git
cd IRCTC
```
### 2. Start Infrastructure (Docker)
```bash
docker compose up -d
```
This starts PostgreSQL, Redis, Kafka, Zookeeper, Elasticsearch, and their admin UIs.
### 3. Install Dependencies
```bash
# Root shared dependencies
npm install
# Install for each service
cd User-Service && npm install && cd ..
cd admin-service && npm install && cd ..
cd search-service && npm install && cd ..
cd inventory-service && npm install && cd ..
cd booking-service && npm install && cd ..
cd Notification-Service && npm install && cd ..
cd api-gateway && npm install && cd ..
cd frontend && npm install && cd ..
```
### 4. Set Up Environment Variables
Create `.env` files in each service directory (see [Environment Variables](#-environment-variables) section).
### 5. Run Prisma Migrations
```bash
# For each service with a Prisma schema:
cd User-Service && npx prisma migrate dev && cd ..
cd admin-service && npx prisma migrate dev && cd ..
cd inventory-service && npx prisma migrate dev && cd ..
cd booking-service && npx prisma migrate dev && cd ..
```
### 6. Start All Services
```bash
# Start each service in a separate terminal:
cd api-gateway && npm run dev
cd User-Service && npm run dev
cd admin-service && npm run dev
cd search-service && npm run dev
cd inventory-service && npm run dev
cd booking-service && npm run dev
cd Notification-Service && npm run dev
cd frontend && npm run dev
```
---
## 🔐 Environment Variables
Each service requires its own `.env` file. Here's a template:
### Shared Variables
```env
DATABASE_URL=postgresql://admin:irctcpass@localhost:5432/your_service_db
REDIS_URL=redis://:irctcpass@localhost:6379
KAFKA_BROKERS=localhost:9093
NODE_ENV=development
```
### User Service
```env
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```
### Payment Service
```env
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxx
PAYMENT_GATEWAY=razorpay
```
### API Gateway
```env
USER_SERVICE_URL=http://localhost:4001
ADMIN_SERVICE_URL=http://localhost:4002
SEARCH_SERVICE_URL=http://localhost:4003
INVENTORY_SERVICE_URL=http://localhost:4004
BOOKING_SERVICE_URL=http://localhost:4005
PAYMENT_SERVICE_URL=http://localhost:4006
SERVICE_TIMEOUT_MS=5000
```
---
## 📚 API Reference
### Authentication
|
 Method 
|
 Endpoint 
|
 Auth 
|
 Description 
|
|
--------
|
----------
|
------
|
-------------
|
|
`POST`
|
`/api/users/auth/register`
|
 ❌ 
|
 Register new user 
|
|
`POST`
|
`/api/users/auth/send-otp`
|
 ❌ 
|
 Send OTP to email 
|
|
`POST`
|
`/api/users/auth/verify-otp`
|
 ❌ 
|
 Verify email OTP 
|
|
`POST`
|
`/api/users/auth/login`
|
 ❌ 
|
 Login (returns httpOnly cookies) 
|
|
`POST`
|
`/api/users/auth/refresh`
|
 🍪 
|
 Rotate tokens 
|
|
`POST`
|
`/api/users/auth/logout`
|
 ✅ 
|
 Invalidate session 
|
|
`GET`
|
`/api/users/auth/profile`
|
 ✅ 
|
 Get user profile 
|
### Admin (Train Management)
|
 Method 
|
 Endpoint 
|
 Auth 
|
 Description 
|
|
--------
|
----------
|
------
|
-------------
|
|
`POST`
|
`/api/admin/trains`
|
 ✅ Admin 
|
 Create train 
|
|
`POST`
|
`/api/admin/stations`
|
 ✅ Admin 
|
 Create station 
|
|
`POST`
|
`/api/admin/routes`
|
 ✅ Admin 
|
 Create route with stops 
|
|
`POST`
|
`/api/admin/schedules`
|
 ✅ Admin 
|
 Create schedule (publishes Kafka event) 
|
|
`PATCH`
|
`/api/admin/schedules/:id`
|
 ✅ Admin 
|
 Update schedule status 
|
### Search
|
 Method 
|
 Endpoint 
|
 Auth 
|
 Description 
|
|
--------
|
----------
|
------
|
-------------
|
|
`GET`
|
`/api/search/trains`
|
 ❌ 
|
 Search trains (from, to, date) 
|
|
`GET`
|
`/api/search/stations`
|
 ❌ 
|
 Autocomplete station search 
|
### Inventory
|
 Method 
|
 Endpoint 
|
 Auth 
|
 Description 
|
|
--------
|
----------
|
------
|
-------------
|
|
`GET`
|
`/api/inventory/schedules/:id/seats`
|
 ✅ 
|
 Get seat availability (with segment params) 
|
|
`GET`
|
`/api/inventory/schedules/:id/availability`
|
 ✅ 
|
 Get aggregate availability 
|
### Booking
|
 Method 
|
 Endpoint 
|
 Auth 
|
 Description 
|
|
--------
|
----------
|
------
|
-------------
|
|
`POST`
|
`/api/bookings/bookings`
|
 ✅ 
|
 Create booking (triggers saga) 
|
|
`GET`
|
`/api/bookings/bookings/:id`
|
 ✅ 
|
 Get booking status 
|
|
`POST`
|
`/api/bookings/bookings/:id/verify-payment`
|
 ✅ 
|
 Verify Razorpay payment 
|
|
`POST`
|
`/api/bookings/bookings/:id/cancel`
|
 ✅ 
|
 Cancel booking (triggers refund) 
|
|
`GET`
|
`/api/bookings/bookings/user/my-bookings`
|
 ✅ 
|
 User's booking history 
|
### Payment (Internal)
|
 Method 
|
 Endpoint 
|
 Auth 
|
 Description 
|
|
--------
|
----------
|
------
|
-------------
|
|
`POST`
|
`/payments/orders`
|
 Internal 
|
 Create payment order 
|
|
`POST`
|
`/payments/orders/:id/verify`
|
 Internal 
|
 Verify & capture payment 
|
|
`POST`
|
`/payments/refunds`
|
 Internal 
|
 Initiate refund 
|
|
`POST`
|
`/webhooks/razorpay`
|
 Signature 
|
 Razorpay webhook handler 
|
---
## 📝 License
This project is built for educational and portfolio purposes. It is not affiliated with or endorsed by Indian Railway Catering and Tourism Corporation (IRCTC).
---
<p align="center">
  <b>Built with ❤️ as a portfolio project to demonstrate production-grade distributed systems engineering.</b>
</p>

