# LogiFlow Frontend

React 18, Vite, TypeScript, Tailwind v4, shadcn/ui style primitives, GSAP, Framer Motion.

```
cp .env.example .env
npm install
npm run dev      # http://localhost:5173
```

The backend gateway must allow CORS with credentials for `http://localhost:5173` and set `FRONTEND_URL` to the same origin.

- `src/index.css` holds the theme tokens and the named text styles (`heading-1` to `caption-5`).
- `src/api/client.ts` holds the Axios instance, the shared single flight 401 refresh and the session expired hook.
- `src/stores/authStore.ts` holds session state (`bootstrap`, `login`, `logout`).
- `src/content/landing.ts` holds all landing copy. Values marked SPEC or wrapped in `{{ }}` need real data.
  x
