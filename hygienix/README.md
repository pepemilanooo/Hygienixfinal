# Hygienix — Gestionale Pest Control

Piattaforma SaaS professionale per la gestione di interventi di disinfestazione e pest control.

## Stack tecnologico

| Layer | Tecnologia |
|---|---|
| Monorepo | npm workspaces + Turborepo |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL 15 + Prisma ORM |
| Web Admin | Next.js 14 App Router |
| App Mobile | React Native + Expo SDK 51 |
| Auth | JWT (access 15min + refresh 7gg) + RBAC |
| Storage | S3-compatible (AWS S3 / Cloudflare R2 / MinIO) |
| PDF | Puppeteer + Handlebars |
| Deploy | Railway (Nixpacks) |

## Struttura monorepo

```
hygienix/
├── apps/
│   ├── api/          # REST API Express
│   ├── web/          # Admin web Next.js
│   └── mobile/       # App tecnico Expo
└── packages/
    ├── database/     # Schema Prisma + client
    ├── types/        # Tipi TypeScript condivisi
    └── validators/   # Schemi Zod condivisi
```

## Avvio rapido (sviluppo locale)

### 1. Prerequisiti

- Node.js >= 20
- PostgreSQL 15 in esecuzione
- (Opzionale) MinIO per lo storage locale

### 2. Clone e installazione dipendenze

```bash
git clone https://github.com/tuo-org/hygienix.git
cd hygienix
npm install
```

### 3. Configurazione variabili d'ambiente

```bash
cp .env.example .env
# Modifica .env con i tuoi valori
```

Variabili obbligatorie:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/hygienix

JWT_ACCESS_SECRET=cambia-questo-segreto-access
JWT_REFRESH_SECRET=cambia-questo-segreto-refresh

S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_BUCKET=hygienix
S3_REGION=eu-south-1

NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

### 4. Inizializza il database

```bash
# Esegui le migration
npm run db:migrate

# Popola con i dati demo
npm run db:seed
```

### 5. Avvia tutti i servizi

```bash
npm run dev
```

Questo avvierà in parallelo:
- API: `http://localhost:4000`
- Web Admin: `http://localhost:3000`

### Credenziali demo

| Ruolo | Email | Password |
|---|---|---|
| Admin | admin@hygienix.it | Admin123! |
| Manager | manager@hygienix.it | Manager123! |
| Tecnico 1 | tecnico1@hygienix.it | Tech123! |
| Tecnico 2 | tecnico2@hygienix.it | Tech123! |

## App Mobile

```bash
cd apps/mobile
npx expo start
```

Scansiona il QR code con Expo Go (iOS/Android) o premi `i` per iOS Simulator / `a` per Android Emulator.

## Script utili

```bash
# Build completo
npm run build

# Type check
npm run type-check

# Lint
npm run lint

# Genera client Prisma
npm run db:generate

# Reset e riseed database
npm run db:reset

# Apri Prisma Studio
npx prisma studio --schema packages/database/prisma/schema.prisma
```

## Deploy su Railway

Vedi [docs/deploy-railway.md](docs/deploy-railway.md) per la guida completa.

### Setup rapido Railway

1. Crea un nuovo progetto su [railway.app](https://railway.app)
2. Aggiungi un plugin PostgreSQL
3. Collega il repository GitHub
4. Configura le variabili d'ambiente (usa i valori di `.env.example`)
5. Railway utilizzerà Nixpacks per buildare automaticamente

## Architettura RBAC

| Ruolo | Permessi |
|---|---|
| `ADMIN` | Accesso completo a tutti i dati e funzionalità |
| `MANAGER` | Gestione clienti, siti, interventi, visualizzazione analytics |
| `TECHNICIAN` | Solo i propri interventi assegnati, cartellini dei propri siti |

## API REST

Base URL: `/api/v1`

| Endpoint | Descrizione |
|---|---|
| `POST /auth/login` | Login |
| `POST /auth/refresh` | Refresh token |
| `GET /clients` | Lista clienti |
| `GET /sites` | Lista siti |
| `GET /interventions/my` | Miei interventi (tecnico) |
| `POST /interventions/:id/check-in` | Check-in |
| `POST /interventions/:id/check-out` | Check-out |
| `POST /interventions/:id/close` | Chiusura + PDF |
| `GET /calendar/my` | Calendario tecnico |
| `GET /analytics/overview` | KPI dashboard |

## Struttura database (principali entità)

```
User → RefreshToken
Client → Site → SiteCard → SiteCardPoint
Client → Site → Intervention → InterventionPhoto
                             → InterventionProduct → Product
                             → InterventionPoint → SiteCardPoint
                             → AuditLog
```

## Licenza

Proprietario — tutti i diritti riservati.
