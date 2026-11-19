# LogiFlow frontend

The LogiFlow frontend is a React single-page application for shipment operations,
dispatching, fleet tracking, driver workflows, and public delivery tracking. It
is built with React 18, TypeScript, Vite, Tailwind CSS v4, shadcn/ui-style
primitives, React Query, Zustand, Socket.IO, GSAP, and Framer Motion.

The application communicates with the LogiFlow API gateway. The gateway and its
backing services are maintained in the
[LogiFlow backend repository](https://github.com/Rashmika-Thehan/logiflow-backend).

## Features

- Public landing page, documentation, and tracking lookup
- Email/password and Google OAuth authentication
- Organization registration, onboarding, invites, and join codes
- Role-based operations dashboard for:
  - Dispatch and assignment offers
  - Live fleet map
  - Shipment creation, import, filtering, and status tracking
  - Vehicle and driver management
  - Organization settings and API keys
  - Platform driver management for super administrators
- Driver login, application, active delivery jobs, milestones, and proof of
  delivery
- Live fleet and delivery updates through Socket.IO
- Dispatcher alerts through Server-Sent Events (SSE)
- Automatic access-token refresh with a shared in-flight refresh request
- Cloudflare Workers static asset deployment with SPA fallback

## Prerequisites

- Node.js 20 or later
- npm 10 or later (pnpm also works, but this package does not pin a package
  manager)
- A running LogiFlow API gateway for authenticated and live features

For the complete local stack, start the infrastructure and backend services
following the backend repository's [quick start guide](../logiflow#-quick-start-guide).

## Getting started

```bash
git clone <repository-url>
cd logiflow-frontend
npm install
```

Create a local environment file:

```dotenv
VITE_API_URL=http://localhost:3000
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Environment variables

Vite exposes only variables prefixed with `VITE_` to browser code.

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `VITE_API_URL` | No | `http://localhost:3000` | API gateway origin. Do not include `/api/v1`; the client adds that prefix. |

The API client sends credentials with requests and attaches stored bearer
tokens. The backend must allow the frontend origin through CORS and support
credentials. For local development, configure the backend with:

```dotenv
FRONTEND_URL=http://localhost:5173
```

Do not put API keys, client secrets, or other server-side credentials in
`VITE_*` variables. Values in a Vite environment file are included in the
browser bundle.

## Application routes

### Public routes

| Route | Purpose |
| --- | --- |
| `/` | Landing page |
| `/track` | Enter a tracking code |
| `/track/:trackingCode` | Public delivery tracking |
| `/docs` | Integration and API documentation |
| `/privacy` | Privacy policy placeholder |
| `/terms` | Terms of service placeholder |

### Authentication and onboarding

| Route | Purpose |
| --- | --- |
| `/login` | Organization user login |
| `/register` | Create an organization account |
| `/join` | Join an organization |
| `/accept-invite` and `/invite/accept` | Accept an invitation |
| `/auth/callback` | Google OAuth callback |
| `/onboarding` | Business administrator onboarding |
| `/driver/login` | Driver login |
| `/driver/apply` | Driver application |

### Protected operations routes

| Route | Access |
| --- | --- |
| `/dashboard/dispatch` | Business admins, dispatchers, and super admins |
| `/dashboard/map` | Business admins, dispatchers, and super admins |
| `/dashboard/shipments` | Business admins, dispatchers, and super admins |
| `/dashboard/vehicles` | Business admins, dispatchers, and super admins |
| `/dashboard/settings` | Business admins |
| `/dashboard/platform-drivers` | Super admins |
| `/driver` | Drivers |

Protected routes redirect users who are not authenticated or do not have the
required role. The default destination after login is `/driver` for drivers and
`/dashboard/dispatch` for other supported roles.

## Frontend architecture

```text
src/
├── api/          Axios client and typed API modules
├── assets/       Images, video, and other static assets
├── components/   Reusable UI, auth, dashboard, driver, map, and tracking views
├── content/      Landing page copy
├── hooks/        Live fleet, tracking, alerts, time, and socket hooks
├── layouts/      Public, auth, and dashboard shells
├── lib/          Formatting, CSV, audio, geocoding, and socket helpers
├── pages/        Route-level screens
├── routes/       React Router route definitions and role guards
├── stores/       Zustand application stores
└── types/        Shared frontend TypeScript types
```

### API client and authentication

[`src/api/client.ts`](src/api/client.ts) creates the Axios client with the
`/api/v1` prefix and `withCredentials: true`. It:

- Adds a stored access token as a bearer header.
- Sends refresh cookies with requests.
- Shares one refresh request between concurrent 401 responses.
- Replays the original request once after a successful refresh.
- Clears the local session when refresh fails.

Authentication state is managed by
[`src/stores/authStore.ts`](src/stores/authStore.ts). Tokens are stored in
browser local storage to support the existing dual bearer-token and cookie
authentication flow.

### Real-time communication

Socket.IO connections are created by
[`src/lib/socket.ts`](src/lib/socket.ts). The gateway namespaces used by the
frontend are:

| Namespace | Use |
| --- | --- |
| `/live` | Authenticated dispatcher fleet updates |
| `/ingest` | Driver telemetry ingestion |
| `/track` | Public shipment tracking updates |

Dispatcher alerts use
`/api/v1/alerts/stream` through `EventSource`. The alerts hook reconnects with
exponential backoff and refreshes the session before reconnecting.

## Backend integration

The frontend expects the API gateway at `VITE_API_URL` and uses these gateway
prefixes:

- REST: `${VITE_API_URL}/api/v1`
- OAuth: `${VITE_API_URL}/api/v1/auth/google`
- Alerts SSE: `${VITE_API_URL}/api/v1/alerts/stream`
- Socket.IO: `${VITE_API_URL}/live`, `/ingest`, and `/track`

For the public integration flow, business administrators create an API key in
**Dashboard → Settings → API Keys**. Keep API keys in server-side integration
code; never expose them in this frontend or another browser bundle. The
in-app `/docs` page contains the current token exchange and shipment creation
examples.

## Production build and deployment

Build and preview the static application:

```bash
npm run build
npm run preview
```

The build output is written to `dist/`. The repository includes
[`wrangler.jsonc`](wrangler.jsonc) for Cloudflare Workers static assets:

```bash
npx wrangler login
npx wrangler deploy
```

Set `VITE_API_URL` in the environment used for the production build, then
rebuild before deploying. The Wrangler configuration enables SPA fallback, so
direct navigation to routes such as `/dashboard/shipments` serves the
application entry point.

The deployed frontend origin must be added to the backend's allowed CORS
origins. Use HTTPS for production so cookies, API requests, SSE, and WebSocket
connections are protected.

## Troubleshooting

### API requests fail or the app reports a network error

1. Confirm the API gateway is running.
2. Check `VITE_API_URL` and make sure it does not end with `/api/v1`.
3. Confirm the backend CORS origin exactly matches the frontend origin.
4. Inspect the browser Network panel for the request URL and response status.

### Login succeeds but the session immediately disappears

Check that the gateway allows credentials and that the browser can send the
refresh cookie. Also verify that the frontend and gateway use compatible HTTP
or HTTPS origins; mixed-content or cookie policy restrictions can prevent
refresh requests.

### Live map or alerts do not update

Confirm that the gateway proxies WebSocket upgrades and the alerts SSE stream.
Authenticated live namespaces require a valid session. Public tracking uses a
tracking code and does not require an operations dashboard role.

### Refreshing a nested route returns 404 in production

Configure the host to serve `index.html` for unknown application routes.
Cloudflare deployments use the SPA `not_found_handling` setting in
`wrangler.jsonc`.

## Contributing

1. Create a focused branch from the current development branch.
2. Keep API calls in `src/api` and route-level behavior in `src/pages`.
3. Reuse existing UI primitives and formatting helpers.
4. Run type-checking, linting, formatting checks, and the production build.
5. Keep credentials and environment files out of source control.
