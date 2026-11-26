# Phase 4: Agent Integration - Context

**Gathered:** 2026-10-31
**Updated:** 2026-11-19 (rebrand decisions added); 2026-11-26 (logo/brand asset and colour theme decisions added)
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 4 originally verifies end-to-end agent runs on a custom tool-calling model: screenshot tool registered only when `profile.vision === true`, context management degrades gracefully when usage is null, CORS-blocked endpoints surface a distinct status-0 error and document origin allowance.

**Added scope (2026-11-19):** Rebrand the product everywhere from "Nanobrowser" to **WebMarker Extensions** — user-visible strings, documentation, package/manifest metadata and external links. Internal identifiers stay unchanged so existing browser storage, CSS and messaging keep working. This is a string/metadata change, not a new capability.

**Added scope (2026-11-26):** Replace the extension's visual identity with the user-supplied **WebMaker logo**: toolbar/favicon icons and the UI's horizontal brand logo. Asset contents change; asset paths and filenames stay the same. This is a visual asset change, not a new capability.

**Added scope (2026-11-26, colour theme):** Switch the extension UI to a Claude.ai-like palette: `#FFFFFF` background and `#C15F3C` terracotta accent (the user explicitly asked for "seminila like claude.ai"). The logo artwork is explicitly **not** part of this change.

**Out of scope:** internal identifier renames (`nb.*` storage keys, `nb-*` CSS variables/classes, `nb-panel` port name, `nb.data` message name, `.nanobrowser` gitignore entry), filename or folder renames, code behaviour changes, version bump, adding new icon sizes to the manifest, changing decorative wave backgrounds, changing the logo artwork.

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

### Logo — placement and source (2026-11-26)
- **D-12:** The logo change is added to the existing Phase 4 as another new plan (as D-05 did for the rebrand); no new phase is created. Previously shipped plans stay untouched. — **Reversibility:** reversible
- **D-13:** Source artwork is the user-supplied file `C:/Users/shesh/Downloads/logo (1).png` — a stylized blue/purple **W** mark above the wordmark **WebMaker** and the tagline **"We Build Your Web"**. Use it as the source for all derived assets. Do **not** copy the source file into the repository; only the derived product assets are committed. — **Reversibility:** reversible
- **D-14:** Scope covers both the extension icon and UI branding: replace `public/icon-32.png`, `public/icon-128.png` (used by `LogoMark` at small sizes and declared in the manifest) and `public/brand/logo-horizontal.png` (used by `Logo` in the UI). Keep the exact same paths and filenames per D-07. — **Reversibility:** reversible
- **D-15:** Icon sizes get the **W mark only** (crop the stylized W from the source; the wordmark and tagline are unreadable at 32 px). Larger UI branding (`logo-horizontal.png`) keeps the **full lockup** — W mark + "WebMaker" wordmark + "We Build Your Web" tagline — so the brand is recognizable in the side panel/welcome/options. — **Reversibility:** reversible
- **D-16:** Keep decorative background assets `public/brand/panel-wave.png` and `public/brand/wave.jpg` unchanged — they are gradients, not logos. — **Reversibility:** reversible
- **D-17:** Keep the manifest icon sizes as-is: **32 and 128 only**. Do not add 16/48 entries or new PNG files. — **Reversibility:** reversible

### Colour theme (2026-11-26)
- **D-18:** The colour change is added to the existing Phase 4 as another new plan (same add-on pattern as D-05 and D-12); no new phase is created. Previously shipped plans stay untouched. — **Reversibility:** reversible
- **D-19:** User's exact target colours: background **#FFFFFF** and accent **#C15F3C** ("seminila like claude.ai"). Apply at the theme-token level in `src/ui/index.css`: make the light canvas `#FFFFFF` (`--nb-canvas` currently `#FAFBFD`; `--nb-bg` is already `#FFFFFF`) and set the terracotta accent family from `#C15F3C` (RGB 193, 95, 60). — **Reversibility:** reversible
- **D-20:** Recolour all blue-derived brand tokens so no old blue accent survives: `--nb-accent`, `--nb-accent-strong`, `--nb-link`, `--nb-sky` and `--nb-shadow` in light and dark, plus the `accent-color` for inputs and the selection highlight. Keep `--nb-auto` amber — it is a semantic "auto mode" colour, not a brand accent. Derive lighter/darker terracotta shades for contrast; text on the white canvas must meet WCAG AA. — **Reversibility:** reversible
- **D-21:** Keep the existing dark-mode palette structure and the `color-scheme` switch; change only its accent-family tokens to terracotta so the theme remains coherent in dark mode. — **Reversibility:** reversible
- **D-22:** Do **not** touch the logo artwork or brand images — the user explicitly chose "extension UI theme only". `public/icon-32.png`, `public/icon-128.png`, `public/brand/logo-horizontal.png`, `panel-wave.png` and `wave.jpg` stay byte-identical. — **Reversibility:** reversible
- **D-23:** Use **#B1ADA1** (RGB 177, 173, 161) for borders and dividers — `--nb-border` in the light theme — as a soft warm gray matching the Claude.ai-like palette. Keep the dark theme's darker border token; do not use #B1ADA1 for text (insufficient contrast on white) or for surfaces. — **Reversibility:** reversible

### Claude's Discretion
- Exact casing of the package name (`webmarker-extensions` in kebab-case) and zip filename (`webmarker-extensions-<version>.zip`).
- Keep the manifest version at `0.3.0` — no version bump as part of the rebrand.
- Whether individual source comments that merely mention the old name are updated for consistency or left alone; visible strings and documentation must be updated.
- Comment wording that explains why upgrade fixtures retain "Nanobrowser".
- Exact crop/padding and transparent-vs-solid background for the W-mark icons, and which image tooling to use — but **ask before adding a dependency** (AGENTS.md); prefer tooling already present or an agent-side image edit.

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

### Colour theme
- `src/ui/index.css` — `:root` and `.dark` define all `--nb-*` RGB token triplets; light canvas/border/accent and dark accents change here
- `tailwind.config.ts` — maps every `--nb-*` token to a Tailwind colour; no change expected unless a token is added
- `src/ui/components.tsx`, `src/ui/mode-menu.tsx`, `src/ui/shortcuts.tsx` — representative consumers of the accent/border tokens; read to confirm no hardcoded blue remains

### Logo and brand assets
- `C:/Users/shesh/Downloads/logo (1).png` — user-supplied source artwork (outside the repo; do not commit the source)
- `public/icon-32.png`, `public/icon-128.png` — manifest/toolbar icons; replace contents with the W mark
- `public/brand/logo-horizontal.png` — UI horizontal logo; replace with the full WebMaker lockup
- `src/ui/icons.tsx` — `LogoMark` (`/icon-128.png`) and `Logo` (`/brand/logo-horizontal.png`) components that consume the assets
- `public/brand/panel-wave.png`, `public/brand/wave.jpg` — decorative backgrounds, explicitly unchanged (D-16)

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
- `src/ui/icons.tsx` — `LogoMark` renders `/icon-128.png` at ~20 px (so the W mark must read at small size); `Logo` renders `/brand/logo-horizontal.png` at ~28 px height (room for the full lockup)
- `wxt.config.ts` — generates `dist/manifest.json` from `package.json` and `public/_locales/`; no hand-editing of built output

### Established Patterns
- Product strings are localised in `src/ui/locales/*.json` and `public/_locales/*/messages.json` — keep all three languages in lockstep
- Generated output (`dist/**`, `.wxt/**`) is never edited; rebuild after changes
- AGENTS.md requires asking before renaming files/folders — this rebrand explicitly excludes file/folder renames, so logo work must replace asset contents at the same paths
- Asset files under `public/` are copied verbatim into `dist/` at build time

### Integration Points
- `package.json` name/repository feed the built manifest and `pnpm zip` filename
- `src/llm/providers.ts` sends `X-Title` and `HTTP-Referer` to third-party providers — renaming those values changes what providers see
- Upgrade fixtures are compared against stored data in upgrade tests — they must retain the old name
- The manifest declares `icon-32.png` and `icon-128.png` only; Chrome draws the toolbar icon from these, so the crop must be legible at 32 px

</code_context>

<specifics>
## Specific Ideas

- Fork URL to use everywhere: `https://github.com/bitcodeAShishcloud/webmarkerextension`
- About row label: `github.com/bitcodeAShishcloud/webmarkerextension`
- Package name: `webmarker-extensions`; zip: `webmarker-extensions-<version>.zip`
- Source logo: `C:/Users/shesh/Downloads/logo (1).png` — W mark + "WebMaker" + "We Build Your Web"; W mark for icons, full lockup for UI branding
- The user's words: "pura jagah name change kr ke webmarker extensions krna hai" — interpreted as everywhere visible/documented, with internal identifiers deliberately excluded per D-07.
- The user's words: "use this for logo of this extention" — the attached image is authoritative; no alternative artwork requested.
- Colour palette from the user: `#FFFFFF` background, `#C15F3C` accent ("seminila like claude.ai"), `#B1ADA1` borders/dividers. Logo artwork explicitly excluded.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within the rebrand and logo scope.

### Reviewed Todos (not folded)
None.

</deferred>

---
*Phase: 04-agent-integration*
*Context gathered: 2026-10-31; rebrand decisions added 2026-11-19; logo and colour-theme decisions added 2026-11-26*
