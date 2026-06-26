# LME Build Roadmap (CTO Plan)

Version: 1.0  
Date: 2026-06-02

## Timeline
Total: 12 weeks (target range 10-15 weeks)

## Phase 0 (Week 1): Foundations and Controls
- Finalize product decisions log and architecture.
- Set up repositories, environments, CI, and coding standards.
- Provision Firebase, Paystack, PostgreSQL, storage, and secrets.
- Define API contracts and event naming conventions.
- Deliverable: approved architecture, schemas, and project skeletons.

## Phase 1 (Weeks 2-4): Core Backend and Integrations
- Build auth/roles, users, riders, orders, waybills, payments modules.
- Implement Paystack checkout + webhook verification + idempotency.
- Implement job board logic, 10-minute escalation, 30-minute refund fallback.
- Implement notification pipeline (FCM push jobs).
- Deliverable: backend API v1 + tested payment and order state machine.

## Phase 2 (Weeks 5-6): Rider App (Android-first)
- Build rider login, job board, accept/lock, active job flow.
- Add status updates with validation and proof-of-delivery photo upload.
- Build earnings pages (daily/weekly/monthly + order-level detail).
- Deliverable: pilot-ready rider app for internal testing.

## Phase 3 (Weeks 7-9): Customer App
- Build onboarding/profile/address and category booking flows.
- Build checkout, fee transparency, urgent toggle, Paystack integration.
- Build order tracking timeline, history, complaints, and support entrypoint.
- Deliverable: end-to-end customer booking to delivery completion.

## Phase 4 (Weeks 10-11): Executive Dashboard
- Build order feed, escalations, manual assignment, cancellations, refunds.
- Build rider management and complaints/dispute workflows.
- Build core finance views (money in/out, refunds, net).
- Deliverable: operational control center for launch.

## Phase 5 (Week 12): Hardening and Launch
- Full QA pass, load and failure tests on critical paths.
- Security checks, observability dashboards, and alerting.
- Staging to production rollout with runbooks and rollback plan.
- Deliverable: launch-ready release candidate.

## Parallel Workstreams (Run Throughout)
- Product and design QA
- Test automation and bug triage
- Store submission preparation (Apple/Google)
- Operational SOPs for customer support and dispute handling

## Definition of Done (Each Feature)
- Acceptance criteria implemented
- Unit/integration tests added
- Error handling and logs verified
- Role-based authorization validated
- Product sign-off recorded

## Git/GitHub Workflow (As Requested)
- Use short-lived feature branches and PRs per milestone.
- Push at least once daily for visibility.
- Use conventional commit messages.
- Require PR review + passing checks before merge to `main`.

## Initial Milestones
- M1: Architecture + schema lock
- M2: Payment-safe order lifecycle live in staging
- M3: Rider app internal pilot
- M4: Customer app alpha
- M5: Executive dashboard alpha
- M6: Production launch

