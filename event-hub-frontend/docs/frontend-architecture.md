# Event Hub Frontend Architecture

This document captures the implementation blueprint for the Next.js (App Router) frontend that complements the Spring Boot backend.

## Application Shell
- **Layouts**
  - `app/layout.tsx`: global fonts, theme, analytics hooks.
  - `app/(site)/layout.tsx`: marketing pages (home) without auth requirements.
  - `app/(app)/layout.tsx`: authenticated shell with navigation, footer, and session guard.
- **Navigation**
  - Primary nav exposes *Events*, *My Registrations*, *Admin* (if authorized), and *Profile* entry points.
  - CTA buttons in the hero lead to key flows.

## Data Layer
- `lib/config.ts`: resolves `NEXT_PUBLIC_API_BASE_URL` with sensible defaults.
- `lib/api-client.ts`: fetch helper adding JSON headers, credentials, and error normalization to backend `ApiError` format.
- `lib/types.ts`: shared DTO shapes aligned with backend responses.
- `lib/auth.ts`: client-side session cache (localStorage) + cookie-aware fetchers.

## Feature Routes
- `(site)` group for marketing and onboarding:
  - `/`: hero + product overview (already implemented).
  - `/login`, `/register`: forms with validation and calls to `/api/auth` endpoints.
- `(app)` group for student experience (protected):
  - `/app/events`: public event catalogue with search filters.
  - `/app/events/[eventId]`: detail view including instructions and registration actions.
  - `/app/registrations`: "My registrations" dashboard.
  - `/app/profile`: user profile stub (future admin links).
- Future enhancements: `/app/admin` for club/super admin tooling.

## UI Components
- `components/ui/button.tsx`: design system buttons.
- `components/ui/card.tsx`: content containers.
- `components/ui/badge.tsx`, `components/ui/alert.tsx`: status indicators and feedback.
- `components/header.tsx`, `components/footer.tsx`: global chrome shared across routes.

## Styling
- Tailwind CSS (v4) with custom tokens in `globals.css` and additional utilities via component classes.
- Dark-first palette blending slate, sky, and emerald accents consistent with backend branding.

## State & Caching
- Light-weight session store using React context (`providers/session-provider.tsx`).
- Requests that require authentication send `credentials: "include"` to leverage Spring Security sessions.
- Public event list is rendered via server components with incremental caching (`revalidate` strategy) and client-side hydration for filters.

## Testing & Verification
- `npm run lint` and `npm run build` remain primary quality gates.
- Future: add Playwright smoke tests once interactive flows are implemented.

_Last updated: 2025-10-17_
