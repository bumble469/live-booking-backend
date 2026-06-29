# Showaholic — Backend

A learning project exploring the concurrency mechanics behind real-world cinema seat booking systems — seat locking, race condition prevention, real-time updates, and transactional safety — modelled after BookMyShow.

Built with **Fastify + Node.js + TypeScript**, raw **PostgreSQL**, and **Socket.IO**.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (ESM, `"type": "module"`) |
| Framework | Fastify 5 |
| Language | TypeScript (`NodeNext` module resolution, `.js` extensions on imports) |
| Database | PostgreSQL via `pg` pool — no ORM |
| Real-time | Socket.IO 4 |
| Email | Resend |
| Dev server | `tsx watch` |

---

## Architecture

Vertical slice pattern — each feature module is self-contained:

```
src/
├── modules/
│   ├── shows/
│   │   ├── show_types.ts
│   │   ├── show_repository.ts   ← raw SQL queries
│   │   ├── show_service.ts      ← business logic
│   │   ├── show_controller.ts   ← request/response handling
│   │   └── show_route.ts        ← Fastify route registration
│   ├── screenings/
│   ├── theaters/
│   ├── screens/
│   ├── seats/
│   ├── locks/
│   ├── bookings/
│   └── verification/
├── websockets/
│   └── socket.ts                ← Socket.IO init + emit helpers
├── utils/
│   ├── lockExpiry.ts            ← background lock expiry job
│   ├── bookingReference.ts      ← crypto-safe reference generator
│   ├── mailer.ts                ← Resend client
│   └── otpStore.ts              ← in-memory OTP store (Map + 3-min TTL)
├── config/
│   └── environment.ts           ← typed env var validation
├── db/
│   └── pool.ts                  ← pg pool singleton
├── app.ts                       ← Fastify app builder
└── server.ts                    ← entry point
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+

### Installation

```bash
cd live-booking-backend
npm install
```

### Environment Variables

Create a `.env` file in `live-booking-backend/`:

```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/showaholic
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
FRONTEND_URL=http://localhost:5173
PORT=3000
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | Full PostgreSQL connection string |
| `RESEND_API_KEY` | API key from [resend.com](https://resend.com) |
| `FRONTEND_URL` | Used to generate cancel links in booking emails |
| `PORT` | Server port (defaults to `3000`) |

### Database Setup

Create the database and run the schema:

```bash
psql -U postgres -c "CREATE DATABASE showaholic;"
psql -U postgres -d showaholic -f schema.sql
```

Then seed shows and screenings (covers the current calendar month):

```bash
psql -U postgres -d showaholic -f seed.sql
```

### Running

```bash
# Development (hot reload)
npm run dev

# Production
npm run build
npm run start
```

---

## API Routes

### Health
| Method | Route | Description |
|---|---|---|
| GET | `/api/health` | Returns `{ status: "ok" }` |

### Shows
| Method | Route | Description |
|---|---|---|
| GET | `/api/shows` | All shows |
| GET | `/api/shows/:showId` | Single show |

### Theaters
| Method | Route | Description |
|---|---|---|
| GET | `/api/theaters` | All theaters |

### Screenings
| Method | Route | Description |
|---|---|---|
| GET | `/api/screenings?showId=&theatreId=` | Screenings for a show (next 7 days) |
| GET | `/api/screenings/:screeningId` | Single screening detail |
| GET | `/api/screenings/:screeningId/seats` | All seats with live status for a screening |

### Locks
| Method | Route | Description |
|---|---|---|
| POST | `/api/locks` | Lock a seat `{ seatId, screeningId, sessionId }` |
| POST | `/api/locks/release` | Release a lock `{ seatId, screeningId, sessionId }` |

### Bookings
| Method | Route | Description |
|---|---|---|
| POST | `/api/bookings` | Confirm booking for locked seats |
| GET | `/api/bookings/cancel?ref=&email=` | Look up a booking for cancellation |
| POST | `/api/bookings/cancel` | Cancel a booking `{ ref, email }` |

### Verification (OTP)
| Method | Route | Description |
|---|---|---|
| POST | `/api/verification/send` | Send OTP to email |
| POST | `/api/verification/confirm` | Verify OTP `{ email, otp }` |

---

## WebSocket Events

Clients join a room per screening: `socket.emit('join_screening', screeningId)`

### Server → Client

| Event | Payload | When |
|---|---|---|
| `seat_locked` | `{ seatId, screeningId, lockedBy, lockExpiresAt }` | A seat is locked by any user |
| `seat_unlocked` | `{ seatId, screeningId }` | A seat is manually released or expires |
| `seat_booked` | `{ seatIds[], screeningId }` | A booking is confirmed |
| `availability_update` | `{ screeningId, availableSeats, totalSeats }` | After any seat status change |

### Client → Server

| Event | Payload | When |
|---|---|---|
| `join_screening` | `screeningId` | User opens the seat selection page |
| `leave_screening` | `screeningId` | User leaves the seat selection page |

---

## Lock Expiry Job

Seats are locked for **5 minutes**. A background job runs every **30 seconds** to release expired locks:

```
src/utils/lockExpiry.ts → releaseExpiredLocks()
```

The job:
1. `UPDATE screening_seats SET status = 'AVAILABLE' WHERE status = 'LOCKED' AND lock_expires_at < now()`
2. Emits `seat_unlocked` for each released seat via Socket.IO
3. Emits `availability_update` for each affected screening

Started in `server.ts` after the server is listening:

```ts
const expiryJob = startLockExpiryJob(30); // every 30 seconds
```

Cleaned up on `SIGINT`/`SIGTERM` via `clearInterval(expiryJob)`.

---

## Key Concurrency Concepts

**Row-level locking (`FOR UPDATE NOWAIT`)** — when a user tries to lock a seat, the repository acquires a Postgres row lock on that `screening_seats` row. If another transaction holds the lock, `NOWAIT` causes an immediate error (code `55P03`) rather than waiting, which the service layer converts to a clean `{ success: false }` response.

**SAVEPOINT-based retry** — booking reference generation uses `crypto.randomBytes` to produce a 10-character reference. On the rare chance of a collision, a `SAVEPOINT` allows the transaction to roll back just the insert and retry with a new reference without aborting the whole booking.

**Transaction safety on cancellation** — cancellation uses `BEGIN / FOR UPDATE / UPDATE / COMMIT` to ensure the time-limit check and the status update are atomic. A cancellation cannot race with a concurrent booking of the same seats.

---

## Emails

Powered by [Resend](https://resend.com). Two transactional emails are sent:

- **Booking confirmation** — show title, theatre, screen, IST-formatted showtime, seat labels, booking reference, cancel link
- **Cancellation confirmation** — same details with crossed-out seats and reference

> During development, `from` uses `onboarding@resend.dev`. Set up a verified domain in Resend for production use.

---

## Cancellation Policy

Cancellations are blocked within **2 hours of showtime**. This is enforced in `cancelBooking` in the repository by comparing `now()` against `screenings.starts_at`.