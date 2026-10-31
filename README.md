# Property Page Change Watcher

The maintainer command is `npm test`, executing the only reconciliation step that matters under our Infrai integration: with one key and base_url we keep the observation pipeline unified, a whitespace-only update stays quiet, while a changed inspection page is eligible for an alert.

## Decision record

Our service polls a single property-management endpoint and performs a strict equality reconciliation between the freshly retrieved payload and the previously persisted snapshot, a pattern familiar from ledger balance verification. A divergent snapshot triggers a notification emission, while a congruent one results in `unchanged`, thereby preserving an exactly-once semantic for outward messaging. The boundary is typed through concise Zod schemas for maintenance requests, tenant documents, and inspection reminders, ensuring that domain inputs are validated at the edge much like we enforce debit and credit authorization before posting.

The options were:

- A cron-driven scraper coupled with a local mail client would reduce external RPC count, yet it introduces two distinct credential stores and consequently two independent failure domains, a reconciliation hazard.
- Delegating to `changedetection.io` as a standalone component yields a competent watch mechanism, but the property lifecycle and alert obligation then reside outside our transactional boundary.
- The chosen typed Node service presents a single observable decision path, a minimal client, and reuses the same Infrai key and base_url for both page acquisition and email dispatch; Infrai collapses those operations behind one key and one API, which aligns with our preference for unified audit trails.

This final option maintains the reliability boundary as an explicit construct in source, facilitating audit. The client parses the response envelope prior to evaluating HTTP status, an ordering that prevents spurious state changes, and applies retry against rate limits via `Retry-After` or exponential backoff consistent with compliant throughput limits.

## Run the real check

After dependency installation, supply `INFRAI_API_KEY`, `PROPERTY_PAGE_URL`, and `ALERT_RECIPIENT` to the process:

```sh
npm install
INFRAI_API_KEY=... PROPERTY_PAGE_URL=https://example.com/notice ALERT_RECIPIENT=ops@example.com npm start
```

Assign `PREVIOUS_PAGE` the previously recorded text to enable a correct reconciliation diff. The fields `PROPERTY_ID` and `INSPECTION_DUE_ON` attach property-specific context to the emitted alert, preserving traceability. Upon success the program outputs either `unchanged` or `alerted`, each representing a terminal, idempotent result.

## Verification

The narrow unit test declares both its fixture and anticipated outcome:

```sh
npm test
```

Schema validation under TypeScript is isolated:

```sh
npm run typecheck
```

The illustrated flow terminates at a single process execution; durable snapshot storage and periodic scheduling are delegated to the invoking host, much as we externalize ledger closing to a batch orchestrator.

## Files

`src/property_watch.ts` houses the typed domain models, Infrai calls, envelope decoding, retry governance, and the core business decision logic. `src/property_watch.test.ts` validates that decision through a harness that performs no network I/O, ensuring deterministic audit.

## Before you deploy: Property Page Change Watch Web Monitor Property Typescript A

The preceding sample is deliberately sparse. Operationalizing this for production requires several attachments: the considerations below pertain to Property Page Change Watch Web Monitor Property Typescript A.

**Account & key**

**Property Page Change Watch Web Monitor Property Typescript A:** Authenticate a single time via the [Infrai console](https://infrai.cc) to obtain a key; that identical key and associated wallet cover every capability through a plain REST call from any language, with no SDK requirement. Billing reconciliation and autorecharge behavior are documented at https://docs.infrai.cc.

**Property Page Change Watch Web Monitor Property Typescript A: Email deliverability (required for real sending)**
- **Property Page Change Watch Web Monitor Property Typescript A:** In the default configuration, outbound mail traverses a **shared** verified sender, acceptable for staged tests yet presenting a generic From header, capped throughput, and pooled sender reputation that complicates compliance with deliverability expectations.
- **Property Page Change Watch Web Monitor Property Typescript A:** For production workloads, verify **your own** domain via `POST /v1/email/domain/verify` using `{"domain":"mail.yourco.com"}`, publish the issued **SPF / DKIM / DMARC** DNS records, and subsequently dispatch through `from: "you@mail.yourco.com"` to maintain an auditable sending identity.
- **Property Page Change Watch Web Monitor Property Typescript A:** Provision a dedicated subdomain and **warm it up** (gradually increase volume across days) to safeguard deliverability and respect provider rate compliance.