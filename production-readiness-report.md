# Concordvest Production-Readiness Report

**Audit date:** 26 August 2026  
**Audit scope:** Current Concordvest repository and deployed static application posture  
**Audit mode:** Read-only review; no application code was changed during the audit  
**Overall verdict:** **Not production-ready.** The public experience is visually complete and the deployed static site is functioning as a prototype, but the business-critical parts—authentication, authorization, database persistence, lead submission, admin CRUD, media handling, and operational controls—are not implemented as production systems.

## 1. Executive assessment

The current application is a **React/Tailwind static frontend** using client-side Wouter routes. The repository is configured as a `web-static` project with no active database, backend business API, user management, Stripe, Shopify, or other production integration. The `server/index.ts` file is only a static-file server and client-route fallback; it does not expose application APIs, authenticate requests, validate input, persist records, or enforce permissions.

The public site contains a substantial set of routes and polished conversion flows, but the data is local demo data. Property, project, service, article, staff, activity, and lead records are hard-coded in source files. Form submissions are serialized into browser `localStorage` and then handed to WhatsApp through a prefilled URL. Admin changes are held in React component state and disappear on refresh. Admin authentication is a browser `localStorage` flag, not a security boundary. These behaviors are suitable for demonstration only and must be replaced before real customers, listings, staff, or personal data are introduced.

The currently available deployment domain is `concordvest-hycwvuj4.manus.space`; however, the deployment should be treated as a **prototype deployment**, not a production launch, until the blockers in this report are resolved.

## 2. Readiness scorecard

| Area | Current state | Severity | Production status |
|---|---|---:|---|
| Public frontend rendering | React application with routes and responsive layouts | Medium | Usable prototype |
| Public routing | Client-side route definitions and static fallback | Medium | Needs deployment and deep-link testing |
| Property/project/service/content data | Hard-coded demo catalogues | Critical | Not production-ready |
| Lead capture | Browser-local storage plus WhatsApp handoff | Critical | Not production-ready |
| File uploads | Only selected filenames are captured | Critical | Not implemented |
| Admin authentication | `localStorage` demo flag | Critical | Not secure |
| Admin authorization | UI labels only; no server enforcement | Critical | Not implemented |
| Admin CRUD | React state and local demo arrays | Critical | Not persistent |
| Backend APIs | No business API endpoints | Critical | Not implemented |
| Database | No configured database or migrations | Critical | Not implemented |
| Staff management | Sample staff records and prototype UI | Critical | Not implemented |
| Security controls | No application auth boundary, rate limiting, validation, or security headers | Critical | Not ready |
| Automated tests | No operational test suite; `pnpm test` exits 1 | High | Not ready |
| Dependency hygiene | High-severity audit findings and ignored pnpm configuration warning | High | Not ready |
| Monitoring and operations | Analytics exists; no business error monitoring, audit log, alerting, or backups | High | Not ready |
| Performance | Production build succeeds, but JavaScript bundle is approximately 1 MB before gzip | Medium | Needs optimization |
| Accessibility | Basic labels and responsive controls exist; modal/focus/keyboard coverage is not production-assured | Medium | Needs formal audit |

## 3. Architecture and deployment findings

### 3.1 The project is still a static frontend

The project configuration identifies the application as `web-static`. The template documentation explicitly describes it as a client-only React application with placeholder `server/` and `shared/` directories. The current server entrypoint serves compiled files and returns `index.html` for every route. It does not provide business APIs, database access, authentication, authorization, file storage, webhooks, email, or lead processing.

**Required fix:** Upgrade the project to a backend-enabled architecture or introduce a separately managed production backend. The target architecture must include a versioned API, database migrations, secure authentication, authorization middleware, object storage for media, server-side validation, structured logging, and environment-specific configuration. The frontend should call that API rather than writing business data to browser storage.

### 3.2 Static route fallback is not sufficient by itself

Client-side routes are defined for properties, services, projects, inspiration, conversion flows, and admin sections. The static server fallback is appropriate for serving the SPA shell, but production deployment still needs verified behavior for direct navigation, refreshes, canonical URLs, custom 404 handling, cache rules, and every route under the live domain. There is also no evidence of a production sitemap, robots policy, canonical metadata strategy, or route-specific SEO metadata.

**Required fix:** Add a deployment smoke-test matrix for every public and admin route, configure cache headers and SPA fallback explicitly, add `robots.txt` and `sitemap.xml`, and generate route-specific title, description, canonical, Open Graph, and structured-data metadata where appropriate.

## 4. Data, database, and persistence

### 4.1 Public catalogues are hard-coded demo data — Critical

Properties, services, projects, and articles are defined as TypeScript arrays in `client/src/lib/properties.ts`, `client/src/lib/services.ts`, and `client/src/lib/content.ts`. The source contains explicit prototype/demo labels and placeholder copy. This means listings, prices, availability, service content, project stories, article dates, and related-content relationships cannot be safely managed in production.

**Required fix:** Create normalized database tables or collections for properties, property media, services, projects, project media, articles, categories, relationships, and publication states. Add migrations, unique slug constraints, validation, draft/published workflow, and seed scripts that are clearly separated from production data. Establish ownership and publication permissions for every record type.

### 4.2 Admin mutations are not persistent — Critical

Property duplicate, delete, edit, and availability actions use React `useState` and local arrays. Lead status changes are also held in component state. The admin screens themselves contain messages such as “saved locally,” “removed from this demo session,” and “duplicated locally.” Refreshing the page or opening the application in another browser loses these changes.

**Required fix:** Replace each mutation with authenticated server requests. Implement optimistic or pessimistic updates with error rollback, server-side validation, concurrency handling, audit records, and explicit success/failure states. Add delete confirmation, soft-delete or archival policy, and recovery procedures.

### 4.3 Browser storage contains lead and auth data — Critical

`client/src/lib/leads.ts` writes complete lead payloads to `localStorage`, including names, phone numbers, WhatsApp numbers, email addresses, property/service context, source page, and messages. The admin session is also represented by the `concordvest-admin-auth` localStorage key. Any user can inspect or modify these values, and they are unavailable to staff centrally.

**Required fix:** Remove browser storage as the system of record. Submit leads over HTTPS to a server endpoint, store them in a protected database, and use secure, expiring, server-managed sessions or a trusted identity provider for admin access. Define retention, deletion, export, and access policies for personal data.

## 5. Authentication, authorization, and admin security

### 5.1 Authentication is simulated, not real — Critical

`isAdminAuthenticated()` checks whether local storage contains the literal value `demo-authenticated`; `setAdminAuthenticated()` writes or removes that value. There is no password verification, server session, token validation, account recovery, session expiry, device revocation, MFA, brute-force protection, or login audit trail. The prefilled staff email and password shown in the UI are demo credentials, not an access-control system.

**Required fix:** Implement real staff identity management. At minimum, use secure password hashing through a managed identity provider or a vetted auth subsystem, HTTP-only secure cookies or an equivalent secure token design, session expiry and revocation, password reset, email verification if needed, MFA for administrators, login throttling, and authentication event logging. Never use a client-only flag as proof of identity.

### 5.2 Authorization is not enforced — Critical

The admin sidebar displays roles such as Admin, Editor, Property Manager, and Content Manager, but there is no server-side permission model. The client route family under `/admin/:section` is the only boundary. A user who reaches the client route can render the workspace, and any eventual API must not trust the client’s role labels.

**Required fix:** Define a permission matrix for properties, projects, services, leads, content, media, staff, and settings. Enforce it on every backend request, not only in the UI. Add role assignment controls restricted to administrators, least-privilege defaults, audit logs, and tests for unauthorized reads and writes.

### 5.3 Admin isolation is visual, not security isolation

The admin UI is visually isolated and the public mobile WhatsApp CTA is omitted from admin routes, which is good UX. It is not a security boundary. The current static server serves the same application shell to all users and does not protect admin data or actions.

**Required fix:** Add server-side route and API protection, noindex rules for admin surfaces, secure session handling, CSRF protection where cookie-authenticated mutations are used, and security tests that prove unauthenticated and underprivileged users cannot access staff data or mutate records.

## 6. Forms, leads, APIs, and integrations

### 6.1 Lead forms have no production submission API — Critical

Property enquiry, viewing request, renovation quote, and site inspection flows create a client-side object, write it to local storage, show a confirmation state, and generate a WhatsApp link. There is no `fetch`, Axios call, backend endpoint, retry queue, delivery acknowledgement, email notification, CRM integration, or staff notification. A browser crash, private browsing mode, storage quota error, or user abandonment can lose the lead.

**Required fix:** Build dedicated server endpoints for each lead type or one validated lead endpoint with a discriminated schema. Return a durable lead ID, record server timestamps and source metadata, send staff notifications, implement retry and idempotency, and expose a staff-visible status workflow. WhatsApp should be an additional handoff, not the only delivery channel.

### 6.2 Validation is browser-only and incomplete — High

Forms rely primarily on HTML `required`, email, date, and type attributes. There is no server-side schema validation, phone normalization, Nigerian number validation policy, maximum length enforcement, spam protection, abuse throttling, duplicate detection, or consent record. Client-side validation can be bypassed by any caller.

**Required fix:** Validate and normalize every field on the server. Define maximum lengths and allowed values, reject unexpected fields, add rate limiting and bot mitigation, prevent duplicate submissions with idempotency keys, and record consent and privacy-policy version where required.

### 6.3 Photo upload is not implemented — Critical

The renovation flow’s file input stores only selected file names in the lead payload. No bytes are uploaded, no object-storage key is created, and no staff member can retrieve the photos. File type, size, count, malware scanning, access control, and retention are absent.

**Required fix:** Implement signed upload URLs or a controlled multipart endpoint backed by object storage. Enforce MIME type and size limits server-side, sanitize filenames, scan files, store metadata, restrict access to authorized staff, and define lifecycle/retention rules. The lead record should reference stored media IDs rather than filenames.

### 6.4 WhatsApp configuration is incomplete

The client reads `VITE_CONCORDVEST_WHATSAPP_NUMBER`. `VITE_` variables are bundled into browser code and are therefore public. The current fallback behavior can generate a generic WhatsApp API URL when the number is absent. There is no server-side configuration validation or delivery tracking.

**Required fix:** Put non-secret public configuration in a controlled frontend configuration path, validate the production number during deployment, and keep any actual secrets server-side. Track CTA clicks and lead IDs without placing unnecessary personal data in URLs. Define a fallback contact channel if WhatsApp is unavailable.

## 7. Content, media, and property functionality

The property, project, service, and inspiration experiences are rich presentation layers, but several parts are explicitly prototype content: demo listing labels, placeholder timelines, styled map previews, demo case studies, and sample editorial content. The property detail pages use a styled map placeholder rather than a live geocoded listing map. Many images come from Unsplash URLs or Manus storage references; production rights, availability, optimization, and fallback behavior have not been evidenced.

**Required fix:** Replace demo records with approved production content, confirm image/video licensing, store media in a managed CDN/object store, generate responsive sizes and modern formats, add alt-text governance, implement broken-media fallbacks, and connect live coordinates or a production map provider with usage monitoring. Add a CMS or complete admin editors for all fields that staff are expected to manage.

## 8. Security and privacy

The current project has no application-level security middleware or business API to protect. The server does not show rate limiting, request size limits, security headers, CORS policy, CSRF controls, structured input validation, or centralized error handling. Local storage contains personal lead data and a tamperable auth flag. Public frontend environment variables include a maps/Forge key that must be treated as exposed browser configuration.

**Required fix:** Establish a security baseline before launch: HTTPS-only deployment, HSTS after validation, CSP tailored to Google Fonts, analytics, maps, storage, and WhatsApp domains, `frame-ancestors`/clickjacking protection, MIME sniffing protection, referrer policy, strict CORS, request body limits, rate limiting, server-side validation, safe error responses, dependency scanning, secret rotation, and privacy/legal pages. Conduct a threat model and an independent security review before accepting real personal data.

## 9. Dependency, build, testing, and observability findings

The production build and TypeScript check succeed. The build emits a warning that the main JavaScript asset is approximately 1,005 kB before gzip, which is a performance risk on mobile connections. The configured `pnpm` field warning states that the package’s `patchedDependencies` and `overrides` keys are no longer being read by the current pnpm version; dependency pinning and patch assumptions therefore need review.

The declared test command is not operational: `pnpm test` exits with status 1. No reliable unit, integration, end-to-end, accessibility, security, or route smoke-test suite is present in the audited project.

`pnpm audit --prod --audit-level=high` reported at least these high-severity paths:

| Package path | Finding | Required action |
|---|---|---|
| `express@4.21.2 > path-to-regexp@0.1.12` | Regular Expression Denial of Service advisory `GHSA-37ch-88jc-xwx2` | Upgrade/replace the affected dependency path and retest all server routing |
| `streamdown@1.4.0 > mermaid@11.12.0 > lodash-es@4.17.21` | Vulnerable lodash-es advisory `GHSA-r5fr-rjxr-66jc2`; patched version is `>=4.18.0` | Upgrade or remove the dependency chain, then regenerate the lockfile and test rendering |

**Required fix:** Establish CI with type-check, lint, unit tests, route smoke tests, form/API integration tests, accessibility checks, dependency audit, build, and deployment smoke tests. Resolve or formally risk-accept every audit finding. Move pnpm overrides/patches into the supported configuration format and pin the package-manager version in CI. Add error tracking, server logs, uptime checks, alerting, and business-event monitoring.

## 10. Accessibility, UX, and performance

The interface includes labels, responsive layouts, visible buttons, and semantic route content. Production readiness still requires a formal accessibility pass. The modal implementations appear to be custom fixed overlays without evidence of `role="dialog"`, `aria-modal`, focus trapping, focus restoration, or Escape-key handling. File inputs are visually hidden and should be verified with keyboard and screen-reader testing. Contrast and touch targets should be checked across all states, including sticky mobile WhatsApp controls.

**Required fix:** Run automated and manual WCAG 2.2 AA testing. Add correct dialog semantics, focus management, keyboard dismissal, error association, status announcements, landmark/heading verification, reduced-motion checks, accessible image alternatives, and accessible validation messages.

For performance, optimize the roughly 1 MB JavaScript bundle with route-level code splitting and removal of unused dependencies. Add responsive image loading, lazy-load below-the-fold media, self-host or optimize fonts if appropriate, define CDN cache policy, and measure Core Web Vitals on representative mobile devices. Avoid relying on third-party Unsplash delivery for production-critical imagery.

## 11. Exact pre-deployment remediation plan

### P0 — Must be completed before any real data or public business launch

1. Upgrade the static prototype to a backend-enabled production architecture.
2. Implement real authentication, secure sessions, MFA policy, password recovery, and server-enforced RBAC.
3. Add a production database, migrations, backups, restore testing, and durable models for properties, services, projects, articles, leads, media, and staff.
4. Replace all local demo arrays and `localStorage` lead/admin persistence with authenticated API calls and database writes.
5. Implement server-side validation, rate limiting, spam controls, idempotent lead creation, and durable lead notifications.
6. Implement real media uploads with object storage, file limits, scanning, access control, and retention.
7. Replace or formally secure the simulated admin login and verify unauthorized access is rejected server-side.
8. Resolve high-severity dependency findings and the ignored pnpm override/patch configuration.
9. Establish privacy policy, consent handling, data retention/deletion procedures, and a process for handling Nigerian customer contact data.

### P1 — Must be completed before calling the application production-ready

1. Complete property/project/service/content/media/staff editors with real persistence, drafts, publication workflow, audit trail, and delete recovery.
2. Add automated unit, integration, end-to-end, accessibility, security, and deployment smoke tests; make `pnpm test` pass in CI.
3. Add monitoring, error tracking, uptime alerts, API logs, admin audit logs, and lead-delivery alerts.
4. Add SEO metadata, sitemap, robots policy, canonical URLs, social previews, and structured data for public detail pages.
5. Replace demo content, placeholder map/timeline states, and unlicensed/external production imagery with approved production assets.
6. Optimize bundle size, images, fonts, caching, and route-level loading; measure Core Web Vitals.
7. Perform a full WCAG 2.2 AA audit and manual keyboard/screen-reader testing.

### P2 — Strongly recommended before scale

1. Add CRM integration, email/SMS notifications, lead assignment, duplicate detection, and SLA reporting.
2. Add calendar availability and confirmed appointment scheduling for viewings and inspections.
3. Add saved-property persistence, staff search/filter/export, bulk actions, and dashboard analytics.
4. Add staging and production environments with controlled migrations, rollback procedures, and release approvals.
5. Commission an independent penetration test and privacy review.

## 12. Final go/no-go decision

**Go for a controlled prototype/demo only. No-go for production business operations.** The frontend can continue to be used for stakeholder review, visual validation, and content approval. It should not yet be used as the authoritative property catalogue, lead-management system, staff workspace, or repository for customer personal data. The minimum acceptable launch gate is completion of all P0 items, a passing automated test/deployment pipeline, resolved dependency findings, real authentication/RBAC, durable data persistence, and verified lead/media delivery.

## References

[1]: https://github.com/advisories/GHSA-37ch-88jc-xwx2 "GitHub Advisory: path-to-regexp Regular Expression Denial of Service"

[2]: https://github.com/advisories/GHSA-r5fr-rjxr-66jc "GitHub Advisory: lodash Prototype Pollution"

[3]: https://www.w3.org/TR/WCAG22/ "Web Content Accessibility Guidelines (WCAG) 2.2"
