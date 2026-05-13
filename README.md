# bakery-popup

A Next.js 14 bakery pop-up ordering system, backed by Postgres via Prisma.

## Local development

You'll need Node 20+, npm, and Docker.

```bash
# 1. Install JS deps (this also runs `prisma generate` via postinstall)
npm install

# 2. Start a local Postgres container
npm run db:up

# 3. Copy the example env file
cp .env.example .env

# 4. Apply migrations and seed
npm run db:migrate    # creates the schema + applies migrations
npm run db:seed       # inserts the starter menu items

# 5. Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The host login PIN defaults to `0000` (set in `.env.example`). Click "host
login" at the bottom of any page to unlock the admin tab and the kitchen
controls on the order queue.

### Useful db scripts

| script             | what it does                                       |
| ------------------ | -------------------------------------------------- |
| `npm run db:up`    | start the local Postgres container                 |
| `npm run db:down`  | stop the container (data persists in the volume)  |
| `npm run db:migrate` | create a migration from schema changes + apply it |
| `npm run db:seed`  | seed the database with starter menu items          |
| `npm run db:studio` | open Prisma Studio (browse/edit data in a GUI)    |
| `npm run db:reset` | drop everything and re-apply migrations + seed     |

## Deploying with Dokku

Production runs the app from the multi-stage `Dockerfile`. Dokku reads
`Procfile` to run database migrations on each release and to start the web
process.

### One-time server setup

```bash
# Install the postgres plugin (once per dokku host)
sudo dokku plugin:install https://github.com/dokku/dokku-postgres.git

# Create the app
dokku apps:create bakery-popup

# Create + link a postgres service — this sets DATABASE_URL automatically
dokku postgres:create bakery-popup-db
dokku postgres:link bakery-popup-db bakery-popup

# Set the host login PIN (anyone with this can edit the menu / advance orders)
dokku config:set bakery-popup HOST_PIN="your-secret-pin"

# Optional — a long random session secret so the cookie signing key is
# independent of the PIN. Strongly recommended in production.
dokku config:set bakery-popup HOST_SESSION_SECRET="$(openssl rand -hex 32)"

# Map external port 80 → container port 3000
dokku ports:set bakery-popup http:80:3000
```

For HTTPS, install the Let's Encrypt plugin and run:

```bash
dokku letsencrypt:enable bakery-popup
```

### Deploy

```bash
# One-time: add the remote (replace <host> with your server's address)
git remote add dokku dokku@<host>:bakery-popup

# Deploy
git push dokku main
```

On every deploy, Dokku will:

1. Build the Docker image from `Dockerfile`
2. Run the `release` Procfile entry → `prisma migrate deploy` (applies any
   pending migrations against the linked Postgres service)
3. Start the `web` Procfile entry → `node server.js`

The `Dockerfile` uses **BuildKit cache mounts** for the npm cache and the
Next.js build cache, so warm deploys are dramatically faster than cold ones
(seconds instead of a minute). Dokku 0.30+ enables BuildKit by default. On
older versions, opt in once per app:

```bash
dokku config:set --no-restart bakery-popup DOCKER_BUILDKIT=1
```

### Seeding production (optional, one-time)

The seed script is **not** run automatically on deploy. To seed production:

```bash
dokku run bakery-popup node node_modules/prisma/build/index.js db seed
```

### Backing up production data

```bash
dokku postgres:export bakery-popup-db > backup-$(date +%F).dump
```

### Setting extra env vars

```bash
dokku config:set bakery-popup KEY=value
```
