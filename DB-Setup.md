# Backend Database Setup

This project supports two setups:

- Option B (recommended for quick local dev): SQLite
- Option A (later, for real environments): PostgreSQL

## Option B — SQLite (quick local dev)

1) Set DATABASE_URL in backend/.env

```
DATABASE_URL="file:./dev.db"
```

2) Prisma migrate and generate (from backend folder)

```powershell
npx prisma migrate dev --name init
npx prisma generate
```

3) Start the backend on port 4000

```powershell
npm run start:dev
```

4) Frontend API base (if not already set)

Create/update `frontend/.env.local`:
```
NEXT_PUBLIC_API_BASE=http://localhost:4000
```

## Option A — PostgreSQL (later)

1) Install Postgres on Windows (no Docker)
- Download installer: https://www.postgresql.org/download/windows/
- During setup, create a superuser (e.g., postgres) and note the password.
- Create a database named `bidding`.

2) Update backend/.env

```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/bidding?schema=public
```

3) Switch Prisma to PostgreSQL

Edit `backend/prisma/schema.prisma`:
```
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

4) Apply migrations

If you have existing Prisma migrations (created while on SQLite), you can apply them to Postgres:

```powershell
# from backend folder
npx prisma migrate reset   # WARNING: resets DB and applies all migrations
# or in CI/prod use:
# npx prisma migrate deploy
```

Note: Moving from SQLite dev data to Postgres will not preserve the SQLite data by default. If you need data, export/import it or write a small transfer script.

## Docker alternative (later)

If you install Docker later, you can spin up a Postgres container:

```powershell
docker run --name bidding-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=bidding -p 5432:5432 -d postgres:16
```

Update .env accordingly and use the Postgres steps above.
