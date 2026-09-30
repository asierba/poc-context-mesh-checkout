# 0001 — Use Next.js App Router for checkout pages and API

Status: Accepted
Date: 2025-02-11

## Context

Checkout needs server-rendered pages (fast first paint on mobile, no card-form flicker) and a small JSON API. The tech radar has TypeScript on Node 20 in **Adopt** but doesn't list a web framework, so the ARB asked for an ADR.

## Decision

Use Next.js (App Router) for both pages and route handlers in one deployable. Treat Next.js as **Trial** for checkout until the ARB decides whether to add it to the radar.

## Consequences

- One deployable, one pipeline, shared types between pages and API.
- The API and the pages scale together. If API traffic diverges from page traffic we'll split them (see [roadmap.md](../roadmap.md)).
- Next.js major upgrades are frequent; we pin to 14.x and upgrade deliberately.

## Alternatives considered

- **Express API + separate React SPA:** two deployables, no SSR without extra work.
- **Remix:** similar trade-offs, smaller hiring pool internally.

Approved by the ARB on 2025-02-20.
