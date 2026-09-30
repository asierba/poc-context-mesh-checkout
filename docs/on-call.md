# On-call

- **Rota:** PagerDuty schedule `checkout-prod`. Weekly, handover Mondays 10:00 UK time.
- **Ack target:** 5 minutes (Tier 1).
- **Escalation:** primary → secondary after 10 min → engineering manager after 20 min.
- **Slack:** `#team-checkout` for day-to-day; incidents get their own `#inc-…` channel.

## First 5 minutes

1. Open Datadog **Checkout / Overview**.
2. Check whether it's us or a dependency: the dashboard has per-dependency error panels for payments, inventory, Postgres, and Kafka.
3. If checkout is failing for customers, declare a Sev1 with `/incident` — don't wait to be sure.
4. Find the matching runbook in [runbooks/](runbooks/).

## Dependency contacts

| Dependency | PagerDuty | Slack |
|---|---|---|
| payments | `payments-prod` | `#team-payments` |
| inventory | `inventory-prod` | `#team-inventory` |
| Platform (EKS, RDS, Kafka) | `platform-prod` | `#platform-help` |

## Deploy freeze

No deploys from Black Friday − 7 days to Cyber Monday + 2 days without VP Engineering approval.
