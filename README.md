# Schedula

A doctor-appointment-booking web application.

## Google OAuth + Drizzle setup

Required environment variables:

- `DATABASE_URL` - Postgres connection string
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `GOOGLE_REDIRECT_URI` - OAuth callback URL (e.g. `http://localhost:3000/api/v1/auth/callback`)
- `JWT_SECRET` - secret used to sign JWTs
- `NEXT_PUBLIC_BASE_URL` - optional, used to build redirect URL (defaults to `http://localhost:3000`)
- `OAUTH_SUCCESS_REDIRECT` - optional frontend path to receive token (e.g. `/auth/success`)
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `GOOGLE_REDIRECT_URI` - OAuth callback URL (e.g. `http://localhost:3000/api/v1/auth/callback`)
- `JWT_SECRET` - secret used to sign JWTs
- `NEXT_PUBLIC_BASE_URL` - optional, used to build redirect URL (defaults to `http://localhost:3000`)
- `OAUTH_SUCCESS_REDIRECT` - optional frontend path to receive token (e.g. `/auth/success`)
- `SENDGRID_API_KEY` - SendGrid API key to send OTP emails
- `SENDGRID_FROM_EMAIL` - verified sender email used for OTP messages

Install dependencies:

```bash
npm install
```

Run database migration (example using psql):

```bash
psql "$DATABASE_URL" -f migrations/001_create_users.sql
psql "$DATABASE_URL" -f migrations/002_create_otps.sql
```

Start development server:

```bash
npm run dev
```

Endpoints added:

- `GET /api/v1/auth/google` — redirects to Google consent screen
- `GET /api/v1/auth/callback` — callback that exchanges code, upserts user, and redirects to frontend with `?token=...`

New credential endpoints:

- `POST /api/v1/auth/register` — JSON `{ "email":"...", "password":"...", "name":"..." }` creates a credentials user and returns `{ token, user }`.
- `POST /api/v1/auth/login` — JSON `{ "email":"...", "password":"..." }` returns `{ token, user }` on success.

OTP / registration flow:

- `POST /api/v1/auth/register` — with `{ "email","name" }` sends an OTP to the email (responds `{ ok: true }`).
- `POST /api/v1/auth/register` — to complete registration, POST `{ "email","name","password","otp" }` to verify the OTP and create the account. Returns `{ token, user }` on success.

- `POST /api/v1/auth/login` — JSON `{ "email":"...", "password":"..." }` returns `{ token, user }` on success.

Database migration order:

1. `migrations/001_create_users.sql`
2. `migrations/002_create_otps.sql`

Next steps:

- Install the listed dependencies.
- Create a simple frontend route to consume the `token` query and store it (cookie/localStorage) for authenticated requests.
