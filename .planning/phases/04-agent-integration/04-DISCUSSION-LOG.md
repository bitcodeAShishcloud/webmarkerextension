# Phase 4: Agent Integration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-11-19
**Phase:** 4-agent-integration (rebrand scope added to completed phase)
**Areas discussed:** Phase placement, exact name, rename depth, external links, website link, upgrade fixtures, social links, privacy docs, planning docs

---

## Phase Placement

| Option | Description | Selected |
|--------|-------------|----------|
| New Phase 5 | Add a rebrand phase to ROADMAP.md with its own CONTEXT.md | |
| Add to existing Phase 4 | Reopen Phase 4 with a new plan; completed plans stay | ✓ |
| Create no GSD artifacts | Edit files directly | |

**User's choice:** Add to existing Phase 4.
**Notes:** No new phase number was supplied with the command; the user chose the existing phase.

## Exact Name

| Option | Description | Selected |
|--------|-------------|----------|
| WebMarker Extensions | Title Case, both words capitalised | ✓ |
| Webmarker Extensions | Only first letter capitalised | |
| webmarker extensions | Lowercase | |
| WebMarker | Short name, drop "Extensions" | |

**User's choice:** WebMarker Extensions.

## Rename Depth

| Option | Description | Selected |
|--------|-------------|----------|
| Visible + docs + package | Product text, docs, manifest/package metadata; internal IDs untouched | ✓ |
| Everything including internal IDs | Also `nb.*` keys, `nb-*` classes, ports, filenames | |
| UI text only | Only in-extension strings | |

**User's choice:** Visible + docs + package. Internal identifiers (`nb.*`, `nb-*`, `nb-panel`, filenames/folders) deliberately stay unchanged to protect stored user data.

## External Links

| Option | Description | Selected |
|--------|-------------|----------|
| Replace with fork URLs | GitHub links → bitcodeAShishcloud/webmarkerextension; others removed | ✓ |
| Keep old links | Upstream credits and links remain | |
| Remove all external links | No external links at all | |

**User's choice:** Replace with fork URLs.

## Website Link in About

| Option | Description | Selected |
|--------|-------------|----------|
| Replace with GitHub URL | `websiteUrl` points at fork, label shows the GitHub path | ✓ |
| Remove website row | About keeps only version, licence, licences | |
| Keep nanobrowser.ai | Change only the label | |

**User's choice:** Replace with GitHub URL.

## Upgrade Fixtures

| Option | Description | Selected |
|--------|-------------|----------|
| Keep "Nanobrowser" | Fixtures simulate upgrading from the old version | ✓ |
| Rename fixtures too | Change name in fixture JSON as well | |

**User's choice:** Keep "Nanobrowser" in fixtures.

## Social / Web Store Links

| Option | Description | Selected |
|--------|-------------|----------|
| Remove all, keep GitHub | Drop Web Store, Discord, X, sponsor, DeepWiki | ✓ |
| Replace with GitHub equivalents | Discussions/Issues/Releases links | |
| Keep all links | Rename text only | |

**User's choice:** Remove all non-GitHub links; keep the fork GitHub link.

## Privacy Docs

| Option | Description | Selected |
|--------|-------------|----------|
| Rename product name only | PostHog/analytics statements stay | ✓ |
| Remove analytics statements | Strip all analytics text | |
| Leave PRIVACY.md unchanged | No legal-text edits | |

**User's choice:** Rename product name only; keep analytics statements.

## Planning Documents

| Option | Description | Selected |
|--------|-------------|----------|
| Rename there too | All `.planning/` docs use WebMarker Extensions | ✓ |
| Leave planning artifacts | Historical GSD records untouched | |

**User's choice:** Rename product name inside `.planning/` documents too.

## Readiness

| Option | Description | Selected |
|--------|-------------|----------|
| Ready — write CONTEXT.md | Capture all decisions | ✓ |
| Explore more gray areas | Continue asking | |

**User's choice:** Ready.

## the agent's Discretion

- Exact kebab-case package name and zip filename.
- No version bump as part of the rebrand.
- Whether product-mentioning source comments are updated for consistency.
- Wording of the note explaining why upgrade fixtures retain "Nanobrowser".

## Deferred Ideas

None.
