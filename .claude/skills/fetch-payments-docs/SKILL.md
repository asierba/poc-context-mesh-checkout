---
name: fetch-payments-docs
description: Fetch the payments team's docs and answer from them — the API contract, integration rules, and glossary for the platform's payments domain (charges, refunds, idempotency, merchant currency, settlement, vault).
---

# fetch-payments-docs

Pulls the payments team's public docs from their docs repo on demand and surfaces them to answer questions about the payments domain.

## Steps

1. **Fetch.** Run `scripts/fetch.sh` — path is relative to this SKILL.md; resolve to an absolute path before invoking via bash. The script clones (first invocation) or fast-forwards (subsequent invocations) the docs into a local cache, then prints the cache path on stdout. **Capture that path** — it's the single source of truth for where the docs live; do not hardcode it.
2. **Read.** Inspect the cache dir from step 1. Start with `README.md`, then read the specific files relevant to the user's question (typically `payments-api.md` or `glossary.md`).
3. **Answer.** Cite specific files when referencing facts (e.g. `<cache>/payments-api.md:line`). If the docs don't cover the question, say so — don't guess.

## Conventions

- **Always re-run the fetch script** at the start of a session that uses this skill. The cache is shared across projects; another agent may have left it stale.
- **Don't write to the cache.** It's overwritten on `git pull`. Treat it as read-only.
