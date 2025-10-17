# Club Operations Roadmap

This plan sequences the work needed to evolve Event Hub into the invite-only, club-centric platform described. Each phase can be shipped independently while moving the product toward the full experience.

## Phase 1 · Club Governance Foundation
- [x] Introduce `ClubJoinRequest` entity and endpoints so students can request new clubs or join existing ones.
- [x] Persist invitation tokens that let club admins invite members by email/username (accept/decline endpoints included).
- [x] Extend admin toolkit with approval queues for club creation and join requests.
- [x] Update `Club` model to capture `status` (`PENDING`, `ACTIVE`, `RETIRED`) and enforce one active club per admin.
- [ ] Frontend: add flows for submitting club requests, reviewing/approving as super admin, and accepting invites from dashboards.

## Phase 2 · Event Publishing & Registration Controls
- [ ] Add event lifecycle fields: `status` (`DRAFT`, `PUBLISHED`, `CLOSED`), `registrationDeadline`, `capacity`, `isInviteOnly`.
- [ ] Enforce capacity and deadline checks in registration service; surface waitlist flag for future use.
- [ ] Create registration endpoints (`POST /register`, `DELETE /cancel`, `GET /mine`) returning seat confirmation metadata.
- [ ] Replace student event listing to only show `PUBLISHED` events with open seats within deadline; expose full/closed badges.
- [ ] Frontend: registration modal collecting required profile fields + optional questions; update dashboards with seat states and cancel action.

## Phase 3 · Club Event Chat & Instruction Rooms
- [ ] Model `ChatRoom` and `ChatMessage` entities linked to events and registrations with role-based access control.
- [ ] Provide REST (initial) endpoints for posting/retrieving chat messages, pinned instructions, and closing rooms after events.
- [ ] Auto-create room on first registration; emit room metadata in registration responses.
- [ ] Frontend: build chat UI with poll-based updates (upgrade to WebSocket later), pinned instruction pane, and student question composer.
- [ ] Allow club admins to terminate chats manually or automatically after the event end time.

## Phase 4 · Notifications & Experience Polish
- [ ] Publish domain events for invite acceptance, seat confirmations, chat replies; surface via notification feed or email hook.
- [ ] Add timeline badges ("Seats low", "Closed", "Event passed") across student and admin dashboards.
- [ ] Export `.ics` calendar files per event and personal feed for registered students.
- [ ] Provide analytics snapshot for club admins (registrations over time, attendance conversion).

## Supporting Work
- [ ] Expand automated tests to cover join approvals, registration constraints, and chat permissions.
- [ ] Document new APIs and update onboarding/README for club admins and students.
- [ ] Plan data migrations (Flyway/Liquibase) for new entities and columns.

_Last updated: 2025-10-17_
