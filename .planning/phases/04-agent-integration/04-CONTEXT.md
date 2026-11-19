# Phase 4: Agent Integration - Context

**Gathered:** 2026-10-31
**Updated:** 2026-11-19 (rebrand decisions added)
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 4 originally verifies end-to-end agent runs on a custom tool-calling model: screenshot tool registered only when `profile.vision === true`, context management degrades gracefully when usage is null, CORS-blocked endpoints surface a distinct status-0 error and document origin allowance.

**Added scope (2026-11-19):** Rebrand the product everywhere from "Nanobrowser" to **WebMarker Extensions** — user-visible strings, documentation, package/manifest metadata and external links. Internal identifiers stay unchanged so existing browser storage, CSS and messaging keep working. This is a string/metadata change, not a new capability.

**Out of scope:** internal identifier renames (`nb.*` storage keys, `nb-*` CSS variables/classes, `nb-panel` port name, `nb.data` message name, `.nanobrowser` gitignore entry), filename or folder renames, code behaviour changes, version bump.

</domain>

<decisions>
## Implementation Decisions

### Original phase decisions (kept)
- **D-01:** Screenshot tool registered only when `profile.vision === true`; verified by a test flipping `overrides.vision`. — **Reversibility:** reversible
- **D-02:** Context management degrades gracefully (estimation) when usage comes back null. — **Reversibility:** reversible
- **D-03:** CORS-blocked endpoints surface a distinct status-0 error and document origin allowance. — **Reversibility:** reversible

### Rebrand — identity and placement
- **D-04:** The exact product name is **WebMarker Extensions** (Title Case, both words capitalised). — **Reversibility:** reversible
- **D-05:** The rebrand is added to the existing Phase 4 as a new plan; no new phase is created. Phase 4's completed agent-integration plans stay as they are. — **Reversibility:** reversible

### Rebrand — rename depth
- **D-06:** Rename user-visible and documented text and metadata: HTML `<title>` tags in `entrypoints/*/index.html`, all three UI locale catalogues (`src/ui/locales/*.json`), browser manifest locale messages (`public/_locales/*/messages.json`), user-facing source strings and comments that name the product (e.g. `src/options/AboutSection.tsx`, `src/ui/links.ts`, `src/ui/protocol.ts`, `src/llm/providers.ts`), README.md, PRIVACY.md, SECURITY.md, CONTRIBUTING.md, AGENTS.md (CLAUDE.md is a link to it), `.github/` issue templates and FUNDING.yml, and `package.json` name / `pnpm zip` output name. Also rename the product name inside `.planning/` documents (PROJECT.md, ROADMAP.md, REQUIREMENTS.md, research docs and phase artifacts) — the user explicitly chose "everywhere". — **Reversibility:** reversible
- **D-07:** Do **not** rename internal identifiers: `nb.*` storage keys (`nb.settings`, `nb.theme`, `nb.data`, etc.), `nb-*` CSS variables and utility classes, the `nb-panel` port name, the `.nanobrowser` gitignore entry, or any filename/folder name. These are not user-visible and renaming them would break stored settings/conversations or require a data migration. — **Reversibility:** one-way for stored data — changing `nb.*` keys would orphan existing users' saved settings and conversations, which have no migration path

### Rebrand — links and external references
- **D-08:** GitHub links point to the fork: `https://github.com/bitcodeAShishcloud/webmarkerextension` (replacing `github.com/nanobrowser/nanobrowser` everywhere, including issue-template URLs, README clone instructions, SECURITY advisory link and the starter prompt in the locales). — **Reversibility:** reversible
- **D-09:** Remove links with no fork equivalent: Chrome Web Store listing, Discord, X/Twitter, sponsor/DeepWiki badges and links. Settings → About keeps its website row, but the link becomes the fork GitHub URL and the visible label becomes `github.com/bitcodeAShishcloud/webmarkerextension`. The `websiteUrl` helper in `src/ui/links.ts` is repointed accordingly. — **Reversibility:** reversible
- **D-10:** The upgrade-test fixtures `fixtures/upgrade/old-manifest.json` and `fixtures/upgrade/old-storage.json` keep the name "Nanobrowser" — they intentionally simulate the *old* version being upgraded from. Add a short comment or plan note explaining why, so a later reader does not "fix" them. — **Reversibility:** reversible
- **D-11:** PRIVACY.md changes only the product name; the PostHog/analytics and daily-count statements remain as written because the code still contains those paths. — **Reversibility:** reversible

### Claude's Discretion
- Exact casing of the package name (`webmarker-extensions` in kebab-case) and zip filename (`webmarker-extensions-<version>.zip`).
- Keep the manifest version at `0.3.0` — no version bump as part of the rebrand.
- Whether individual source comments that merely mention the old name are updated for consistency or left alone; visible strings and documentation must be updated.
- Comment wording that explains why upgrade fixtures retain "Nanobrowser".

### Folded Todos
None.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project rules and product docs
- `AGENTS.md` — project scope, import rules, toolchain, working rules; CLAUDE.md is a link to it
- `README.md` — product name, install/quick-start, community and external links
- `PRIVACY.md` — privacy statements naming the product and its team
- `SECURITY.md` — vulnerability reporting link
- `CONTRIBUTING.md` — contributor docs and zip filename
- `package.json` — package name, repository URL, `zip` script
- `wxt.config.ts` — build output directory and manifest generation

### User-visible strings and UI
- `entrypoints/sidepanel/index.html`, `entrypoints/options/index.html`, `entrypoints/welcome/index.html`, `entrypoints/permission/index.html`, `entrypoints/offscreen/index.html` — page titles
- `public/_locales/en/messages.json`, `public/_locales/zh_CN/messages.json`, `public/_locales/zh_TW/messages.json` — manifest extension name and command descriptions
- `src/ui/locales/en.json`, `src/ui/locales/zh_CN.json`, `src/ui/locales/zh_TW.json` — all in-extension copy including the starter prompt URL
- `src/ui/links.ts` — website URL helper used by About and help links
- `src/options/AboutSection.tsx` — About card title and website row
- `src/llm/providers.ts` — `X-Title` header and `HTTP-Referer` sent to providers
- `src/ui/protocol.ts` — comment naming the product

### GitHub and fixture surfaces
- `.github/ISSUE_TEMPLATE/bug_report.yml`, `.github/ISSUE_TEMPLATE/feature_request.yml`, `.github/ISSUE_TEMPLATE/config.yml`, `.github/FUNDING.yml`
- `fixtures/upgrade/old-manifest.json`, `fixtures/upgrade/old-storage.json` — intentionally keep "Nanobrowser"

### Planning documents
- `.planning/PROJECT.md`, `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md`, `.planning/STATE.md`
- `.planning/phases/01-settings-ui-validation/`, `.planning/phases/02-profile-wiring-validation/`, `.planning/phases/03-test-probe-robustness/`, `.planning/phases/04-agent-integration/` — phase artifacts

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/ui/links.ts` — single `websiteUrl(path, place)` helper; repointing it updates every help/About link at once
- `src/ui/i18n.ts` + three locale JSON catalogues — all user-visible copy lives in catalogues, so renaming the product is a catalogued string edit rather than scattered JSX text
- `wxt.config.ts` — generates `dist/manifest.json` from `package.json` and `public/_locales/`; no hand-editing of built output

### Established Patterns
- Product strings are localised in `src/ui/locales/*.json` and `public/_locales/*/messages.json` — keep all three languages in lockstep
- Generated output (`dist/**`, `.wxt/**`) is never edited; rebuild after changes
- AGENTS.md requires asking before renaming files/folders — this rebrand explicitly excludes file/folder renames

### Integration Points
- `package.json` name/repository feed the built manifest and `pnpm zip` filename
- `src/llm/providers.ts` sends `X-Title` and `HTTP-Referer` to third-party providers — renaming those values changes what providers see
- Upgrade fixtures are compared against stored data in upgrade tests — they must retain the old name

</code_context>

<specifics>
## Specific Ideas

- Fork URL to use everywhere: `https://github.com/bitcodeAShishcloud/webmarkerextension`
- About row label: `github.com/bitcodeAShishcloud/webmarkerextension`
- Package name: `webmarker-extensions`; zip: `webmarker-extensions-<version>.zip`
- The user's words: "pura jagah name change kr ke webmarker extensions krna hai" — interpreted as everywhere visible/documented, with internal identifiers deliberately excluded per D-07.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within the rebrand scope.

### Reviewed Todos (not folded)
None.

</deferred>

---
*Phase: 04-agent-integration*
*Context gathered: 2026-10-31; rebrand decisions added 2026-11-19*
