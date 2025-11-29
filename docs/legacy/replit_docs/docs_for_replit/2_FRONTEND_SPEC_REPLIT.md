# Front‑End Specification – React (Vite) with Replit Backend

## Purpose
A SPA that feels instant: login → resume reviewing → approve/edit/skip → live payout updates. Admins define schemas without code.

## Stack
- React 18 + Vite
- React Router v6, Zustand (or Redux Toolkit)
- Axios (JWT interceptor), Tailwind/Bootstrap
- (Later) Socket.io client for realtime

## Structure
```
frontend/src/
  main.jsx, App.jsx
  routes/ { AuthRoutes.jsx, ReviewerRoutes.jsx, AdminRoutes.jsx }
  pages/ { Login, Register, Dashboard, ReviewPage, AdminPanel, DatasetBuilder, OCRUploader, Settings }
  components/ { ReviewCard, DynamicField, LanguageSwitcher, PayoutWidget, ProgressBar }
  services/ { api.js, socket.js }
  store/ { useAuthStore.js, useQueueStore.js }
  styles/ globals.css
```

## API Integration
- `VITE_API_URL` env variable (e.g., `https://<backend>/api`).
- Axios interceptor attaches JWT from localStorage.

## UX Flows
- **Reviewer**: Login → Dashboard → Continue → ReviewPage fetches `/api/datasets/next?langs=en,hi` → Approve/Edit/Skip → next item instantly.
- **Admin**: AdminPanel → DatasetBuilder (CRUD dataset types) → Payout/config → Role assignment.

## Dynamic Forms
- Render fields from dataset type schema (`fields[]: {key, type, label}`) via `DynamicField` components.

## Language Switching
- Toolbar switcher persists preference; appended as query param to `/next`.

## Minimal Must‑Haves
- Auth pages, ReviewPage with dynamic form, simple payout display, Admin dataset type list + create form.
