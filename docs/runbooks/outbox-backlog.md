# Runbook: Outbox backlog

`OutboxLagHigh` fires when `order.placed` / `order.cancelled` events are more than 60 s behind. Orders are still being placed — customers aren't affected directly — but fulfilment, inventory, and confirmation emails are delayed. Sev2.

## Triage

```sql
SELECT count(*), min(created_at) FROM outbox WHERE published_at IS NULL;
```

| What you see | Likely cause | Action |
|---|---|---|
| Relay pods crash-looping | Bad deploy or config | Roll back the relay deployment |
| Relay running, Kafka errors in logs | Kafka unavailable or ACL change | Page `platform-prod` |
| One row failing repeatedly | Payload too large or serialisation bug | Move it aside: `UPDATE outbox SET published_at = now() WHERE id = '…'`, then republish manually after the fix |

## Don't

- Don't truncate the outbox. Unpublished rows are orders downstream teams haven't heard about.
- Don't publish from the web app as a shortcut — see [adr/0002](../adr/0002-transactional-outbox.md).
