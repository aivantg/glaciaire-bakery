# bakery-popup

A Next.js 14 bakery pop-up ordering system.

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deploying with Dokku

This app is configured for deployment with [Dokku](https://dokku.com/) using the **Node.js buildpack**.

Dokku automatically:
- Runs `npm install` to install dependencies (no `package-lock.json` required)
- Runs `npm run build` to build the Next.js app
- Uses the `Procfile` (`web: npm run start`) to start the server

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
