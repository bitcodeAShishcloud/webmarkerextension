---
phase: 04-agent-integration
plan: 06
subsystem: ui
tags: [css, tailwind, theme-tokens, all-white-canvas, wcag-aa, chrome-extension]

requires:
  - phase: 04-agent-integration
    provides: "The 04-05 terracotta UI palette and byte-identical WebMaker brand assets that the all-white canvas builds on"
provides:
  - "Pure #FFFFFF canvas, background and surfaces in both themes, with #0F1B2D dark text, #5B6B82 muted text and color-scheme: light in :root and .dark"
  - "Dark --nb-link darkened to #A04529 (6.217:1 on white), the same AA shade as light links, so every text token meets 4.5:1 on white"
  - "Five blue/navy wave/start/field background rules dereferenced to exactly background: rgb(var(--nb-canvas)) in source and white-based in built CSS"
  - "Unchanged #C15F3C accent family, #B1ADA1 light border, #283A58 dark border, --nb-auto amber and every nb-* class name"
  - "Five brand image files byte-identical to HEAD; no config, version, dependency, behaviour or generated-output change"
affects: [04-agent-integration, future UI-theme work]

actuals:
  tokens: 749
  tasks: 3
  commits: 2
  plan_head_before: b5adfceaa1cb9a6e5402060b4fccf26c3bc709ab
  plan_head_after: 5dc7e41508b72966771efcd84f1232656bf2cfee

tech-stack:
  added: []
  patterns:
    - "Theme colours live only as --nb-* RGB triplets in src/ui/index.css; tailwind.config.ts maps token names, never values"
    - "Setting all five wave/start/field rules to the same token lets the CSS minifier merge them into one selector list without semantic change"
    - "Text on a white canvas uses #A04529 links; hover-only accent-strong stays #E0916E because it is never a text colour"

key-files:
  created:
    - .planning/phases/04-agent-integration/04-06-SUMMARY.md
  modified:
    - src/ui/index.css

key-decisions:
  - "D-24: added to closed Phase 4 as another new plan; all prior plans, summaries, context, verification and planning docs untouched"
  - "D-25: --nb-canvas, --nb-bg and --nb-surface are 255 255 255 in both :root and .dark; fg/muted stay dark and color-scheme is light in both"
  - "D-26: all five blue/navy background rules became the pure-white canvas token; no pale-blue field, navy gradient or wave image URL remains"
  - "D-27: panel-wave.png, wave.jpg and the three logo/icon assets stay byte-identical; only their CSS references were removed"
  - "D-28: the 04-05 terracotta/amber/border values are retained except dark --nb-link, which D-20's contrast clause derives to the existing #A04529 AA shade"

patterns-established:
  - "End-to-end token proof: assert the exact triplets in both the source CSS and the rebuilt dist/assets CSS, not just in source"
  - "Contrast is recomputed numerically from sRGB first principles, including the actual dark link hex read back from built CSS"

requirements-completed: []

coverage:
  - id: D1
    description: "All-white token triplets, light color-scheme in both themes and AA-safe dark links reach source and built CSS"
    verification:
      - kind: other
        ref: "Task 1 verify: type-check, lint, vitest, wxt build, ALLWHITE_TOKEN_GATE_OK"
        status: pass
    human_judgment: false
  - id: D2
    description: "Five blue/navy background rules dereferenced to the white token with zero blue/image literals left"
    verification:
      - kind: other
        ref: "Task 2 verify: type-check, lint, vitest, wxt build, BACKGROUND_GATE_OK"
        status: pass
    human_judgment: false
  - id: D3
    description: "Brand assets, configs, version, scope and AA guardrails hold; rebuild, zip and 823 tests pass"
    verification:
      - kind: other
        ref: "Task 3 verify: type-check, lint, vitest, wxt build, wxt zip, AUDIT_GATE_OK"
        status: pass
    human_judgment: false

duration: 5min
completed: 2026-11-26
status: complete
---

# Phase 04: Agent Integration — Plan 06 Summary

**Both themes now resolve canvas, background and surfaces to #FFFFFF with #0F1B2D dark text, #A04529 AA-safe links and the #C15F3C terracotta accent, while five blue/navy wave rules are dereferenced to the white token and all brand image files stay byte-identical**

## Performance

- **Duration:** ~5 min
- **Started:** ~2026-11-26T15:54:00Z
- **Completed:** 2026-11-26T15:58:57Z
- **Tasks:** 3/3
- **Files modified:** 1 source file (plus this SUMMARY)
- **Commits:** 2 task commits (plan head b5adfce → 5dc7e41); this SUMMARY is a separate docs commit

## Accomplishments

- `:root --nb-surface` changed from `234 244 252` to `255 255 255`; the light canvas, background, text, muted text, border, accent family, amber and `color-scheme: light` were already compliant and left untouched.
- `.dark` now declares canvas/background/surface `255 255 255`, foreground `15 27 45`, muted `91 107 130`, link `160 69 41` (#A04529, 6.217:1 on white) and `color-scheme: light`; its border `40 58 88`, accent `193 95 60`, hover-only accent-strong `224 145 110`, sky `217 131 96`, amber `251 191 36` and shadow `0 8 24` remain at their 04-05 values.
- The five background rules (`.nb-wave`, `.dark .nb-wave`, `.nb-start`, `.dark .nb-start`, `.dark .nb-field`) now each declare exactly `background: rgb(var(--nb-canvas));` in source and resolve to that token in the built CSS; the pale-blue field, its transparent companion, four navy hexes and both wave image URLs are gone.
- The header brandbook comment and the three background comments now describe a pure white canvas with dark text in both themes and no image-backed wave; no stale navy or pale-blue wording remains.
- The five brand image files, `tailwind.config.ts`, `wxt.config.ts`, `package.json` (0.3.0 / pnpm@10.34.7), every `nb-*` identifier and all code behaviour are byte-identical to HEAD; generated output was rebuilt, never hand-edited.
- Full suite passes: type-check, lint, 823 passing tests (4 pre-existing skips), build and zip producing `dist-zip/webmarker-extensions-0.3.0.zip`.

## Task Commits

Each task was committed atomically:

1. **Task 1: End-to-end all-white palette — tokens to built CSS in both themes** — `d6e9fc3` (feat, tracer)
2. **Task 2: Dereference the blue/navy backgrounds in the five CSS rules** — `5dc7e41` (style)
3. **Task 3: Final guardrail audit and full verification** — no code changes; audit only (docs commit for this SUMMARY follows)

**Tracer feedback gate:** Task 1's `<verify>` is automated-only; it passed end to end (`ALLWHITE_TOKEN_GATE_OK`, with the built CSS carrying the exact triplets and light color-scheme in both themes), so expansion to Tasks 2 and 3 continued without a human checkpoint.

## Files Created/Modified

- `src/ui/index.css` — exact all-white triplets in `:root` and `.dark`, AA-safe dark link, light color-scheme in both themes, five dereferenced white background rules and truthful comments.
- `.planning/phases/04-agent-integration/04-06-SUMMARY.md` — this summary.

## Decisions Made

- Kept dark `--nb-accent-strong: 224 145 110`: a repo-wide check confirms it is used only as `hover:bg-nb-accent-strong` behind `text-white`, never as `text-nb-accent-strong`, so a white canvas does not change its contrast basis and D-28 keeps the 04-05 value.
- Derived dark `--nb-link` from `#E0916E` (2.487:1 on white) to the already-existing light AA shade `#A04529` (6.217:1) rather than inventing a new colour, as D-20 permits.
- Used the pure-white form of all five background rules rather than a faint terracotta wash (which D-26 permits) so the gate could be exact and the base is unambiguously `#FFFFFF`.
- Left `panel-wave.png` and `wave.jpg` on disk, byte-identical, merely dereferenced from CSS (D-27).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Task 2 built-CSS assertion did not account for minifier selector merging**
- **Found during:** Task 2 verification (post-edit gate).
- **Issue:** The plan's built-CSS check required each selector to be immediately followed by `{`. WXT/esbuild minifies adjacent rules with identical declarations into one comma-separated selector list — `.nb-wave,.dark .nb-wave,.nb-start,.dark .nb-start,.dark .nb-field{background:rgb(var(--nb-canvas))}` — so the assertion failed `built rule missing: .nb-wave` even though the built CSS was correct and stronger than required.
- **Fix:** Adapted only the temporary gate script to match each selector as an exact member of a rule's selector list rather than as a literal prefix of `{`. Every semantic assertion was kept: byte-exact source bodies, the white base in built CSS, and zero blue/navy/image literals in both source and built CSS.
- **Files modified:** none in the repository — the adjustment was to the verification harness only (`%TEMP%/opencode/gate_task2.py`).
- **Verification:** `BACKGROUND_GATE_OK` after the adaptation; the verbatim Task 3 `AUDIT_GATE_OK` (which checks built literals generically, not rule shape) passed unchanged.
- **Committed in:** no production change; Task 2 remains `5dc7e41`.

---

**Total deviations:** 1 auto-fixed (verification-harness shape mismatch)
**Impact on plan:** No production or scope impact. The required source form (five identical declarations) necessarily triggers the minifier's legal merge; all intended guarantees are still asserted and pass.

## Issues Encountered

- The system Node is v22 and pnpm's engine-strict setting rejects the pinned scripts, so every check used the plan's documented Node 24 direct-binary fallback (`node.exe` from the codex runtime invoking `tsc`, `eslint.js`, `vitest.mjs`, `wxt.mjs build` and `wxt.mjs zip`). All tools ran on Node v24.14.0.
- The minifier selector merge is described under Deviations above; the built CSS is semantically correct.
- Existing warnings are pre-existing and out of scope: the AI SDK deprecation warnings from tests and Vite's chunk-size notice.
- Per the orchestrator's instruction, `STATE.md` and `ROADMAP.md` were not modified by this executor; the pre-committed unchecked `04-06-PLAN.md` ROADMAP line and all five pre-existing Phase 4 lines remain intact.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None - no placeholder, empty data binding or TODO/FIXME was introduced.

## Threat Flags

None - the change is confined to CSS token values, five background declarations and comments; it adds no endpoint, auth path, file access or schema surface. T-04-23 through T-04-27 and the reserved T-04-SC row were mitigated exactly as planned.

## Next Phase Readiness

- Phase 4 all-white-canvas work is complete and audited; the rebuilt extension and 0.3.0 zip carry a pure white canvas in both themes with AA-safe dark text.
- `pnpm autorun` is not in CI (AGENTS.md) and this CSS-only change touches no automated-check assertion or agent behaviour, so no extra autorun run was needed; the CMOD-12 verification in `04-VERIFICATION.md` remains valid.
- No blockers or concerns remain.

---
*Phase: 04-agent-integration*
*Completed: 2026-11-26*

## Self-Check: PASSED

- Verified on disk: `src/ui/index.css`, `.planning/phases/04-agent-integration/04-06-SUMMARY.md` and `dist-zip/webmarker-extensions-0.3.0.zip`.
- Verified commits are ancestors of HEAD: `d6e9fc3` (Task 1), `5dc7e41` (Task 2).
- All three gates returned their required literals: `ALLWHITE_TOKEN_GATE_OK`, `BACKGROUND_GATE_OK` (shape-adapted as documented) and verbatim `AUDIT_GATE_OK` including the dark-link contrast assertion.
- `git status --short` shows only the new untracked SUMMARY before its docs commit; `STATE.md` and `ROADMAP.md` were not modified.
