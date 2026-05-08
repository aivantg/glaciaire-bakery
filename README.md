# bakery-popup

A Next.js 14 bakery pop-up ordering system.

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deploying with Dokku

This app is configured for deployment with [Dokku](https://dokku.com/) using a **multi-stage Dockerfile**.

Docker layer caching keeps re-deploys fast:
- The dependency layer (`npm ci`) is only re-run when `package.json` or `package-lock.json` changes.
- The build layer is only re-run when source files change.
- The final image uses [Next.js standalone output](https://nextjs.org/docs/app/api-reference/next-config-js/output#automatically-copying-traced-files), which is minimal and self-contained.

### Initial server setup

```bash
# Create the app
dokku apps:create bakery-popup

# Map external port 80 → container port 3000
dokku ports:set bakery-popup http:80:3000
```

If you need HTTPS, install the Let's Encrypt plugin and run:

```bash
dokku letsencrypt:enable bakery-popup
```

### Add the Dokku remote and deploy

```bash
# One-time: add the remote (replace <host> with your server's address)
git remote add dokku dokku@<host>:bakery-popup

# Deploy
git push dokku main
```

### Environment variables

Set any required environment variables on the server before deploying:

```bash
dokku config:set bakery-popup MY_VAR=value
```

Variables are injected at runtime and are never baked into the image.
