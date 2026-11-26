---
phase: 04-agent-integration
plan: 04
subsystem: ui
tags: [pillow, png, branding, wxt, chrome-extension, assets]

# Dependency graph
requires:
  - phase: 04-agent-integration
    provides: "04-03 already rebranded UI strings and the icons.tsx alt text; this plan only swaps image contents"
provides:
  - "public/icon-32.png — 32x32 RGBA W-mark-only toolbar/favicon icon"
  - "public/icon-128.png — 128x128 RGBA W-mark-only manifest icon / LogoMark source"
  - "public/brand/logo-horizontal.png — 840x142 RGBA full WebMaker lockup (W mark + wordmark + tagline)"
  - "Pixel-level gates ICON_GATE_OK / LOCKUP_GATE_OK / AUDIT_GATE_OK and a rebuilt dist + zip"
affects: [04-agent-integration, future UI branding work]

# Actuals (#2632) — same scale as the plan estimate (chars/4 over the realized diff).
# The realized diff is three binary PNGs (116,495 bytes total); tokens = bytes/4 proxy.
actuals:
  tokens: 29124
  tasks: 3
  commits: 2
  plan_head_before: e31a03d845ff7bfae05e3232e9f033a3140f97e6
  plan_head_after: 11f4ed5cbdb3bc186a3c42b284837d7da1b8041f

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Derive product assets from external source crops with Pillow ImageOps.contain on transparent canvases"
    - "Replace public/ asset contents at unchanged paths; rebuild dist/** instead of hand-editing generated output"
key-files:
  created:
    - .planning/phases/04-agent-integration/04-04-SUMMARY.md
  modified:
    - public/icon-32.png
    - public/icon-128.png
    - public/brand/logo-horizontal.png
key-decisions:
  - "D-13/D-14: source artwork read only from outside the repo; only derived crops committed"
  - "D-15: icons carry the W mark alone; the UI lockup carries mark + wordmark + tagline"
  - "D-07/D-16/D-17: filenames, decorative wave assets, manifest icon sizes, version and code behaviour untouched"
patterns-established:
  - "Uniform ImageOps.contain fit plus alpha_composite on a transparent canvas — no stretch, no fill, no recolour"
  - "Gate each asset from source crop through public/ to the rebuilt dist/ byte-for-byte"

requirements-completed: []

coverage:
  - id: D1
    description: "32x32 RGBA W-mark-only toolbar/favicon icon with transparent corners and legible mark"
    verification:
      - kind: other
        ref: "verify_icons.py -> ICON_GATE_OK (dimensions, alpha bbox, coverage, palette overlap, contain fit, HEAD diff, dist byte-match)"
        status: pass
    human_judgment: false
  - id: D2
    description: "128x128 RGBA W-mark-only manifest icon and LogoMark source"
    verification:
      - kind: other
        ref: "verify_icons.py -> ICON_GATE_OK (same assertions, 112x88 fit inside 128 px)"
        status: pass
    human_judgment: false
  - id: D3
    description: "840x142 RGBA full WebMaker horizontal lockup with W mark, wordmark and tagline"
    verification:
      - kind: other
        ref: "verify_lockup.py -> LOCKUP_GATE_OK (bbox, left/right content, 118x92 and 640x129 fits, source colours, dist byte-match)"
        status: pass
    human_judgment: false

# Metrics
duration: 6min
completed: 2026-11-26
status: complete
---

# Phase 4 Plan 4: WebMaker Brand Assets Summary

**W-mark-only 32/128 px toolbar icons and an 840×142 WebMaker wordmark+tagline lockup composed from the supplied source crops, with all paths, manifest sizes, version and code behaviour unchanged**

## Performance

- **Duration:** 6 min
- **Started:** 2026-11-26T13:45:11Z
- **Completed:** 2026-11-26T13:51:04Z
- **Tasks:** 3 of 3
- **Files modified:** 3 (binary PNGs)

## Accomplishments

- Replaced `public/icon-32.png` and `public/icon-128.png` with W-mark-only icons cropped from the user-supplied artwork and uniformly fitted to transparent canvases (28×22 and 112×88 fits at HEAD), preserving source colours exactly.
- Composed `public/brand/logo-horizontal.png` as a full WebMaker lockup — W mark (118×92) plus wordmark and tagline (640×129) with a 24 px gap — on the existing 840×142 transparent canvas, with no stretching.
- Rebuilt `dist/` and confirmed all three deliverables are copied byte-for-byte; produced `dist-zip/webmarker-extensions-0.3.0.zip`.
- Audited all guardrails: no source art committed, PNG filename set unchanged, decorative wave assets byte-identical, manifest still 32/128, version still 0.3.0, `src/ui/icons.tsx` unchanged.
- Full suite green on every task: type-check, lint, 823 unit tests (4 pre-existing skips), build, zip, plus ICON_GATE_OK, LOCKUP_GATE_OK and AUDIT_GATE_OK.

## Task Commits

Each task was committed atomically:

1. **Task 1: End-to-end W-mark icons — source crop to both PNG sizes to rebuilt dist icons** — `3bc0308` (feat; tracer)
2. **Task 2: Compose the 840×142 horizontal WebMaker lockup** — `11f4ed5` (feat)
3. **Task 3: Guardrail audit and full verification** — no commit (audit-only; no edits required because every check passed)

**Plan metadata:** `e31a03d` (plan added by planner)

_Note: Task 1 is a `tracer` task. Its feedback gate re-ran the full verify end-to-end and passed before Task 2 began._

## Files Created/Modified

- `public/icon-32.png` — 32×32 RGBA W-mark-only icon (859 → 1706 bytes)
- `public/icon-128.png` — 128×128 RGBA W-mark-only icon (7564 → 15555 bytes)
- `public/brand/logo-horizontal.png` — 840×142 RGBA full WebMaker lockup (38894 → 99234 bytes)
- `.planning/phases/04-agent-integration/04-04-SUMMARY.md` — this summary

## Decisions Made

- None new — D-12 through D-17 from `04-CONTEXT.md` were implemented exactly as specified. The source artwork was read only from `C:/Users/shesh/Downloads/logo (1).png` and never copied into the repository.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Task 3 audit gate derived its changed-file set from a clean working tree**
- **Found during:** Task 3 (guardrail audit)
- **Issue:** The plan's `<automated>` gate computes `changed` from `git status --porcelain`. Atomic per-task commits leave the working tree clean, so the gate would false-fail on `deliverables.issubset(changed)` even though both task commits changed exactly the three PNGs.
- **Fix:** Adapted only that one computation to diff against the persisted plan-base ledger (`git diff --name-only $PLAN_HEAD_BEFORE` plus `git ls-files --others --exclude-standard`). Every original assertion was preserved verbatim, and AUDIT_GATE_OK was obtained. No repository file was edited for this fix — it is gate-harness adaptation only.
- **Files modified:** none
- **Verification:** `AUDIT_GATE_OK` with `changed = ['public/brand/logo-horizontal.png', 'public/icon-128.png', 'public/icon-32.png']`; scoped `git diff --stat` names exactly those three files.

---

**Total deviations:** 1 auto-fixed (1 blocking/execution-harness)
**Impact on plan:** None on shipped assets — every pixel assertion and guardrail still passed unmodified. No scope creep.

## Issues Encountered

- **Toolchain:** system Node is v22.17.0 and `engine-strict` rejects `pnpm`, so the plan's documented Node 24 direct-invocation fallback was used for all checks (`node.exe node_modules/typescript/bin/tsc --noEmit`, `eslint.js .`, `vitest.mjs run`, `wxt.mjs build`, `wxt.mjs zip`). Pillow 12.3.0 was already installed agent-side, so no dependency install or legitimacy gate was triggered.
- **Pre-existing test noise:** the suite reports 4 skipped tests and benign React `useLayoutEffect`/AI SDK deprecation warnings on stderr. These are unrelated to this asset-only change and out of scope.
- **`pnpm autorun` intentionally not run:** AGENTS.md keeps browser checks out of CI, and this plan changes no automated-check assertion or check logic — only three binary image contents. The pixel gates plus the unchanged CMOD-12 verification in `04-VERIFICATION.md` are sufficient; no extra autorun run is required per the plan's manual-gate note.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 4's asset work is complete: W-mark toolbar/favicon icons and the full WebMaker UI lockup ship at the original paths with the original manifest declarations.
- No blockers. STATE.md and ROADMAP.md completion updates remain owned by the orchestrator.

---
*Phase: 04-agent-integration*
*Completed: 2026-11-26*

## Self-Check: PASSED

- Found: `.planning/phases/04-agent-integration/04-04-SUMMARY.md`, `public/icon-32.png`, `public/icon-128.png`, `public/brand/logo-horizontal.png`
- Found commits: `3bc0308` (Task 1), `11f4ed5` (Task 2) — both ancestors of HEAD
- No stubs introduced by this plan; the `alt=""` in unchanged `src/ui/icons.tsx` is the pre-existing decorative logo mark, out of scope here
- No new threat surface: only three binary asset contents changed, with no endpoint, auth, file-access or schema change
