# Restaurant Backend (simple)

Simple Express + MongoDB API for the restaurant website.

## Setup

```bash
npm install
cp .env.example .env   # then fill MONGO_URL + JWT_SECRET
npm run seed           # creates admin + sample dishes
npm run dev            # start dev server
```

Admin login: `admin@neonbistro.com / admin123`

## Routes

- `POST /users/register` — create account
- `POST /users/login` — log in (sets cookie)
- `POST /users/logout` — log out
- `GET /users/me` — current user (login required)
- `GET /dishes` — list dishes (public)
- `GET /dishes/:id` — one dish (public)
- `POST /dishes` — add dish (admin)
- `PUT /dishes/:id` — edit dish (admin)
- `DELETE /dishes/:id` — delete dish (admin)
- `POST /reservations/addReservation` — book table (login required)
- `GET /reservations` — all bookings (admin)
- `PUT /reservations/:id` — update booking (admin)
- `DELETE /reservations/:id` — delete booking (admin)

`/api/...` versions of the same routes also work.

Images upload to `/uploads` (max 2MB).
