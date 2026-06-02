# LME Logistics Platform

Monorepo for LME delivery platform.

## Workspace Layout
- `apps/api` - Backend API (Node.js + TypeScript + Express)
- `apps/mobile` - React Native app (Customer + Rider surfaces)
- `apps/dashboard` - Executive web dashboard (Next.js, planned)
- `packages/types` - Shared domain types
- `packages/config` - Shared configs
- `docs` - Product and delivery documentation

## Sprint 1 Status (Web-first)
- Shared domain types (`@lme/types`) with order state machine and commission rules
- PostgreSQL schema migration (`infra/migrations/001_initial_schema.sql`)
- API modules: auth, orders, payments (Paystack webhook-ready)
- Executive Dashboard (Next.js) with login, orders, finance, riders shells

## Quick Start
1. Install dependencies:
   - `npm install`
2. Copy env file:
   - copy `.env.example` to `.env`
3. Run DB migration (PostgreSQL required):
   - `npm run db:migrate`
4. Start API:
   - `npm run dev:api`
5. Start dashboard:
   - `npm run dev:dashboard`
6. Open dashboard:
   - `http://localhost:3000/login`

