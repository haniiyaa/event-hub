# Backend Completion Backlog

This document tracks the remaining tasks needed to consider the Event Hub backend feature-complete.

## 1. Student Experience
- [ ] Public event listing with filtering (date range, club, keyword).
- [ ] Student event detail endpoint.
- [ ] Student registration endpoints (register, cancel, view own registrations).
- [ ] Instruction feed per event for students.

## 2. Club Admin Enhancements
- [ ] Update/delete event endpoints with safeguards.
- [ ] Instruction management (list/update/delete).
- [ ] Registration overview export or summary endpoint.

## 3. Super Admin Toolkit
- [ ] User deactivation or deletion workflow.
- [ ] Optional audit trail or recent activity endpoint.

## 4. Validation & Error Handling
- [x] Introduce DTOs with Bean Validation for request payloads.
- [x] Create global exception handler with consistent error responses.
- [x] Add custom validation for capacity/date constraints.

## 5. Infrastructure & Security
- [ ] Externalize secrets (use environment variables or Spring profiles).
- [ ] Add Flyway/Liquibase migrations for schema management.
- [ ] Seed baseline roles/admin user securely.

## 6. Testing & Quality
- [ ] Integration tests covering auth, student flows, admin flows.
- [ ] Unit tests for services and custom validators.
- [ ] API contract tests or Postman collection with automated runner.

---

Last updated: 2025-10-17
