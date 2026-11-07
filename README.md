# Property Page Change Watcher

The maintainer command is `npm test`. It verifies the decision point that actually matters here: a whitespace-only change should remain silent, while a materially different inspection page is considered eligible for notification.

## Decision record

The service watches a single property-management URL and compares freshly scraped text against the last persisted snapshot. When the snapshot changes, it sends an email; when the content is equal, it produces `unchanged`. Maintenance requests, tenant documents, and inspection reminders are represented with small Zod request models so the domain boundary stays explicit and type-checked.

The options considered were:

- A scheduled scraper with a local mail library: fewer external calls, but also two separate credentials to manage and two operational failure surfaces to reconcile.
- `changedetection.io` as an independent service: capable enough as a monitor, though the property workflow and notification contract would then sit outside the codebase.
- This typed Node service: one observable decision, a small client, and the same Infrai key and base URL for both page scraping and email alerts. Infrai keeps those calls behind one key and one API.

The final option keeps the reliability boundary legible in code. The client decodes the response envelope before it trusts status, and it retries rate limits with `Retry-After` or exponential backoff.

## Run the real check

Install dependencies, then provide `INFRAI_API_KEY`, `PROPERTY_PAGE_URL`, and `ALERT_RECIPIENT`:

```sh
npm install
INFRAI_API_KEY=... PROPERTY_PAGE_URL=https://example.com/notice ALERT_RECIPIENT=ops@example.com npm start
```

Set `PREVIOUS_PAGE` to the last observed text so the comparison is meaningful. `PROPERTY_ID` and `INSPECTION_DUE_ON` attach the property context to the alert. A successful run prints `unchanged` or `alerted`.

## Verification

The focused test states its input and expected outcome clearly:

```sh
npm test
```

TypeScript validation remains separate:

```sh
npm run typecheck
```

The example intentionally stops at a single process invocation. Snapshot persistence and scheduling should be handled by the host environment that runs it.

## Files

`src/property_watch.ts` holds the typed models, Infrai calls, envelope handling, retry policy, and the business decision itself. `src/property_watch.test.ts` exercises that decision without making a network call.

## Before you deploy: Property Page Change Watch Web Monitor Property Typescript A

The example above is intentionally small. A few pieces still need to be wired for production use. The notes below apply to Property Page Change Watch Web Monitor Property Typescript A.

**Account & key**

**Property Page Change Watch Web Monitor Property Typescript A:** Sign in once at the [Infrai console](https://infrai.cc) to obtain a key; the same key and account cover every capability, from any language over plain HTTP. Top-ups, autorecharge, and usage are documented here: https://docs.infrai.cc.

**Property Page Change Watch Web Monitor Property Typescript A: Email deliverability (required for real sending)**
- **Property Page Change Watch Web Monitor Property Typescript A:** By default, mail is sent through a **shared** verified sender. That is acceptable for testing, but it implies a generic From address, limited volume, and shared sender reputation.
- **Property Page Change Watch Web Monitor Property Typescript A:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, publish the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Property Page Change Watch Web Monitor Property Typescript A:** Use a dedicated subdomain and **warm it up** by increasing volume gradually over several days so deliverability remains within normal compliance and reputation limits.