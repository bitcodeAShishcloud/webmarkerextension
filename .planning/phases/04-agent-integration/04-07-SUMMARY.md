---
phase: 04-agent-integration
plan: 07
subsystem: ui
tags: [tailwind, css-tokens, warm-gray, wcag-aa, theming, react]

# Dependency graph
requires:
  - phase: 04-agent-integration
    provides: "04-05 terracotta token family and 04-06 dereferenced canvas background rules that this add-on recolours"
provides:
  - "Warm-gray #B1ADA1 canvas, page and surface tokens in both themes with dark #0F1B2D text and light color-scheme"
  - "WCAG-AA derived muted/link/border shades against #B1ADA1, with accent restricted to fills/focus"
  - "Four accent-as-text consumers switched to AA-safe text-nb-link with no behaviour change"
affects: [ui, settings-ui, side-panel, theme, future-theme-work]

# Actuals (#2632) — pairs with the plan's estimate (tokens: 42000) on the same chars/4 scale.
actuals:
  tokens: 752
  tasks: 3
  commits: 2

# Measured commit ledger (#3968)
plan_head_before: 53dc0a1c54a4b93b88e05b914dd28d695a1c7830
plan_head_after: d7f211733928e11831627f4368d15666441a493b

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Token values change in src/ui/index.css only; Tailwind token(name) mapping keeps nb-* class names stable"
    - "Colour-only class swaps (text-nb-accent → text-nb-link) leave conditions, handlers and hrefs untouched"
    - "Generated output is rebuilt with the Node 24 WXT binary, never hand-edited"

key-files:
  created:
    - .planning/phases/04-agent-integration/04-07-SUMMARY.md
  modified:
    - src/ui/index.css
    - src/options/ProvidersSection.tsx
    - src/options/PrivacyCard.tsx
    - src/ui/mode-menu.tsx
    - src/side-panel/ModelMenu.tsx

key-decisions:
  - "D-30: both :root and .dark resolve --nb-canvas/--nb-bg/--nb-surface to 177 173 161 (#B1ADA1); --nb-fg stays #0F1B2D and color-scheme stays light in both themes"
  - "D-31: muted 68 62 56 (#443E38, 4.700:1), link 110 46 23 (#6E2E17, 4.531:1) and border 95 91 83 (#5F5B53, 3.012:1) are derived against the new canvas; accent #C15F3C stays fills/focus only because it is 1.884:1 as text"
  - "D-31: dark --nb-accent-strong unified to #A8492D (5.744:1 against white) so it only ever sits behind text-white; --nb-auto amber, --nb-sky and --nb-shadow keep their HEAD values"
  - "D-32: the five background rules remain byte-exact background: rgb(var(--nb-canvas)); and merely resolve to the new warm-gray token; brand image files are byte-identical and dereferenced"
  - "Executed on master per the project's branching_strategy: none and the established 04-01..04-06 commit convention; no state or roadmap file was updated by this executor"

patterns-established:
  - "Warm-gray surface tokens are the single source of truth for every background; consumer classes need no edit"
  - "AA text on the warm canvas uses text-nb-link, never text-nb-accent or text-nb-accent-strong"

requirements-completed: []

coverage:
  - id: D1
    description: "Warm-gray #B1ADA1 canvas, page and surface in both themes with dark text and light color-scheme"
    verification:
      - kind: other
        ref: "python warmgray_token_gate.py (source + built :root/.dark triplets, color-scheme, token consumers, WCAG ratios)"
        status: pass
    human_judgment: false
  - id: D2
    description: "AA-derived muted, link and border shades plus unified accent-strong fill in built CSS"
    verification:
      - kind: other
        ref: "python warmgray_token_gate.py (cr(muted)=4.700, cr(link)=4.531, cr(fg)=7.705, cr(border)=3.012, cr(accent)=1.884, cr(accent-strong/white)=5.744)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Five canvas-based background rules clean of image/gradient literals, four accent-as-text consumers on text-nb-link, brand assets byte-identical"
    verification:
      - kind: other
        ref: "python warmgray_background_gate.py and python audit_gate.py (823 passed, byte-identity, scope and ROADMAP assertions)"
        status: pass
    human_judgment: false

# Metrics
duration: 7min
completed: 2026-11-26
status: complete
---

# Phase 4 Plan 7: Warm-gray canvas Summary

**Replaced the white UI canvas with a warm-gray #B1ADA1 surface in both themes, derived WCAG-AA text/border shades against it, and removed all four accent-as-text usages without touching behaviour, assets or config.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-11-26T16:29:27Z
- **Completed:** 2026-11-26T16:36:15Z
- **Tasks:** 3 (two implementation commits; Task 3 was audit-only with no file changes)
- **Files modified:** 5 source files (plus this new SUMMARY)

## Accomplishments

- `:root` and `.dark` now declare `--nb-canvas`, `--nb-bg` and `--nb-surface` as `177 173 161` (#B1ADA1), with `--nb-fg` unchanged at #0F1B2D (7.705:1) and `color-scheme: light` in both themes; the header brandbook comment describes the warm-gray canvas.
- Derived `--nb-muted` #443E38 (4.700:1), `--nb-link` #6E2E17 (4.531:1) and `--nb-border` #5F5B53 (3.012:1) in both themes; unified dark `--nb-accent-strong` to #A8492D, kept `--nb-accent` #C15F3C for fills/focus only (1.884:1 as text) and left amber/sky/shadow untouched.
- Kept all five `.nb-wave` / `.nb-start` / `.nb-field` rules byte-exact as `background: rgb(var(--nb-canvas));` and rewrote only the three stale white-field comments; no image, blue/navy hex or gradient survives in source or built CSS.
- Swapped the three selected-item `CheckIcon` colour classes and the privacy-policy link from `text-nb-accent` to `text-nb-link`; zero accent-as-text classes remain in `src/**` or `entrypoints/**`, with conditions, handlers, sizes, href, target and rel unchanged.
- Proved the result end to end in source and rebuilt CSS: type-check, lint, 823 tests, build and zip pass, the five brand assets plus `tailwind.config.ts` and `wxt.config.ts` are byte-identical, version stays 0.3.0, and the full `AUDIT_GATE_OK` guardrail sweep passes.

## Task Commits

Each implementation task was committed atomically:

1. **Task 1: End-to-end warm-gray palette — tokens to built CSS in both themes** — `8c4e21e` (feat)
2. **Task 2: Keep the five canvas rules clean and remove accent-as-text** — `d7f2117` (fix)
3. **Task 3: Final guardrail audit and full verification** — audit-only, all checks passed with no file changes, so no commit was required

**Plan metadata:** the SUMMARY commit follows this file (docs(04-07)); `plan_head_before`/`plan_head_after` above cover the two task commits measured at write time.

## Files Created/Modified

- `src/ui/index.css` — exact warm-gray triplets in both token blocks, refreshed brandbook/canvas comments, five unchanged canvas-resolving background rules.
- `src/options/ProvidersSection.tsx` — selected-provider CheckIcon uses `text-nb-link`.
- `src/ui/mode-menu.tsx` — selected-mode CheckIcon uses `text-nb-link`.
- `src/side-panel/ModelMenu.tsx` — selected-model CheckIcon uses `text-nb-link`.
- `src/options/PrivacyCard.tsx` — privacy-policy link uses `text-nb-link`.
- `.planning/phases/04-agent-integration/04-07-SUMMARY.md` — this execution record.

## Decisions Made

- Followed D-29..D-33 exactly: this is an add-on plan, so 04-01..04-06 plans, every SUMMARY, CONTEXT.md, DISCUSSION-LOG.md, RESEARCH.md, VERIFICATION.md and STATE.md were left untouched.
- `requirements: []` was respected — CMOD-12 was already satisfied by earlier plans, so no requirement checkbox was changed by this executor.
- The pre-existing ROADMAP.md already carried the unchecked `04-07-PLAN.md` line and 5/7 counts from the planner, so no ROADMAP edit was needed.
- Node 24 direct binaries were used for tsc, ESLint, Vitest and WXT because system Node v22 with engine-strict rejects pnpm; generated output was always rebuilt, never hand-edited.

## Deviations from Plan

None - plan executed exactly as written. All three required gates (`WARMGRAY_TOKEN_GATE_OK`, `WARMGRAY_BACKGROUND_GATE_OK`, `AUDIT_GATE_OK`) passed on the first full run after the fixes, and no deviation rule was triggered.

## Issues Encountered

- The plan's verification scripts are written as bash `python -c '...'` one-liners, but this environment's shell is PowerShell. They were transcribed verbatim into temporary `.py` files under the approved temp directory and run with `python <file>`; assertions and expected output strings are unchanged.
- One transcription typo in the Task 1 gate script (`)` inside a string literal) caused a local `SyntaxError`; it was corrected and the gate then passed. No source file was affected.
- The system Node is v22.17.0 while the project engines require >=24.22.1, so the canonical `pnpm ...` commands were replaced with the plan's documented Node 24 direct-binary invocations; no install or config change was made.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The warm-gray canvas is fully wired and audited across source and built output; no behaviour, asset, config or version change was introduced, so the CMOD-12 verification in 04-VERIFICATION.md remains valid.
- `pnpm autorun` is not in CI and this CSS/class-only change touches no automated-check assertion, so no extra autorun run is required.
- No blockers remain for subsequent UI work; STATE.md and ROADMAP.md were intentionally left for the orchestrator to advance.

---
*Phase: 04-agent-integration*
*Completed: 2026-11-26*

## Self-Check: PASSED

- Verified all five modified source files and the new SUMMARY.md exist on disk.
- Verified both task commits (`8c4e21e`, `d7f2117`) are ancestors of HEAD.
- Verified `WARMGRAY_TOKEN_GATE_OK`, `WARMGRAY_BACKGROUND_GATE_OK` and `AUDIT_GATE_OK` all printed, with type-check, lint, 823 tests, build and zip passing.
