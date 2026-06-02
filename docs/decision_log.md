# LME Product Decisions Log

Purpose: single source of truth for high-impact decisions that affect product, operations, architecture, and timeline.

## Locked Decisions

| ID | Decision | Choice | Owner | Date |
|---|---|---|---|---|
| D-001 | Launch geography | Jos North only | CEO/CTO | 2026-06-02 |
| D-002 | Rider commission | 25% per completed delivery | CEO/CTO | 2026-06-02 |
| D-003 | Payment model | Prepaid only (Paystack) | CEO/CTO | 2026-06-02 |
| D-004 | No rider accepted in 10 min | Escalate to ops; auto-refund at 30 min unresolved | CEO/CTO | 2026-06-02 |
| D-005 | Rider payout cadence | Weekly settlement | CEO/CTO | 2026-06-02 |
| D-006 | Laundry return | Second leg under same parent order | CEO/CTO | 2026-06-02 |
| D-007 | Ops assistant finance access | No finance access in V1 | CEO/CTO | 2026-06-02 |
| D-008 | Vendor listing model (V1) | Curated by LME operations | CEO/CTO | 2026-06-02 |

## Pending Decisions

| ID | Decision | Options | Recommended | Due Date | Status |
|---|---|---|---|---|---|
| P-001 | Max order value requiring manual approval | None / N250k / N500k / custom | N250k initial threshold | Before Sprint 2 | Open |
| P-002 | GPS hardware vendor | Teltonika / Coban / other | Select based on API reliability and support | Before Sprint 2 | Open |
| P-003 | Rider of the month bonus automation | Manual / auto-payout | Manual in V1 | Before Sprint 3 | Open |

## Change Control Rule
- Any decision that changes payment flow, order state machine, security model, or compliance requires:
  1) decision log update,
  2) architecture note update,
  3) explicit approval from CEO + CTO.

