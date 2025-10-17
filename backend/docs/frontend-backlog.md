# Frontend Completion Backlog

This document outlines the tasks required to deliver a feature-complete web experience for Event Hub.

## 1. Project Setup
- [ ] Confirm target stack (React + Vite recommended) and initialize project within `frontend/` directory.
- [ ] Configure TypeScript, ESLint, Prettier, and project scripts.
- [ ] Establish shared UI theme, fonts, and responsive layout primitives.

## 2. Authentication & Onboarding
- [ ] Implement login form with validation and integration to `/api/auth/login`.
- [ ] Implement registration form with validation and integration to `/api/auth/register`.
- [ ] Persist auth state (tokens/session) and protect authenticated routes.

## 3. Student Experience
- [ ] Public event listing with filters (date range, club, keyword) backed by `/api/events` search.
- [ ] Event detail page showing description, instructions, and registration status.
- [ ] Registration flows: register, cancel, and view "My Registrations" dashboard.

## 4. Club Admin Portal
- [ ] Dashboard summarizing events, registrations, and instructions.
- [ ] CRUD UI for events, including capacity updates and instruction management.
- [ ] Registration overview with export or summary view.

## 5. Super Admin Toolkit
- [ ] User management interface (list, deactivate/delete users, adjust roles).
- [ ] Recent activity or audit trail view.

## 6. Cross-cutting Concerns
- [ ] API client abstraction with error handling aligned to backend `ApiError` format.
- [ ] Global notification/toast system for success and failure feedback.
- [ ] Loading, empty, and error states for all async views.
- [ ] Route-level access control and navigation structure.

## 7. Testing & Quality
- [ ] Component tests for critical forms and views (e.g., React Testing Library).
- [ ] Playwright/Cypress end-to-end smoke covering auth and primary flows.
- [ ] Accessibility audit and lighthouse performance baseline.

---

Last updated: 2025-10-17
