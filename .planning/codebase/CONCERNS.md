---
last_mapped_commit: 19dc8e8a9be6ed06c0ef9ec7de8d84bf6a88c458
last_mapped_at: 2026-10-30
---
# Codebase Concerns

**Analysis Date:** 2026-10-30

## Tech Debt

**Puppeteer internal accessors (fragile coupling):**
- Issue: `FrameTopology` reads Puppeteer's private fields (`_id`, `_parentId`, `_client()`, `_loaderId`) via `as unknown as` casts. A Puppeteer minor upgrade can silently break frame tracking, which is the whole perception/interaction pipeline.
- Files: `src/browser-control/host/frame-topology.ts` (lines 13-38, 146-156)
- Impact: Frame IDs, session IDs and loader IDs become wrong; refs fail closed or commands target the wrong frame. `checkFrameAccessors` fails loudly, but only at runtime when a frame is first read.
- Fix approach: Pin `puppeteer-core` to the exact tested version (currently `^25.16.0` allows minor bumps); add a unit test that constructs a fake frame and asserts the accessors; consider upstreaming a public accessor.

**Probe compiled to a string constant:**
- Issue: The layer's only in-page code lives in `src/browser-control/probe/source.ts` (~1096 lines) and is compiled into a string constant injected into pages. It uses `as any` casts (8 sites) and an `/* eslint-disable @typescript-eslint/no-explicit-any */` at the top.
- Files: `src/browser-control/probe/source.ts`
- Impact: Any TypeScript error inside the probe is only caught by the probe's own tests; refactors are risky; the `as any` casts hide DOM API drift.
- Fix approach: Keep the eslint-disable local to the probe; add targeted unit tests in `src/browser-control/probe/__tests__/probe.test.ts` for each new helper; prefer typed DOM narrowing where cheap.

**Deprecated alias kept for a spike:**
- Issue: `toDebuggerSessionId` is a deprecated re-export of `normalizeSessionId`, left over from the step 0.2 spike.
- Files: `src/browser-control/host/cdp-session.ts` (lines 12-15)
- Impact: Minor; keeps a confusing name in the public-ish host surface.
- Fix approach: Remove once no caller references it (grep shows only the definition).

**Large, monolithic files:**
- Issue: Several files exceed 600 lines and mix concerns: `src/extension/run-manager.ts` (1421 lines), `src/agent/loop.ts` (1109), `src/browser-control/probe/source.ts` (1096), `src/browser-control/core/tools/text.ts` (1040), `src/browser-control/core/controller.ts` (816), `src/browser-control/core/perception/outline.ts` (751).
- Impact: Hard to review and to test in isolation; changes risk regressions.
- Fix approach: Split by responsibility only when a natural seam exists (e.g. run-manager's `#reopen`/`#launch`); avoid churn-only refactors.

**Storage cache invalidation on service worker restart:**
- Issue: `bindings.ts` keeps a module-level `cache` of `ScopeState` in `chrome.storage.session`; `storage.ts` keeps a per-instance `cache`. A restart recreates them, but concurrent reads before load resolves can race; `blocking()` in `db.ts` closes and nulls the opening promise.
- Files: `src/extension/bindings.ts` (lines 16-22), `src/store/storage.ts`, `src/store/db.ts` (lines 31-35)
- Impact: Low; mostly self-healing, but a half-way migration can re-run.
- Fix approach: Document the invariants; add a test that simulates a restart mid-write.

## Known Bugs

**No TODO/FIXME markers in source:**
- The codebase carries no `TODO`/`FIXME`/`HACK` comments, so latent issues are not tracked in code. Concerns live only in docs and checks.

**`chrome.debugger.onDetach` reason handling:**
- Issue: Only `canceled_by_user` detach triggers Stop; other detach reasons (e.g. navigation, policy) leave the run thinking it still holds the tab.
- Files: `src/extension/run-manager.ts` (lines 136-140)
- Impact: A run can keep acting after the debugger detached, surfacing as `DEBUGGER_DETACHED` errors mid-tool.
- Fix approach: Treat any detach for a held tab as a stop or re-attach path; tests in `src/background/checks/`.

**Grouping failures are swallowed:**
- Issue: `TabScope.#group` catches and only `console.warn`s grouping errors, so a failed tab group leaves state inconsistent (group recorded but tabs ungrouped).
- Files: `src/extension/bindings.ts` (lines 273-277)
- Impact: Orphaned group state; panels still show tabs but grouping is wrong.
- Fix approach: Re-throw or record a recoverable error; retry on next `add`.

## Security Considerations

**Broad host permissions:**
- Risk: `host_permissions: ['<all_urls>']` grants the extension access to every site's DOM and network, required for the agent's job but a large blast radius if the extension is compromised.
- Files: `wxt.config.ts` (line 28)
- Current mitigation: The layer only attaches `chrome.debugger` to tabs the conversation holds; page content is wrapped in marked boundaries (`layer.wrap`); password/card/OTP values are masked.
- Recommendations: Keep the masking and boundary rules; review any new code path that reads page content outside `wrap`.

**`chrome.debugger` is the only CDP path (by design):**
- Risk: Attaching the debugger shows Chrome's "controlled by automated software" banner and disables some site features; detach on navigation can interrupt a run.
- Files: `src/browser-control/host/cdp-session.ts`, `src/extension/run-manager.ts` (lines 136-140)
- Current mitigation: Session state is invalidated cleanly on detach (`DEBUGGER_DETACHED`).
- Recommendations: Keep the invariants in `AGENTS.md` (no WebSocket CDP, no parallel registry).

**API keys in `chrome.storage.local`:**
- Risk: Keys are stored unencrypted in the browser profile; any extension with storage access or a compromised profile can read them.
- Files: `src/store/settings.ts` (lines 118-119), `src/extension/upgrade.ts` (moves old keys)
- Current mitigation: Keys are never exported, never logged, never sent anywhere but their own provider; `PRIVACY.md` documents this.
- Recommendations: No stronger mitigation available in MV3 without a native host; document the limitation.

**Origin check on panel port:**
- Risk: A panel connection from outside the extension's sidepanel page must be rejected.
- Files: `src/extension/panel-port.ts` (lines 10-15)
- Current mitigation: Checks `port.sender.id === chrome.runtime.id` and URL prefix `sidepanel.html`. Good.
- Recommendations: Keep this check; add a test if the panel URL changes.

**Page script execution requires user approval:**
- Risk: The layer runs page script only after a confirm; the agent's sessions get no `devtools`.
- Files: `src/browser-control/core/interaction/*`, `AGENTS.md`
- Current mitigation: `sensitive` policy + confirm before dispatch for submit/pay/delete and page script.
- Recommendations: Preserve; do not add a bypass.

**Closed shadow root for the page border:**
- Risk: `border.ts` injects a glow element via `chrome.scripting.executeScript` using `innerHTML` inside a closed shadow root. Content is static template with interpolated CSS color constants only (no user input), so no XSS today, but the pattern must stay free of user-controlled strings.
- Files: `src/extension/border.ts` (lines 143-155)
- Recommendations: Keep the interpolated values to constants; lint for template changes.

## Performance Bottlenecks

**Probe and outline are large hot paths:**
- Problem: Perception runs on every observation; `outline.ts` (751 lines) and `layout.ts` (355) process the full frame tree.
- Files: `src/browser-control/core/perception/outline.ts`, `src/browser-control/core/perception/layout.ts`
- Cause: Walking all frames and computing geometry for every capture.
- Improvement path: Keep the existing budgets (`BOUNDED` invariants); profile with the autorun `observe-timing`/`capture-timing` checks before changing.

**Screenshot base64 round-trips:**
- Problem: Screenshots are base64-encoded and passed to the model and to thumbnails; large pages produce multi-MB strings held in memory and in IndexedDB blobs.
- Files: `src/extension/run-manager.ts` (`#screenshotTab`), `src/agent/attachments.ts`
- Cause: No streaming/downsampling; `MAX_FILE` 25 MB / `MAX_CONVERSATION` 100 MB caps exist but are generous.
- Improvement path: Downsample before storage where the model does not need full resolution; keep caps.

**Analytics serial queue:**
- Problem: Every count goes through a single `chain` promise (`serial`); under load, writes serialize and can lag.
- Files: `src/extension/analytics.ts` (lines 60-65)
- Cause: Correctness over throughput.
- Improvement path: Acceptable for current scale; revisit only if counts drop.

**Journal persistence coalescing:**
- Problem: Events are persisted to `chrome.storage.session` after a 250 ms timer; a worker that dies within that window loses the recent window.
- Files: `src/extension/journal.ts` (lines 112-117)
- Improvement path: Flush on `visibilitychange`/beforeunload is not available in a service worker; accept the small loss or shorten the timer.

## Fragile Areas

**Puppeteer upgrade (see Tech Debt):** `frame-topology.ts` relies on internals; a version bump must be followed by the `puppeteer` host tests.

**Restore after worker restart:**
- Files: `src/extension/run-manager.ts` (`restore`, `#reopen`), `src/agent/restore.ts`
- Why fragile: Reconstructs tool results as `INTERRUPTED`, re-opens cards with new IDs, and re-launches runs; many branches depend on stored `pendingPrompt` and `steering`.
- Safe modification: Change only with the `restore` unit tests (`src/agent/__tests__/restore.test.ts`) and the autorun restart scenarios.
- Test coverage: `restore.test.ts` covers the table; integration-level restart coverage lives in autorun scenarios.

**Upgrade from the old WebMarker Extensions (0.2):**
- Files: `src/extension/upgrade.ts`, `src/store/legacy.ts`
- Why fragile: One-time, idempotent-ish migration of providers, keys, prompts, blocked sites and analytics choice; old keys removed only after the record is stored. A half-stopped worker finishes on next start.
- Safe modification: Keep the "nothing written twice" ordering; extend `upgrade.test.ts` for any new moved field.
- Test coverage: `src/extension/__tests__/upgrade.test.ts` (14k).

**Tab scope and group state:**
- Files: `src/extension/bindings.ts`
- Why fragile: In-memory cache over `chrome.storage.session`; group updates are async and permission-gated (`tabGroups` optional).
- Safe modification: Treat `tabGroups` as possibly absent (already done); never assume group exists.
- Test coverage: No direct unit tests; covered by autorun checks.

**Model catalogue and profiles:**
- Files: `src/llm/catalogue.ts`, `src/llm/profiles.ts`, `src/llm/providers.ts`
- Why fragile: `findRow` matching drives analytics model rows and capability detection; model names are string-matched against a built-in catalogue.
- Safe modification: Add tests in `src/llm/__tests__/`.

## Scaling Limits

**Conversations and entries:**
- Current capacity: IndexedDB `entries` store indexed by `conversationId`; `toModelMessages` elides and compacts.
- Limit: Context window caps a single run; very long histories hit `CONTEXT_LIMIT` and stop.
- Scaling path: Compaction (`runCompaction`) and elision (`planElision`); new conversations for new tasks.

**Attachments:**
- Current capacity: 25 MB per file, 100 MB per conversation, 16 files per message (`MAX_FILE`, `MAX_CONVERSATION`, `MAX_FILES`).
- Limit: Browser memory and IndexedDB quota; `unlimitedStorage` permission raises the quota but not RAM.
- Scaling path: Stream or reject large files earlier.

**Service worker lifetime:**
- Current capacity: Watchdog alarm every 30 s while any run is unfinished.
- Limit: Chrome can still terminate the worker; runs are restored on next start.
- Scaling path: Already handled by restore; keep tool results idempotent.

## Dependencies at Risk

**puppeteer-core ^25.16.0:**
- Risk: Reliance on private accessors (above); minor version changes can break frame tracking.
- Impact: Whole browser control layer.
- Migration plan: Pin and test before bumping; keep `host/__tests__/puppeteer.test.ts` green.

**@ai-sdk/* and `ai` (pinned to 7.0.150 etc.):**
- Risk: AI SDK minor releases change streaming part shapes; `stream.ts` casts `providerOptions as any`.
- Impact: Model calls, tool calls, reasoning.
- Migration plan: Bump with `stream.test.ts` and `reasoning-wire.test.ts` green; verify `providerOptions` typing.

**idb ^8.0.4:**
- Risk: Schema changes require a migration step in `db.ts` (`DB_VERSION`); currently only version 1.
- Impact: Stored conversations.
- Migration plan: Bump `DB_VERSION` and add an `upgrade` branch; never change stores in place.

**zod 4.6.7:**
- Risk: Protocol schemas; a major bump changes error shapes.
- Impact: `protocol/*`.
- Migration plan: Run `protocol.test.ts`.

**Chrome minimum 125:**
- Risk: Uses MV3 APIs (`sidePanel`, `scripting`, `debugger`) available in 125+; older Chrome cannot install.
- Impact: User base.
- Migration plan: Documented in manifest; raise only with a reason.

## Missing Critical Features

**Not in the first release (by design):** skills loaded by the model, site notes, saved memory, in-page Stop pill, PDF/Office parsing, text tool-call parser, scheduled tasks, MCP bridge. These are out of scope per `AGENTS.md`; do not add without being asked.

**Test panel is developer-only:**
- Problem: The `testpanel` entrypoint and `open-test-panel` command are unbound by default; end users cannot run the layer checks.
- Blocks: Manual verification by contributors requires binding the shortcut.

## Test Coverage Gaps

**`src/extension/run-manager.ts` (1421 lines):**
- What's not tested: The launch/restore/reopen/compaction flow end-to-end in unit tests.
- Files: `src/extension/run-manager.ts`
- Risk: Regressions in run lifecycle, queue handling, rebranching.
- Priority: High

**`src/extension/bindings.ts` (TabScope):**
- What's not tested: Grouping, move, restore-view, blocked-site handling.
- Files: `src/extension/bindings.ts`
- Risk: Tab ownership and grouping bugs reach users.
- Priority: High

**`src/extension/permissions.ts`:**
- What's not tested: `decide`, site rules, blocked list change notification.
- Files: `src/extension/permissions.ts`
- Risk: Permission decisions wrong → over/under-asking.
- Priority: Medium

**`src/extension/models.ts`, `journal.ts`, `prompt-broker.ts` (partial):**
- What's not tested: Model resolution edge cases; journal persistence/replay; broker answer matching.
- Files: `src/extension/models.ts`, `src/extension/journal.ts`, `src/extension/prompt-broker.ts`
- Risk: Medium.
- Priority: Medium

**`src/background` checks and scenarios (0 unit tests):**
- What's not tested: The autorun checks and scenario sets are run only via `pnpm autorun` in a real Chrome; nothing runs in CI.
- Files: `src/background/checks/*`, `src/background/scenarios/*`
- Risk: Regressions in the layer's browser behavior are not caught by `pnpm test`/CI.
- Priority: High (but requires a browser; out of CI by design)

**`src/test-panel` and `src/options` UI:**
- What's not tested: Most options pages and test-panel tabs have no unit tests.
- Files: `src/options/*`, `src/test-panel/*`
- Risk: UI regressions.
- Priority: Low

**`src/ui` manifest-permissions test exists but licences test is the only dep guard:**
- What's not tested: New runtime deps require updating `src/options/licences.ts`; the test fails loudly, which is good but is a manual step.
- Files: `src/options/licences.ts`
- Priority: Low

---

*Concerns audit: 2026-10-30*
