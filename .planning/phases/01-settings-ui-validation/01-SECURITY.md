---
phase: "01"
slug: "settings-ui-validation"
status: verified
threats_open: 0
asvs_level: 1
created: "2026-10-30"
---

# Phase 01 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| UI input -> chrome.storage | User-entered numbers and URLs cross into persisted provider config | model limits, base URL |
| Provider config -> side panel pickers | Disabled flag and overrides consumed by pickers | provider enabled flag |
| Stored base URL -> LLM call | Normalized URL used to build requests | base URL |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-01-01 | Tampering | ModelChip number inputs | medium | mitigate | Positive-integer check attempted; regex defective (`/^\\d+$/` instead of `/^\\d+$/`) — valid positive integers currently rejected; overrides cannot be persisted via UI. Implementation gap escalated. | open — below high threshold (non-blocking) |
| T-01-02 | Tampering | Provider enabled flag | low | accept | Boolean persisted; default enabled (`!== false`). Accepted risk (no security impact). | closed (accepted) |
| T-01-03 | Tampering | Stored XSS via model/provider names | medium | mitigate | Names rendered as React text nodes; no `dangerouslySetInnerHTML` under src/. | closed |
| T-01-SC | Tampering | npm/pip/cargo installs | high | mitigate | No package.json changes in phase; no new dependencies. | closed |
| T-02-01 | Tampering | Base URL input | high | mitigate | `validateBaseUrl` (src/llm/providers.ts:87-101) rejects non-http(s) schemes; used in ProvidersSection.tsx:509. | closed |
| T-02-02 | Tampering | javascript:/data: schemes | high | mitigate | Scheme allowlist returns 'models.urlScheme'; confirmed by providers.test.ts. | closed |
| T-02-03 | Information Disclosure | API key in URL | low | accept | Keys stored separately in keysStorage (src/store/settings.ts:121); URL not logged. | closed (accepted) |
| T-02-SC | Tampering | npm/pip/cargo installs | high | mitigate | No package.json changes in phase; no new dependencies. | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| R-01 | T-01-02 | Boolean enabled flag has no security impact; default enabled. | security audit (gsd-security-auditor) | 2026-10-30 |
| R-02 | T-02-03 | API keys stored separately in keysStorage; base URL is not logged. | security audit (gsd-security-auditor) | 2026-10-30 |

*Accepted risks do not resurface in future audit runs.*

*If none: "No accepted risks."*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-10-30 | 8 | 7 | 1 | gsd-security-auditor |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed (no open threats at or above high threshold)
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-10-30

---

### Implementation Gap Escalated

T-01-01: The regex in `commitLimit` (ProvidersSection.tsx ~line 820) is over-escaped as `/^\\d+$/`, which matches a literal backslash followed by `d`s instead of digits. As a result, valid positive integers are rejected and per-model overrides can never be persisted via the UI. This is a functional bug in addition to the security verification gap. Recommended fix in a follow-up: change `/^\\d+$/` to `/^\\d+$/` (single backslash in the regex literal) and re-test. Escalated per auditor constraint (no implementation edits during security audit).