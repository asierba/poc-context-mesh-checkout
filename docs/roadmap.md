# Roadmap & Known Gaps

## Known gaps

| Gap | Why it matters | Plan |
|---|---|---|
| No circuit breaker on payments or inventory calls | Architecture principle 4 requires one; a slow dependency can tie up all pods | Add `opossum`-based breakers — Q4 2026 |
| `POST /v1/checkout` doesn't accept a client `Idempotency-Key` header | Principle 3 asks for it; today we rely on per-cart idempotency instead | Accept the header and store it in Redis for 24 h — Q1 2027 |
| Next.js is on Trial via ADR 0001, not on the tech radar | Needs an ARB decision | ARB review scheduled for 2026-Q4 |
| Payments timeout exception expires 2026-11-15 | ADR 0003 must be renewed or closed | Waiting on payments' async 3-D Secure work |

## Planned

- **Split API from pages** into separate deployments if API traffic grows beyond 3× page traffic (mobile app launch, 2027).
- **Saved addresses** — needs a new Confidential data store; design doc in progress.
- **Guest checkout** — blocked on identity team supporting anonymous customer IDs.
