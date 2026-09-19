# Neon Bistro — Fullstack Restaurant Website

A fullstack restaurant website with a cyberpunk / neon-themed frontend and a REST API backend for menu management, user authentication, and table reservations.

- **Frontend (`neon-bistro/`):** React 19 + Vite 8 + Tailwind CSS 3 + Framer Motion + React Router v7
- **Backend (`backend/`):** Node.js + Express 5 + MongoDB (Mongoose) + JWT auth (httpOnly cookie) + Multer image uploads

## Features

### Frontend

- Hero section with animated headline and CTA
- Featured dishes grid and expandable menu cards (price, tags, descriptions)
- Dish details page (`/dish/:id`) with ingredients, ratings, badges
- Auth pages: login (`/login`), register (`/register`) with shared auth shell
- Reservation booking form (date, time, party size, special requests) + confirmation view (`/reservation/confirmation`)
- Contact section (location, hours, phone, email, socials), footer, navbar
- Admin dashboard (`/admin`, admin-only route) for managing dishes and reservations
- Dark-mode-first neon design: orange `#ff5f00` on deep black `#111317`, Sora / Inter / Space Grotesk fonts, smooth hash-link scrolling

### Backend

- User auth: register, login, logout, current user (`/users/*`), bcrypt password hashing, JWT in httpOnly cookie
- Dishes CRUD: public list/get, admin-only create/update/delete with image upload (2MB max, served from `/uploads`)
- Reservations: logged-in users can book (`POST /reservations/addReservation`), admin can list/update/delete
- Security basics: CORS with `FRONTEND_URL` allowlist + credentials, security headers, 100 req / 15 min rate limit on auth POSTs, 100kb JSON body limit
- `/api/...` prefixed aliases plus legacy `/foods` and `/files` aliases for backward compatibility

## Tech Stack

| Layer    | Tools                                                                                    |
| -------- | ---------------------------------------------------------------------------------------- |
| Frontend | React 19, Vite 8, Tailwind CSS 3, Framer Motion 12, React Router DOM 7, Oxlint           |
| Backend  | Express 5, Mongoose 9, jsonwebtoken 9, bcryptjs 3, multer 2, cookie-parser, cors, dotenv |
| Database | MongoDB (local or Atlas via `MONGO_URL`)                                                 |

## Project Structure

```
fullstack restaurant website/
├── backend/               # Express REST API
│   ├── controllers/       # Request handlers (users, dishes, reservations)
│   ├── middleware/        # Auth / admin guards, upload handling
│   ├── models/            # Mongoose schemas: User, Dish, Reservation
│   ├── routes/            # userRoutes, dishRoutes, reservationRoutes
│   ├── uploads/           # Uploaded dish images (served statically)
│   ├── server.js          # App entrypoint
│   └── .env.example       # Required env vars template
└── neon-bistro/           # React frontend
    └── src/
        ├── pages/         # Home, Login, Register, Admin
        ├── components/    # Hero, MenuSection, FeaturedDishes, DishDetails,
        │                  # Reservations, ReservationConfirmation, Navbar,
        │                  # Footer, ContactSection, AdminRoute, AuthShell
        └── lib/           # api.js (API client), AuthContext.jsx
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- MongoDB running locally or a MongoDB Atlas URI

### 1. Backend setup

```bash
cd backend
npm install
cp .env.example .env
# then edit .env and set MONGO_URL + JWT_SECRET
npm run dev    # dev with --watch, or: npm start
```

### 2. Frontend setup

```bash
cd neon-bistro
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` by default. Make sure `FRONTEND_URL` in the backend `.env` matches, otherwise CORS/coookie auth will fail.

Production build:

```bash
npm run build
npm run preview
```

Lint:

```bash
npm run lint
```

## API Reference

Base URL: `http://localhost:5000` (`/api/...` prefixed versions of all routes also work).

| Method | Route                          | Auth      | Description                |
| ------ | ------------------------------ | --------- | -------------------------- |
| POST   | `/users/register`              | Public    | Create account             |
| POST   | `/users/login`                 | Public    | Log in (sets cookie)       |
| POST   | `/users/logout`                | Logged in | Log out                    |
| GET    | `/users/me`                    | Logged in | Current user               |
| GET    | `/dishes`                      | Public    | List dishes                |
| GET    | `/dishes/:id`                  | Public    | Single dish                |
| POST   | `/dishes`                      | Admin     | Add dish (multipart image) |
| PUT    | `/dishes/:id`                  | Admin     | Edit dish                  |
| DELETE | `/dishes/:id`                  | Admin     | Delete dish                |
| POST   | `/reservations/addReservation` | Logged in | Book a table               |
| GET    | `/reservations`                | Admin     | List all bookings          |
| PUT    | `/reservations/:id`            | Admin     | Update booking             |
| DELETE | `/reservations/:id`            | Admin     | Delete booking             |

Static images: `GET /uploads/<filename>` (`/files/<filename>` alias also works).
