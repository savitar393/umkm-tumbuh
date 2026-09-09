# UMKM Tumbuh frontend

**English** | [Bahasa Indonesia](README.id.md)

React 18 and TypeScript application built with Vite. Feature modules live in `src/features/`; shared HTTP and authentication utilities live in `src/shared/`.

## Start development

Use Node.js 22 and npm. Start the backend using the [local development guide](../docs/README_LOCAL_DEV.md), then run from the repository root:

```bash
[ -f frontend/.env ] || cp frontend/.env.example frontend/.env
cd frontend
npm ci
npm run dev
```

Open [the application](http://localhost:5173). Keep an existing `.env` and compare it with [.env.example](.env.example) when updating. The root `.env` configures the backend; it does not replace `frontend/.env`.

## Backend addresses

The HTTP client in [src/shared/api/http.ts](src/shared/api/http.ts) selects the API for each request. Set one base URL per service, including `/api/v1`:

| Variable | Default value |
| --- | --- |
| `VITE_AUTH_API_BASE_URL` | `http://localhost:8080/api/v1` |
| `VITE_ADMIN_API_BASE_URL` | `http://localhost:8080/api/v1` |
| `VITE_USER_API_BASE_URL` | `http://localhost:8081/api/v1` |
| `VITE_PARTNERSHIP_API_BASE_URL` | `http://localhost:8082/api/v1` |
| `VITE_DOCUMENT_API_BASE_URL` | `http://localhost:8083/api/v1` |
| `VITE_TRAINING_API_BASE_URL` | `http://localhost:8084/api/v1` |
| `VITE_CERTIFICATE_API_BASE_URL` | `http://localhost:8084/api/v1` |
| `VITE_API_BASE_URL` | `http://localhost:8082/api/v1` |

`VITE_API_BASE_URL` is the fallback for default-service requests. It is not a shared gateway for all five services. Certificates use the training service.

If you change a published backend port, update the matching frontend URL and restart Vite. If Vite uses another origin, such as port 5174, update `FRONTEND_URL` in the root `.env` and recreate the backend containers with `docker compose ... up -d` using the full command in the local guide.

`VITE_*` values are browser configuration. Do not store database passwords, `JWT_SECRET`, or S3 secret keys in them.

## Available commands

Run inside `frontend/`:

| Command | Purpose |
| --- | --- |
| `npm ci` | Install dependencies from the lockfile |
| `npm run dev` | Start the Vite development server |
| `npm run lint` | Run ESLint |
| `npm run build` | Check TypeScript and build into `dist/` |
| `npm run preview` | Preview an existing build locally |

Run `npm run build` before previewing. Preview commonly uses port 4173; backend requests still require a matching `FRONTEND_URL`. Preview does not start the backend.

## Accounts and testing

The normal stack seeds the admin configured in the root `.env`. Register UMKM and Mitra accounts through the application; local email is available in [Mailpit](http://localhost:8025).

`bash tests/stack/run.sh`, run from the repository root, checks backend integration and removes its six temporary accounts afterward. Those accounts are not available for a later browser session. The Stage 1 check does not test browser rendering or every application feature.

For startup failures, inspect the browser console and network requests, then check the corresponding backend logs. See the [local guide](../docs/README_LOCAL_DEV.md) for service addresses and commands.
