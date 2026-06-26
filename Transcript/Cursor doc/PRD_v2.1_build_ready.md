# LIFE MADE EASY (LME) LOGISTICS
## Product Requirements Document (Build-Ready)

Version: 2.1 (Corrected for Execution)  
Date: 2026-06-02  
Status: Approved for Architecture and Sprint 0

## 1) Product Vision
LME is a delivery platform for Jos North, Nigeria, optimized for gadget logistics, food, groceries, and laundry. The platform has three applications:
- Customer App (iOS/Android)
- Rider App (Android-first)
- Executive Dashboard (Web + Mobile responsive)

Launch objective: safely run prepaid deliveries at scale with operational visibility, financial control, and dispute accountability.

## 2) Build Principles (Non-Negotiable)
- V1 must work reliably on 3G networks.
- All bookings are prepaid via Paystack (no cash on delivery).
- Rider commission is fixed at 25% of completed delivery fee.
- No live customer map tracking in V1.
- Order lifecycle must be auditable end-to-end.
- Security, retries, and idempotency are mandatory for all payment and status-changing flows.

## 3) Corrected Scope

### 3.1 Launch V1 (In Scope)
Customer App:
- Phone OTP auth, profile, address capture.
- Booking flows for Gadgets, Food, Grocery, Laundry.
- Checkout with full fee breakdown and urgent surcharge.
- Paystack payment and receipt record.
- Step-based tracking (Order Placed, Rider Assigned, Picked Up, En Route, Delivered).
- Order history and complaint submission/tracking.

Rider App:
- OTP login for executive-created rider accounts.
- Open Job Board with first-to-accept lock.
- One active job at a time.
- Status updates and mandatory proof-of-delivery photo.
- Earnings views (daily, weekly, monthly, per-order breakdown).

Executive Dashboard:
- Secure login (OTP + session controls).
- All orders feed, search, filter, manual assignment.
- Escalation queue for unaccepted orders after 10 minutes.
- Complaint inbox and resolution actions.
- Rider management (add, suspend, view profile).
- Core money flow views: money in, rider commissions, refunds, net.

Platform:
- Firebase Auth (OTP) and Firebase FCM push.
- Paystack integration with webhook verification.
- Waybill generation and PDF export for gadget deliveries.
- Audit logs for admin actions and dispute outcomes.

### 3.2 V1.1 (First Post-Launch)
- Promo code engine.
- Rider availability toggle.
- Daily executive summary push.
- Reorder shortcut.
- Rider performance score.
- Ops assistant role activation.

### 3.3 V2 (Deferred)
- Live map tracking for customers.
- Bike route playback on maps.
- Geofence alerts.
- In-app chat.
- Multi-city expansion.
- Full Vendplug API integration (deep link remains in V1/V1.1).

## 4) Decisions Locked for Build
- Primary launch market: Jos North only.
- Currency: NGN (Naira), locale formatting DD/MM/YYYY and 12-hour time.
- Rider payout schedule: Weekly settlement (every Monday 10:00 WAT) for prior week.
- Payment success + no rider accepted in 10 minutes: order escalates for manual assignment; if unresolved after 30 minutes, automatic full refund.
- Laundry return flow: tracked as second leg within same parent order (not a new independent booking).
- Ops Assistant has no finance access in V1.
- Rider of the Month bonus handled manually in V1.
- Vendor catalog in V1 managed by LME ops team (no vendor self-service yet).

## 5) Open Decisions (Must Resolve Before Sprint 2)
- Max order value threshold requiring executive approval.
- GPS tracker vendor and API specification.
- Long-term vendor onboarding model and SLA.

## 6) Functional Requirements (Condensed Build Spec)

### 6.1 Customer
- Authentication: phone OTP, persistent session, secure logout.
- Booking: category-specific forms and pricing logic.
- Checkout: subtotal, fees, surcharge, promo (hidden if disabled).
- Payment: Paystack inline/redirect, webhook-confirmed final state.
- Tracking: push updates for every state transition.
- Support: complaint workflow with statuses.

### 6.2 Rider
- Receives open jobs and claims jobs atomically.
- Cannot claim second job while active job exists.
- Can update lifecycle statuses in valid order only.
- Must upload proof photo before Delivered status.

### 6.3 Executive
- Can assign escalated orders.
- Can cancel orders and trigger refunds with reason.
- Can resolve complaints with auditable notes.
- Can view money-in vs money-out and rider commission obligations.

## 7) Core Domain Rules
- Commission: `rider_commission = 0.25 * delivery_fee`.
- LME share: `lme_revenue = 0.75 * delivery_fee` (before refunds and costs).
- Escalation: `order_unaccepted_after_10m -> escalated`.
- Refund timeout: `escalated_unresolved_after_30m -> full_refund`.
- Status transitions are enforced by state machine only; no direct skipping.

## 8) Suggested Order State Machine (V1)
- `created`
- `payment_pending`
- `payment_confirmed`
- `posted_to_job_board`
- `rider_assigned`
- `picked_up`
- `en_route`
- `delivered`
- `escalated`
- `cancelled`
- `refunded`

## 9) Technical Architecture (V1)
- Backend: Node.js + TypeScript + Express (modular monolith).
- Database: PostgreSQL with migrations.
- Queue/Workers: background jobs for notifications, timeout escalation, refunds, monthly reports.
- Storage: Cloudinary or S3 for proof photos and waybill PDFs.
- Observability: structured logs, request IDs, error monitoring.

## 10) Non-Functional Requirements
- API p95 response target: < 700ms on core endpoints.
- App launch target: under 3s on mid-range Android.
- 99.5% uptime during operating window.
- Idempotency on payment callbacks and status mutation endpoints.
- Offline tolerance: riders can view active job details cached locally.

## 11) Security & Compliance Baseline
- JWT-based API auth with role-based access control.
- Firebase OTP rate limiting and anti-abuse policy.
- Paystack webhook signature verification required.
- Access-controlled media URLs for proof/waybill assets.
- NDPR-compliant data retention and deletion process.

## 12) Delivery Plan Summary
See `docs/roadmap.md` and `docs/roadmap.html`.

