# glaciaire popup app

A simple ordering app built for Glaciaire — customers browse the menu and place orders, and hosts manage the menu and kitchen queue. 

The concept and UI was inspired by [SXSE Coffee Pop Up](https://sxse-popup.vercel.app/)!

## Run locally

You'll need Node 20+, npm, and (optionally) Docker. You can switch the backend to sqlite for local dev if preferred!

```bash
npm install
npm run db:up
cp .env.example .env
npm run db:migrate
npm run db:seed
npm run dev
```

Open [http://localhost:5000](http://localhost:5000). Click "host login" at the bottom of any page to unlock menu editing and order controls (default PIN is in `.env.example`).

## Database

| Script | What it does |
| --- | --- |
| `db:up` / `db:down` | Start or stop local Postgres (Docker Compose) |
| `db:migrate` | Apply migrations in dev (`prisma migrate dev`) |
| `db:deploy` | Apply migrations in production/CI |
| `db:generate` | Regenerate the Prisma Client from `prisma/schema.prisma` |
| `db:seed` | Load sample menu data |
| `db:studio` | Open Prisma Studio |

`npm install` runs `db:generate` automatically. After you change the schema or pull new migrations, run `npm run db:migrate` (or `db:deploy`), then **`npm run db:generate`** if migrate didn’t already, and **restart `npm run dev`** — Next.js keeps a cached Prisma client in development, so hot reload alone isn’t enough.

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Postgres connection string. `.env.example` matches the local Docker Compose database. |
| `HOST_PIN` | Yes | PIN for host login — unlocks menu admin and order status controls. |
| `HOST_SESSION_SECRET` | No | Random string to sign host session cookies. If unset, derived from `HOST_PIN`. Set in production so changing the PIN doesn't invalidate sessions. |
