---
phase: 04-agent-integration
verified: 2026-11-26T12:43:50Z
status: passed
score: 16/16 must-haves verified
covered_files:
  - .github/FUNDING.yml
  - .github/ISSUE_TEMPLATE/bug_report.yml
  - .github/ISSUE_TEMPLATE/config.yml
  - .github/ISSUE_TEMPLATE/feature_request.yml
  - .planning/phases/04-agent-integration/04-01-PLAN.md
  - .planning/phases/04-agent-integration/04-01-SUMMARY.md
  - .planning/phases/04-agent-integration/04-02-PLAN.md
  - .planning/phases/04-agent-integration/04-02-SUMMARY.md
  - .planning/phases/04-agent-integration/04-03-PLAN.md
  - .planning/phases/04-agent-integration/04-03-SUMMARY.md
  - AGENTS.md
  - CONTRIBUTING.md
  - PRIVACY.md
  - README.md
  - SECURITY.md
  - entrypoints/offscreen/index.html
  - entrypoints/options/index.html
  - entrypoints/permission/index.html
  - entrypoints/sidepanel/index.html
  - entrypoints/welcome/index.html
  - fixtures/autorun.mjs
  - package.json
  - public/_locales/en/messages.json
  - public/_locales/zh_CN/messages.json
  - public/_locales/zh_TW/messages.json
  - src/agent/__tests__/loop.test.ts
  - src/agent/__tests__/tools.test.ts
  - src/agent/export.ts
  - src/agent/loop.ts
  - src/agent/tools.ts
  - src/background/checks/languages.ts
  - src/background/checks/optional-permissions.ts
  - src/background/checks/panel-run.ts
  - src/background/checks/voice.ts
  - src/background/checks/welcome.ts
  - src/extension/__tests__/upgrade.test.ts
  - src/extension/bindings.ts
  - src/extension/notify.ts
  - src/extension/run-manager.ts
  - src/extension/selection.ts
  - src/extension/upgrade.ts
  - src/llm/__tests__/profiles.test.ts
  - src/llm/__tests__/providers.test.ts
  - src/llm/__tests__/stream.test.ts
  - src/llm/providers.ts
  - src/llm/scripted.ts
  - src/llm/stream.ts
  - src/options/AboutSection.tsx
  - src/options/PrivacyCard.tsx
  - src/options/__tests__/model-test.test.ts
  - src/side-panel/__tests__/cards.test.tsx
  - src/ui/icons.tsx
  - src/ui/links.ts
  - src/ui/locales/en.json
  - src/ui/locales/zh_CN.json
  - src/ui/locales/zh_TW.json
  - src/ui/protocol.ts
covered_digest: "v4:sha256:3889b17b120b6eae4d4ed364d053c1ccc0bebcc0d26ca48af38aeb5d4093be46"
behavior_unverified: 0
overrides_applied: 0
re_verification: false
requirements: [CMOD-12]
---

# Phase 4: Agent Integration Verification Report

**Phase Goal:** A custom tool-calling model runs the agent with correct vision gating and usage handling
**Verified:** 2026-11-26T12:43:50Z
**Status:** passed
**Re-verification:** No — initial verification (regenerated to cover the new 04-03 rebrand plan; the prior report predates the rebrand and held no gaps)

## Goal Achievement

### Observable Truths

Truths merge the four ROADMAP success criteria (non-negotiable contract), the 04-01/04-02 must-haves, and the seven 04-03 rebrand must-haves. SC2/SC3/SC4 are restated by 04-01/04-02 truths and are deduplicated against them.

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A custom model with tool calling can be selected as the default model and used to run the agent (SC1, CMOD-12) | ✓ VERIFIED | `src/store/settings.ts:15,44` `defaultModel`, `:112,129` `baseUrl` on `ProviderConfig`; `openai-compatible` provider kind in `src/llm/providers.ts` / `catalogue.ts`; passing tests `src/llm/__tests__/providers.test.ts:113` "a custom OpenAI-compatible endpoint uses its base URL as is", `model-info.test.ts:126`, `connection.test.ts:52`; CMOD-12 marked Complete in REQUIREMENTS.md |
| 2 | `toolsForRun` registers the screenshot tool only when `options.vision === true` (SC2) | ✓ VERIFIED | `src/agent/tools.ts:128` `(t.name !== 'screenshot' || options.vision === true)`; `src/agent/__tests__/tools.test.ts` flips `overrides.vision` true/false and a truthy non-true value |
| 3 | `AgentLoop` never attaches a screenshot image unless `profile.vision === true` | ✓ VERIFIED | `src/agent/loop.ts:701` `if (outcome.call.toolName !== 'screenshot' || this.options.model.profile.vision !== true) return undefined;` |
| 4 | `streamTurn` returns usage null without throwing when the server omits usage (SC3) | ✓ VERIFIED | `src/llm/stream.ts:250` `if (part.usage) usage = toUsage(part.usage);` and `:254` `if (!usage && part.totalUsage) usage = toUsage(part.totalUsage);`; test `stream.test.ts` "returns null usage when the server omits it" passes |
| 5 | `ScriptedModel` can emit a reply whose usage is null | ✓ VERIFIED | `src/llm/scripted.ts:114` `if (reply.usage === null) { ... }` (undefined totals preserved when omitted) |
| 6 | A CORS-blocked agent run surfaces a distinct status-0 / origin-allowance error notice (SC4) | ✓ VERIFIED | `src/extension/run-manager.ts:1344` detects `network && status === undefined` and appends "the endpoint must allow requests from browser extensions (CORS); see Settings → Providers." |
| 7 | A test flips `overrides.vision` and asserts screenshot presence/absence | ✓ VERIFIED | `src/agent/__tests__/tools.test.ts` exists and passes in the full suite |
| 8 | A stream test proves a null-usage reply returns usage null without throwing | ✓ VERIFIED | `src/llm/__tests__/stream.test.ts` exists and passes in the full suite |
| 9 | A loop test proves graceful degradation to estimation on null usage | ✓ VERIFIED | `src/agent/__tests__/loop.test.ts` "degrades gracefully to estimation when usage is null" expects status `done`; passes |
| 10 | No user-visible string, notification, notice, exported header, tab-group/page title, product document, GitHub link, check assertion or package/manifest metadata still presents the legacy name as the current product; survivors confined to the allowlist (04-03) | ✓ VERIFIED | Case-sensitive `git grep -Il -e Nanobrowser -e nanobrowser`: 56 files carry the token, **0 outside the plan's allowlist**. Survivors are the two upgrade fixtures, `.gitignore` `.nanobrowser`, IndexedDB/DOM/port/note-marker identifiers, legacy-version migration quotes, and decision-record quotes. `entrypoints/*/index.html`, all three UI + manifest locales, About, notifications, export header, tab-group titles and check assertions resolve to "WebMarker Extensions" |
| 11 | Built extension resolves manifest name and action/command titles to WebMarker Extensions, keeps `__MSG_extName__` wiring and version 0.3.0 (04-03) | ✓ VERIFIED | Rebuilt `dist/manifest.json`: `"name":"__MSG_extName__"`, `"action.default_title":"__MSG_actionTitle__"`, `"commands.open-panel.description":"__MSG_commandOpenPanel__"`, `"version":"0.3.0"`; `dist/_locales/en/messages.json` resolves to "WebMarker Extensions"; `dist-zip/webmarker-extensions-0.3.0.zip` exists |
| 12 | Internal identifiers byte-for-byte unchanged: `nb.*` keys, `nb-*` CSS vars/classes, `nb-panel` port, `.nanobrowser` gitignore entry (04-03) | ✓ VERIFIED | `git diff 4074b1f^ HEAD` across `.gitignore`, `src/store/db.ts`, `src/store/settings.ts`, `src/ui/index.css`, `src/ui/protocol.ts`, `src/extension/border.ts`, `src/browser-control/probe/index.ts`: only one comment line in `protocol.ts` changed. `nb.settings` (`settings.ts`), `DB_NAME = 'nanobrowser'` (`db.ts`), `--nb-canvas` (`index.css`), `nb-panel` (`protocol.ts`), `.nanobrowser` (`.gitignore`) all intact; no filename/folder renames |
| 13 | All GitHub links point to `https://github.com/bitcodeAShishcloud/webmarkerextension`; Web Store / Discord / X / sponsor / DeepWiki links removed from README.md and `.github/` (04-03) | ✓ VERIFIED | Fork URL present in `package.json`, `src/ui/links.ts`, README, SECURITY, `.github/ISSUE_TEMPLATE/config.yml`, all three UI locales (starter prompt), `src/extension/upgrade.ts`. No `chromewebstore.google.com`, `discord.gg`, `x.com/nanobrowser_ai`, `deepwiki.com` or `github.com/sponsors` in README/`.github/`; no `github.com/nanobrowser/nanobrowser` in any product surface |
| 14 | Upgrade fixtures still contain the legacy name and remain untouched, with an explanatory note in the plan (04-03) | ✓ VERIFIED | `git diff 4074b1f^ HEAD -- fixtures/upgrade/old-manifest.json fixtures/upgrade/old-storage.json` empty; both retain "Nanobrowser"; rationale recorded at `04-03-PLAN.md:257` (D-10) |
| 15 | PRIVACY.md retains PostHog / anonymous daily-count / usage-count statements; only the product name changed (04-03) | ✓ VERIFIED | `git diff 4074b1f^ HEAD -- PRIVACY.md` is name/URL-only: PostHog, "Anonymous daily count", three "usage count" mentions and the one-year-retention / no-ID statements preserved verbatim |
| 16 | `type-check`, `lint`, full `test` suite and `build` all pass after the rebrand (04-03) | ✓ VERIFIED | Node 24 direct binaries: `tsc --noEmit` exit 0 (after `wxt prepare`), `eslint .` exit 0, `vitest run` exit 0 (74 files passed / 1 skipped; 823 tests passed / 4 skipped), `wxt build` exit 0 (built in 9.5 s) |

**Score:** 16/16 truths verified (0 present-but-behavior-unverified, 0 overrides)

### Decision Coverage

`check.decision-coverage-verify` → **11/11 honored**, `not_honored: []`. All CONTEXT.md decisions D-01–D-11 appear in shipped artifacts. Non-blocking gate.

### Threat Model Uniqueness

Numbered threat IDs are unique across the three plans: 04-01 `T-04-01..03`, 04-03 `T-04-04..08`, 04-02 `T-04-09..11` (renumbered in commit `f908793` specifically to resolve the earlier duplicate). `T-04-SC` appears in all three plans — this is the GSD reserved supply-chain row present in every plan of every phase (confirmed in 01-01, 01-02, 02-01, 03-01), not a duplicate numbered threat. No duplicate threat IDs.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/agent/tools.ts` | strict vision gating in `toolsForRun` | ✓ VERIFIED | Exists, substantive, wired to `run-manager.ts:1133,1302` |
| `src/agent/loop.ts` | strict vision check in `#screenshotImage` | ✓ VERIFIED | Exists, substantive; rebrand touched only start-prompt text |
| `src/llm/stream.ts` | null-usage guard in finish-step/finish | ✓ VERIFIED | Exists, substantive, wired to `loop.ts` |
| `src/llm/scripted.ts` | `usage: null` support | ✓ VERIFIED | Exists, substantive |
| `src/extension/run-manager.ts` | distinct CORS/origin notice in `#launch` | ✓ VERIFIED | Exists, substantive |
| `src/agent/__tests__/tools.test.ts` | screenshot-gating test | ✓ VERIFIED | Exists, passing |
| `src/llm/__tests__/stream.test.ts` | null-usage stream test | ✓ VERIFIED | Exists, passing |
| `src/agent/__tests__/loop.test.ts` | null-usage loop degradation test | ✓ VERIFIED | Exists, passing |
| `package.json` | name `webmarker-extensions`, fork repo, version 0.3.0, unchanged deps | ✓ VERIFIED | All fields correct; dependency lists untouched |
| `public/_locales/{en,zh_CN,zh_TW}/messages.json` | extName/actionTitle/commandOpenPanel → WebMarker Extensions | ✓ VERIFIED | All three catalogues carry the exact name |
| `src/ui/locales/{en,zh_CN,zh_TW}.json` | in-extension copy + starter URL rebranded | ✓ VERIFIED | All three carry name and fork URL |
| `src/ui/links.ts` | `websiteUrl` repointed to fork | ✓ VERIFIED | Exists, substantive, imported by AboutSection |
| `src/options/AboutSection.tsx` | About card title + website row | ✓ VERIFIED | Uses `websiteUrl('/', 'about')` |
| `README.md` | name rebranded; no Web Store/Discord/X/sponsor/DeepWiki | ✓ VERIFIED | Confirmed by domain scan |
| `PRIVACY.md` | name rebranded; analytics preserved | ✓ VERIFIED | Confirmed by diff |
| `.planning/ROADMAP.md` | title/prose rebranded (plan list owned by orchestrator) | ✓ VERIFIED | `# Roadmap: WebMarker Extensions` present; see Info note |
| `fixtures/upgrade/old-manifest.json` | intentionally unchanged legacy fixture | ✓ VERIFIED | Byte-for-byte unchanged |
| `fixtures/upgrade/old-storage.json` | intentionally unchanged legacy fixture | ✓ VERIFIED | Byte-for-byte unchanged |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/agent/tools.ts` | `src/extension/run-manager.ts` | `toolsForRun({ vision: model.profile.vision })` | WIRED | Manual: calls at `run-manager.ts:1133` and `:1302`, import at `:8` |
| `src/llm/stream.ts` | `src/agent/loop.ts` | streamTurn usage null → loop estimate fallback | WIRED | Manual: `if (reply.usage)` guards accumulation/estimation |
| `src/options/ProvidersSection.tsx` | `src/extension/run-manager.ts` | OriginFix guidance for chrome-extension:// origin | WIRED | Docs guidance + distinct notice in `run-manager.ts:1344` |
| `package.json` | `dist/manifest.json` | WXT reads name/repository; zip template derives `webmarker-extensions-<version>.zip` | WIRED | Rebuild produced correct manifest + zip artifact |
| `public/_locales/en/messages.json` | `dist/_locales/en/messages.json` | `__MSG_extName__` resolved at install time | WIRED | Rebuilt locale resolves "WebMarker Extensions" |
| `src/ui/links.ts` | `src/options/AboutSection.tsx` | `websiteUrl('/', 'about')` | WIRED | Import at `AboutSection.tsx:5`, usage at `:17` |
| `src/llm/providers.ts` | `src/llm/__tests__/providers.test.ts` | OpenRouter `X-Title` assertion | WIRED | `providers.ts:147` and assertion at `providers.test.ts:126` changed together; suite green |
| `04-CONTEXT.md` | `package.json` | D-04..D-11 implemented; no new requirement ID | WIRED | Decision coverage 11/11; `requirements: []` on 04-03 as intended |

### Data-Flow Trace (Level 4)

Not applicable — the phase delivers gating/null-usage/CORS logic plus a string/metadata rebrand. All rebranded values are confirmed at their canonical source (locale catalogues, HTML titles, `links.ts`, `providers.ts`, `package.json`) and in the rebuilt `dist/` artifacts; no hardcoded placeholder data feeds user-visible output.

### Behavioral Spot-Checks

| Behavior | Command (Node 24 direct binaries) | Result | Status |
|----------|------------------------------------|--------|--------|
| Type-check | `node wxt prepare` then `node node_modules/typescript/bin/tsc --noEmit` | exit 0 | ✓ PASS |
| Lint | `node node_modules/eslint/bin/eslint.js .` | exit 0 | ✓ PASS |
| Full test suite | `node node_modules/vitest/vitest.mjs run` | 74 files passed / 1 skipped; 823 tests passed / 4 skipped; exit 0 | ✓ PASS |
| Build | `node node_modules/wxt/bin/wxt.mjs build` | exit 0, 5.24 s build / 9.49 s total | ✓ PASS |
| Screenshot-gating test | full-suite `tools.test.ts` | passed | ✓ PASS |
| Null-usage stream test | full-suite `stream.test.ts` | passed | ✓ PASS |
| Null-usage loop test | full-suite `loop.test.ts` | passed | ✓ PASS |
| Manifest rebrand wiring | inspect `dist/manifest.json` + `dist/_locales/en/messages.json` | `__MSG_extName__`, `0.3.0`, "WebMarker Extensions" | ✓ PASS |
| Legacy-name allowlist gate | `git grep -Il -e Nanobrowser -e nanobrowser` filtered by allowlist | 56 files, 0 outside allowlist | ✓ PASS |

`pnpm` itself was not used because its engine check requires Node ≥24.22.1 while the available runtime is Node 24.14.0; the equivalent direct binaries were run per the task instruction.

### Probe Execution

SKIPPED — no migration/CLI probe scripts are declared by the three plans.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| CMOD-12 | 04-01, 04-02 | A custom model with tool calling can be selected as the default model and used to run the agent | ✓ SATISFIED | SC1 programmatic checks + strict gating, null-usage degradation, CORS notice; full suite green |
| (none) | 04-03 | Rebrand implements locked CONTEXT decisions D-04–D-11 with no new requirement ID | ✓ SATISFIED | Decision coverage 11/11; `requirements: []` on 04-03 as planned |

No orphaned requirements: REQUIREMENTS.md maps only CMOD-12 to Phase 4 and it is claimed by 04-01/04-02.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/agent/prompt.ts` | 41, 47 | `"You are Nanobrowser, an assistant…"` in the model system prompt | ℹ️ Info | Not user-visible/documented; plan explicitly allowlists `src/agent/prompt.ts` as an internal protocol carrier. D-06 covers visible strings and docs only |

No `TBD`/`FIXME`/`XXX` in rebrand-modified source files. No stubs or hollow props introduced; the rebrand is string/metadata-only.

### Notes (informational, not gaps)

1. `.planning/ROADMAP.md` still reads `**Plans**: 2/3 plans executed`, shows `04-03-PLAN.md` unchecked and Phase 4 `2/3 | In Progress`. The plan frontmatter explicitly assigns the plan-list/progress-row reconciliation to the orchestrator; this report does not edit ROADMAP.md or STATE.md.
2. `pnpm autorun` manual pre-merge checks (languages, optional-permissions, welcome, voice, panel-run, upgrade, permission-warnings) remain a release gate per AGENTS.md, noted in 04-03-SUMMARY.md; they are outside this phase's must-haves and are orchestrator-owned.
3. `SECURITY.md` carries no product-name token at all (only the correctly repointed fork advisory URL). It never named the product before the rebrand, so no identity was lost; its gate is satisfied by other product docs.

### Human Verification Required

N/A — string/metadata-only rebrand. All user-visible strings are asserted at their canonical source catalogues and in the rebuilt `dist/` artifacts, and the runtime rendering path is unchanged; a visual check would re-verify the same literals. No behavior, layout or state-transition changes were made, and no truth is present-but-behavior-unverified.

### Gaps Summary

No gaps. All 16 must-have truths verified, CMOD-12 satisfied, all four build gates green, all rebrand decisions D-04–D-11 honored, internal identifiers and upgrade fixtures untouched, PRIVACY analytics intact, version unchanged at 0.3.0. Phase 4 goal achieved.

---

_Verified: 2026-11-26T12:43:50Z_
_Verifier: the agent (gsd-verifier)_
