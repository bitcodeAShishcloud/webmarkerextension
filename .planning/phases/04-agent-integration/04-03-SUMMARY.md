---
phase: 04-agent-integration
plan: 03
subsystem: ui
tags: [rebrand, webmarker-extensions, metadata, links, locales]
requires:
  - phase: 04-agent-integration
    provides: "Completed agent-integration plans 04-01 and 04-02; rebrand added per D-05"
provides:
  - "Product identity WebMarker Extensions across package, manifest locale, UI catalogues, HTML titles, source strings and notifications"
  - "Fork GitHub URL repointing in links, providers headers, privacy URL, README and GitHub metadata"
  - "Removal of Web Store, Discord, X, sponsor and DeepWiki links from README"
  - "Verified build/zip webmarker-extensions-0.3.0.zip and repository-wide legacy-name gate"
affects: [README, PRIVACY, SECURITY, CONTRIBUTING, AGENTS, CLAUDE, planning docs]
tech-stack:
  added: []
  patterns:
    - "Rebrand via string/metadata only; internal identifiers untouched (D-07)"
key-files:
  created: []
  modified:
    - package.json
    - public/_locales/en/messages.json
    - public/_locales/zh_CN/messages.json
    - public/_locales/zh_TW/messages.json
    - src/ui/locales/en.json
    - src/ui/locales/zh_CN.json
    - src/ui/locales/zh_TW.json
    - entrypoints/sidepanel/index.html
    - entrypoints/options/index.html
    - entrypoints/welcome/index.html
    - entrypoints/permission/index.html
    - entrypoints/offscreen/index.html
    - src/ui/links.ts
    - src/options/AboutSection.tsx
    - src/options/PrivacyCard.tsx
    - src/llm/providers.ts
    - src/ui/protocol.ts
    - src/ui/icons.tsx
    - src/extension/notify.ts
    - src/extension/bindings.ts
    - src/extension/selection.ts
    - src/extension/upgrade.ts
    - src/agent/loop.ts
    - src/agent/export.ts
    - fixtures/autorun.mjs
    - README.md
    - PRIVACY.md
    - SECURITY.md
    - CONTRIBUTING.md
    - AGENTS.md
    - .claude/CLAUDE.md
    - .github/ISSUE_TEMPLATE/bug_report.yml
    - .github/ISSUE_TEMPLATE/feature_request.yml
    - .github/ISSUE_TEMPLATE/config.yml
    - .github/FUNDING.yml
    - .planning/PROJECT.md
    - .planning/ROADMAP.md
    - .planning/REQUIREMENTS.md
    - .planning/research/ARCHITECTURE.md
    - .planning/research/FEATURES.md
    - .planning/research/PITFALLS.md
    - .planning/research/STACK.md
    - .planning/research/SUMMARY.md
    - .planning/codebase/CONCERNS.md
    - .planning/codebase/INTEGRATIONS.md
    - .planning/codebase/STRUCTURE.md
key-decisions:
  - "Exact product name WebMarker Extensions (Title Case) per D-04; package name webmarker-extensions; version stays 0.3.0"
  - "GitHub links repointed to https://github.com/bitcodeAShishcloud/webmarkerextension; Web Store/Discord/X/sponsor/DeepWiki links removed from README"
  - "Internal identifiers (nb.* keys, nb-* classes, nb-panel port, .nanobrowser, IndexedDB name) left untouched per D-07"
  - "Upgrade fixtures fixtures/upgrade/old-manifest.json and old-storage.json left byte-for-byte unchanged per D-10"
  - "PRIVACY.md analytics/PostHog statements preserved; only product name changed per D-11"
  - "SEEDED prompts in upgrade.ts rebranded/removed so upgrade.ts carries no legacy product token; upgrade tests updated to match"
patterns-established:
  - "Case-sensitive product-token replacement; internal identifiers and legacy fixture tokens remain allowlisted"
requirements-completed: []
actuals:
  tokens: 32817
  tasks: 4
  commits: 7
duration: ~manual
completed: 2026-11-19
status: complete
---

# Phase 04 Plan 03: Rebrand product identity to WebMarker Extensions Summary

**Rebranded the product from the legacy name to WebMarker Extensions across package metadata, manifest locale catalogues, UI catalogues, HTML titles, source strings, notifications, documentation and GitHub metadata, while leaving internal identifiers, filenames, version 0.3.0, upgrade fixtures and PRIVACY analytics statements unchanged.**

## Performance

- **Duration:** manual execution
- **Started:** 2026-11-19
- **Completed:** 2026-11-19
- **Tasks:** 4
- **Files modified:** 57

## Accomplishments

- Package name set to `webmarker-extensions`, repository URL repointed to the fork, version unchanged at 0.3.0
- Manifest locale messages (en/zh_CN/zh_TW) resolve extName/actionTitle/commandOpenPanel/menuAskAboutSelection to WebMarker Extensions
- All three UI locale catalogues rebranded, including starter-prompt URLs
- HTML page titles, notifications, tab-group titles, stop notice, exported Markdown headers, logo alt text and seeded starter prompts rebranded
- `websiteUrl` and `PRIVACY_URL` repointed to the fork; About card title/label updated
- OpenRouter `X-Title`/`HTTP-Referer` updated; providers test assertion updated
- README purged of Web Store, Discord, X, sponsor and DeepWiki links; GitHub links repointed
- PRIVACY.md analytics/PostHog statements preserved
- Internal identifiers (nb.* keys, nb-* classes, nb-panel port, .nanobrowser, IndexedDB name) verified unchanged
- Upgrade fixtures left byte-for-byte unchanged
- Repository-wide legacy-name gate passes outside the documented allowlist

## Task Commits

1. **Task 1: End-to-end product identity** - `4074b1f` (feat)
2. **Task 2: Rebrand remaining user-visible strings, titles and links** - `36e06e7` (feat)
3. **Task 3: Rebrand product docs, GitHub metadata and planning documents** - `224cd13` (docs)
4. **Task 4: Guardrail audit and full verification** - `95ef674` (chore, lint cleanups) plus metadata commit

**Plan metadata:** final commit (docs: complete plan)

## Files Created/Modified

See key-files list in frontmatter; 57 files changed total.

## Decisions Made

- Used case-sensitive replacement of the capital product token to avoid touching internal identifiers
- Moved SEEDED prompt matching consequences into updated upgrade tests rather than weakening the legacy-name gate
- Removed two unused test locals (profiles.test.ts, model-test.test.ts) to satisfy lint

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Removed unused `fromApi` local in profiles.test.ts**
- **Found during:** Task 1 verification (lint)
- **Issue:** Pre-existing unused variable broke `pnpm lint`
- **Fix:** Removed the unused `const fromApi` line
- **Files modified:** src/llm/__tests__/profiles.test.ts
- **Verification:** lint exits 0

**2. [Rule 3 - Blocking] Removed unused `db` import in model-test.test.ts**
- **Found during:** Task 1 verification (lint)
- **Issue:** Pre-existing unused import broke `pnpm lint`
- **Fix:** Changed import to `closeDb` only
- **Files modified:** src/options/__tests__/model-test.test.ts
- **Verification:** lint exits 0

**3. [Rule 1 - Bug] Updated upgrade.test.ts expectations after SEEDED rebrand**
- **Found during:** Task 2 verification (tests)
- **Issue:** Rebranding SEEDED entries changed which old prompts are skipped during migration, breaking 3 upgrade tests
- **Fix:** Updated expected moved ids, favorites count, shortcut names list and shortcut count
- **Files modified:** src/extension/__tests__/upgrade.test.ts
- **Verification:** full test suite passes (823 passed)

**4. [Rule 2 - Missing Critical] Added `_place` underscore to unused websiteUrl parameter**
- **Found during:** Task 4 verification (lint)
- **Issue:** `place` parameter unused after repointing websiteUrl, breaking lint
- **Fix:** Renamed to `_place` to satisfy unused-arg rule while keeping signature
- **Files modified:** src/ui/links.ts
- **Verification:** lint exits 0

**Total deviations:** 4 auto-fixed (2 blocking, 1 bug, 1 missing critical)
**Impact on plan:** All auto-fixes necessary for lint/test/gate compliance. No scope creep.

## Issues Encountered

- Intermediate test failures between Task 1 and Task 2 due to cross-task coupling (en.json rebranded before loop.ts); resolved by completing Task 2.
- `pnpm` engine check rejects the installed Node; used direct binary invocations with the Node 24 runtime throughout.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Rebrand complete and audited; type-check, lint, tests, build and zip all pass.
- `pnpm autorun` manual pre-merge check (languages, optional-permissions, welcome, voice, panel-run, upgrade, permission-warnings) still to be run before merge per AGENTS.md.
- No blockers.

---
*Phase: 04-agent-integration*
*Completed: 2026-11-19*
