---
name: fetch-team-a-docs
description: Fetch Team A's public docs (payments API contract, integration rules, payments glossary) into a local cache and answer from them. Use whenever the user asks about Team A's payments API, charging customers, refunds, idempotency keys, merchant currency, the payments vault, settlement, or any payments-domain term owned by Team A. Do NOT use for subscription billing (Team C) or payouts (Team D).
---

# fetch-team-a-docs

Pulls Team A's public docs from their docs repo on demand and surfaces them to answer questions about Team A's payments domain.

## Steps

1. **Fetch.** Run `scripts/fetch.sh` — path is relative to this SKILL.md; resolve to an absolute path before invoking via bash. The script clones (first invocation) or fast-forwards (subsequent invocations) Team A's docs into a local cache, then prints the cache path on stdout. **Capture that path** — it's the single source of truth for where the docs live; do not hardcode it.
2. **Read.** Inspect the cache dir from step 1. Start with `README.md`, then read the specific files relevant to the user's question (typically `payments-api.md` or `glossary.md`).
3. **Answer.** Cite specific files when referencing facts (e.g. `<cache>/payments-api.md:line`). If the docs don't cover the question, say so — don't guess.

## Conventions

- **Always re-run the fetch script** at the start of a session that uses this skill. The cache is shared across projects; another agent may have left it stale.
- **Don't write to the cache.** It's overwritten on `git pull`. Treat it as read-only.
- **Boundary checks.** If the user asks about subscription billing or payouts, stop and tell them this skill only covers Team A's domain — point them at Teams C / D.
