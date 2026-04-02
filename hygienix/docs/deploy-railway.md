# Deploy su Railway

## Prerequisiti

- Account Railway (railway.app)
- Railway CLI: `npm install -g @railway/cli`
- Repository GitHub connesso

## Struttura servizi Railway

Creare 3 servizi nel progetto Railway:

1. **postgresql** — Plugin PostgreSQL (gestito da Railway)
2. **hygienix-api** — Backend Node.js + Express
3. **hygienix-web** — Frontend Next.js

---

## 1. Configurazione API

### railway.json (apps/api/)

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build"
  },
  "deploy": {
    "startCommand": "node dist/index.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

### nixpacks.toml (apps/api/) — per Puppeteer

```toml
[phases.setup]
nixPkgs = ["chromium", "nss", "freetype", "harfbuzz", "ca-certificates", "ttf-liberation", "font-noto-emoji"]

[phases.build]
cmds = ["npm run build"]

[start]
cmd = "node dist/index.js"
```

### Variabili d'ambiente API (Railway)

```
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_ACCESS_SECRET=genera-con-openssl-rand-hex-32
JWT_REFRESH_SECRET=genera-con-openssl-rand-hex-32
NODE_ENV=production
PORT=4000

# Cloudflare R2 (consigliato) o AWS S3
S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
S3_ACCESS_KEY_ID=<r2-access-key>
S3_SECRET_ACCESS_KEY=<r2-secret-key>
S3_BUCKET=hygienix-prod
S3_REGION=auto
S3_PUBLIC_URL=https://storage.hygienix.it

# Resend (per email)
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@hygienix.it

# Frontend URL (per CORS)
CORS_ORIGIN=https://app.hygienix.it
```

---

## 2. Configurazione Web (Next.js)

### railway.json (apps/web/)

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build"
  },
  "deploy": {
    "startCommand": "npm run start",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

### Variabili d'ambiente Web (Railway)

```
NEXT_PUBLIC_API_URL=https://api.hygienix.it/api/v1
NODE_ENV=production
```

---

## 3. Migration database al primo avvio

Dopo il primo deploy dell'API, esegui:

```bash
railway run --service hygienix-api npx prisma migrate deploy --schema packages/database/prisma/schema.prisma
railway run --service hygienix-api npx ts-node packages/database/src/seed.ts
```

Oppure aggiungi ai comandi di build:

```bash
npx prisma migrate deploy && node dist/index.js
```

---

## 4. Dominio personalizzato

In Railway → Settings → Networking:
- `api.hygienix.it` → servizio `hygienix-api`
- `app.hygienix.it` → servizio `hygienix-web`

---

## 5. Generazione segreti JWT

```bash
# Linux / macOS
openssl rand -hex 32

# Output esempio:
# a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2
```

Usa valori diversi per `JWT_ACCESS_SECRET` e `JWT_REFRESH_SECRET`.

---

## 6. Cloudflare R2 (storage raccomandato)

1. Vai su Cloudflare Dashboard → R2
2. Crea bucket `hygienix-prod`
3. Genera API token con permessi su R2
4. (Opzionale) Configura dominio personalizzato per il bucket pubblico
5. Aggiorna le variabili `S3_*` in Railway

R2 è compatibile S3 e **non ha costi di egress** — ideale per immagini e PDF.

---

## 7. Checklist post-deploy

- [ ] API health check: `GET https://api.hygienix.it/health` → `{"status":"ok"}`
- [ ] Login admin funzionante
- [ ] Upload foto funzionante
- [ ] Generazione PDF funzionante
- [ ] App mobile punta a `https://api.hygienix.it/api/v1`
