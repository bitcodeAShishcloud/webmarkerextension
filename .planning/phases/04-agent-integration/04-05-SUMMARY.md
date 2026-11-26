---
phase: 04-agent-integration
plan: 05
subsystem: ui
tags: [css, tailwind, theme-tokens, terracotta, dark-mode, wcag-aa, chrome-extension]

requires:
  - phase: 04-agent-integration
    provides: "The rebranded WebMarker Extensions shell and byte-identical WebMaker brand assets that this UI theme sits on top of"
provides:
  - "Light UI palette with a pure white #FFFFFF canvas, #C15F3C terracotta accent and #B1ADA1 border/divider token"
  - "AA-safe terracotta text shades: links #A04529 (6.217:1 on white), accent-strong #A8492D (5.744:1), dark links #E0916E (6.779:1 on #111D32)"
  - "Coherent terracotta dark palette with the dark start-page glow emitted as #c15f3c40, preserving all non-accent dark tokens and color-scheme switching"
  - "Token-only theme wiring: accent-color, ::selection, Tailwind mapping and every nb-* class pick up the new values with no config or class edit"
  - "Byte-identical brand assets, out-of-scope page glow, Tailwind/WXT config, package version 0.3.0 and unchanged code behaviour"
affects: [04-agent-integration, future UI-theme work, future glow-recolour work]

actuals:
  tokens: 1330
  tasks: 3
  commits: 2
  plan_head_before: 71709e3d69bf5087b9f02a7db3d1cd0b8218bc72
  plan_head_after: 0de779fd7674ceb6e65e1dd0905fa6458669e76b

tech-stack:
  added: []
  patterns:
    - "Theme colours live only as --nb-* RGB triplets in src/ui/index.css; tailwind.config.ts maps token names, never values"
    - "Exact brand accent #C15F3C is reserved for accents, focus rings and borders; text on white uses darker terracotta shades to meet WCAG AA"
    - "Semantic --nb-auto stays amber in both themes; decorative assets and the separate page-glow feature are not brand tokens"

key-files:
  created:
    - .planning/phases/04-agent-integration/04-05-SUMMARY.md
  modified:
    - src/ui/index.css
    - src/options/Welcome.tsx
    - src/side-panel/History.tsx

key-decisions:
  - "D-19: light canvas is #FFFFFF and the brand accent is exactly #C15F3C, applied at the token level"
  - "D-20: all blue-derived accent-family tokens were recoloured; links and accent-strong use darker terracotta shades so text meets WCAG AA on white, while #C15F3C stays for accents/focus/borders and --nb-auto stays amber"
  - "D-21: dark mode keeps its eight non-accent tokens, both color-scheme declarations and its gradient structure; only accent-family tokens become terracotta"
  - "D-22: all five logo/brand assets and the out-of-scope blue page glow in src/extension/border.ts stay byte-identical"
  - "D-23: #B1ADA1 is used only on the light --nb-border token, never for text or surfaces"

patterns-established:
  - "Token-only recolouring: change values in src/ui/index.css, rebuild with wxt, never hand-edit dist/** or change tailwind.config.ts"
  - "Contrast is proven numerically from first principles (sRGB linearisation, 4.5:1 AA) rather than eyeballed"

requirements-completed: []

coverage:
  - id: D1
    description: "Light palette tokens reach the built extension CSS with accent-color, ::selection and color-scheme:light intact"
    verification:
      - kind: other
        ref: "Task 1 verify: type-check, lint, vitest, wxt build, LIGHT_TOKEN_GATE_OK"
        status: pass
    human_judgment: false
  - id: D2
    description: "Dark terracotta palette, #c15f3c40 glow, zero old brand-blue literals and WCAG AA contrast proven"
    verification:
      - kind: other
        ref: "Task 2 verify: type-check, lint, vitest, wxt build, DARK_TOKEN_GATE_OK"
        status: pass
    human_judgment: false
  - id: D3
    description: "Brand assets, configs, version and scope guardrails hold; rebuild and zip pass"
    verification:
      - kind: other
        ref: "Task 3 verify: type-check, lint, vitest, wxt build, wxt zip, AUDIT_GATE_OK"
        status: pass
    human_judgment: false

duration: 6min
completed: 2026-11-26
status: complete
---

# Phase 04: Agent Integration — Plan 05 Summary

**White #FFFFFF canvas with a #C15F3C terracotta accent and #B1ADA1 borders wired through CSS tokens into the built extension, with AA-safe terracotta link shades, a coherent dark palette and all brand assets preserved**

## Performance

- **Duration:** ~6 min
- **Started:** ~2026-11-26T15:07:00Z
- **Completed:** 2026-11-26T15:13:10Z
- **Tasks:** 3/3
- **Files modified:** 3 source files (plus this SUMMARY)
- **Commits:** 2 task commits (plan head 71709e3 → 0de779f); this SUMMARY is a separate docs commit

## Accomplishments

- Light `:root` now declares canvas `255 255 255`, border `177 173 161`, accent `193 95 60`, accent-strong `168 73 45`, link `160 69 41`, sky `217 136 100` and shadow `120 60 40`; `accent-color`, `::selection` and `color-scheme: light` remain token-driven.
- Dark `.dark` now declares accent `193 95 60`, accent-strong/link `224 145 110` and sky `217 131 96`; its other eight tokens, `color-scheme: dark`, `.dark .nb-wave` and `.dark .nb-field` gradients are untouched.
- The dark start-page radial glow changed from `rgb(0 115 220 / 0.25)` to `rgb(193 95 60 / 0.25)` and is emitted as `#c15f3c40` in the built CSS.
- Every old brand-blue literal is gone from UI source and built CSS; two stale colour comments in `Welcome.tsx` and `History.tsx` now describe terracotta while their JSX and class names stay unchanged.
- Five brand assets, `tailwind.config.ts`, `wxt.config.ts`, `src/extension/border.ts`, `package.json` version 0.3.0 and every `nb-*` identifier are byte-identical to HEAD. No dependency, rename, behaviour change or generated-output hand-edit.
- Full suite passes: type-check, lint, 823 passing tests (4 pre-existing skips), build and zip producing `dist-zip/webmarker-extensions-0.3.0.zip`.

## Task Commits

Each task was committed atomically:

1. **Task 1: End-to-end light palette — token declarations to built CSS** — `ad06bf0` (feat, tracer)
2. **Task 2: Dark palette, dark glow and stale consumer comments** — `0de779f` (feat)
3. **Task 3: Guardrail audit and full verification** — no code changes; audit only (docs commit for this SUMMARY follows)

**Tracer feedback gate:** Task 1's `<verify>` is automated-only, and all three gates (`LIGHT_TOKEN_GATE_OK`, `DARK_TOKEN_GATE_OK`, `AUDIT_GATE_OK`) passed end to end, so expansion to Tasks 2 and 3 continued without a human checkpoint.

## Files Created/Modified

- `src/ui/index.css` — exact light/dark `--nb-*` triplets, terracotta dark glow gradient and truthful comments; accent-color and `::selection` still follow tokens.
- `src/options/Welcome.tsx` — the step-pill comment now describes a soft terracotta ring and terracotta text; class names unchanged.
- `src/side-panel/History.tsx` — the status comment now describes the running state as terracotta; class names and JSX unchanged.
- `.planning/phases/04-agent-integration/04-05-SUMMARY.md` — this summary.

## Decisions Made

- Kept the exact brand accent `#C15F3C` for accents, focus rings and borders; used `#A04529` for links and `#A8492D` for accent-strong because `#C15F3C` alone measures 4.226:1 on white, below AA — per D-20.
- Kept dark `--nb-shadow: 0 8 24` (`#000818`) because it is a neutral near-black shadow, not a brand accent, and D-21 requires retaining the dark palette structure.
- Left the light `.nb-start` pale wash and decorative wave assets unchanged (D-22), recolouring only the dark glow literal.
- Left `src/extension/border.ts` blue page glow untouched and byte-identical: it is asserted by `edgeBlue()` in `src/background/checks/page-border.ts` and simulated by a fixture, so recolouring it would require check/fixture edits and a behaviour change (T-04-22, accepted).

## Deviations from Plan

None - plan executed exactly as written. All three `<verify>` gates returned their required success literals on the first run; no auto-fix was needed.

## Issues Encountered

- The system Node is v22.17.0 and pnpm's engine-strict setting would reject the pinned scripts, so every check used the plan's documented Node 24 direct-binary fallback (`node.exe` from the codex runtime invoking `wxt.mjs`, `tsc`, `eslint.js` and `vitest.mjs`). `wxt prepare` was run before `tsc` to mirror the canonical `type-check` script. All four tools ran on Node v24.14.0.
- Existing warnings are pre-existing and out of scope: the WXT `@vitejs/plugin-react` recommendation, Vite's >500 kB chunk notice, puppeteer-core's `node:path` externalisation notice, and the AI SDK deprecation warnings from tests.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None - no placeholder, empty data binding or TODO/FIXME was introduced.

## Threat Flags

None - the change is confined to CSS token values and comments; it adds no endpoint, auth path, file access or schema surface. T-04-17 through T-04-22 were mitigated or accepted exactly as planned.

## Next Phase Readiness

- Phase 4 colour-theme work is complete and audited; the built extension and 0.3.0 zip carry the terracotta palette.
- Per the orchestrator's instruction, `STATE.md` and `ROADMAP.md` were not modified by this executor; the pre-committed unchecked `04-05-PLAN.md` ROADMAP line remains intact for the orchestrator to mark complete.
- `pnpm autorun` is not in CI (AGENTS.md) and this theme-only change touches no automated-check assertion or agent behaviour, so no extra autorun run was needed; the CMOD-12 verification in `04-VERIFICATION.md` remains valid. A future page-glow recolour needs its own plan (T-04-22).

---
*Phase: 04-agent-integration*
*Completed: 2026-11-26*

## Self-Check: PASSED

- Verified on disk: `src/ui/index.css`, `src/options/Welcome.tsx`, `src/side-panel/History.tsx`, `.planning/phases/04-agent-integration/04-05-SUMMARY.md` and `dist-zip/webmarker-extensions-0.3.0.zip`.
- Verified commits are ancestors of HEAD: `ad06bf0` (Task 1), `0de779f` (Task 2).
- Re-ran the stale-blue grep over `src/ui`, `src/options`, `src/side-panel` and `entrypoints`: zero matches.
