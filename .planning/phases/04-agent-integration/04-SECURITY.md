# Phase 4 Security Audit — Agent Integration

## SECURED

**Phase:** 4 — Agent Integration
**Threats Closed:** 37/37 (36 numbered + reserved T-04-SC)
**ASVS Level:** 1
**Block threshold:** HIGH (`config.json` → `security_block_on: high`)
**Method:** Retroactive verification against the CURRENT codebase (case B — no phase SECURITY.md exists; threat register taken from PLAN.md `<threat_model>` blocks in 04-01..04-08). ASVS L1 = mitigation PRESENT in cited file/location.

### Threat Verification

| Threat ID | Category | Severity | Disposition | Evidence (file:line / git ref) |
|-----------|----------|----------|-------------|--------------------------------|
| T-04-01 | Information Disclosure | low | mitigate | `src/llm/errors.ts:26-31` — `errorText()` returns only `message` + `responseBody`; no `apiKey` reference. No credential read anywhere in error path. |
| T-04-02 | Tampering | medium | mitigate | `src/extension/run-manager.ts:1339-1346` — explicit "No proxy exists" gate + distinct CORS/origin-allowance notice for network/status-0; `src/llm/errors.ts:62-67` `isOriginRefused()`. No proxy configuration added. |
| T-04-03 | Tampering | low | accept | Documented acceptance rationale in 04-01 threat table verified in code: `src/browser-control/core/text.ts:6-93` nonce + `defuse()` of marker shape/invisible chars/labels; `src/agent/prompt.ts:14-30` CONTRACT; boundary tests in `core/__tests__/boundary.test.ts`. |
| T-04-04 | Information Disclosure | low | mitigate | Rebrand touched docs only; `git log -p --all` scan for `sk-`/`ghp_`/`github_pat_`/`AIza` patterns = 0 hits. `SECURITY.md`, `README.md`, `AGENTS.md` carry fork links, no keys. |
| T-04-05 | Tampering | low | mitigate | `src/ui/links.ts:5-6` builds URL from a typed union (`'/' \| '/docs'`), no free-form input; `AboutSection.tsx:17` static fork URL + `rel="noreferrer"`. `git grep` for `github.com/nanobrowser`, `chromewebstore.google.com`, `discord.gg`, `x.com/nanobrowser_ai`, `deepwiki.com`, `github.com/sponsors` over product-facing files = empty. Fork URL present in README/SECURITY/config.yml/links.ts/locales/upgrade.ts. |
| T-04-06 | Destruction | low | mitigate | Legacy identifiers intact: `.gitignore:14` `.nanobrowser`; `src/store/db.ts:15` `DB_NAME='nanobrowser'`; `nb.settings` in settings.ts; `nb-panel` port; `nb-*` CSS classes in `src/ui/index.css`. No rename commits. |
| T-04-07 | Tampering | low | mitigate | `git log -- dist .wxt` = empty (generated output never committed/hand-edited across phase). Rebuilt `dist/assets/icons-*.css` reflects source tokens. |
| T-04-08 | Information Disclosure | low | accept | Documented acceptance (D-10) verified: `fixtures/upgrade/old-manifest.json:3` still `"name": "Nanobrowser"`; `old-storage.json` still legacy — upgrade tests preserved. |
| T-04-09 | Information Disclosure | low | mitigate | Same as T-04-01 — `src/llm/errors.ts:26-31` (04-02 parallel plan). |
| T-04-10 | Tampering | medium | mitigate | Same as T-04-02 — `src/extension/run-manager.ts:1339-1346`, `src/llm/errors.ts:62-67`. |
| T-04-11 | Tampering | low | accept | Same as T-04-03 — marked page-content boundary present (`src/browser-control/core/text.ts:72-93`, `src/agent/prompt.ts:14`). |
| T-04-12 | Information Disclosure | low | mitigate | No source artwork leaked: `git ls-files` has no `logo (1).png`/`.psd`/`.ai`; filesystem scan of repo = none. Only derived crops committed. |
| T-04-13 | Tampering | low | mitigate | `public/icon-32.png`, `public/icon-128.png` present; no commits touching them after 04-04 (`git log 11f4ed5..HEAD --` = empty); manifest lists only 32/128 (`wxt.config.ts:30-31`). |
| T-04-14 | Tampering | low | mitigate | `public/brand/logo-horizontal.png` present, byte-identical since 04-04 (no later commits). |
| T-04-15 | Destruction | low | mitigate | `public/brand/panel-wave.png`, `public/brand/wave.jpg` present, never opened for write; byte-identical since 04-04. |
| T-04-16 | Tampering | low | mitigate | No icon size added, no file renamed, version `0.3.0` unchanged (`package.json:3`), no dependency change; `wxt.config.ts` untouched in phase 4. |
| T-04-17 | Information Disclosure | low | mitigate | `src/ui/index.css:17-20` accent `#C15F3C`, link `#6E2E17`, fg `#0F1B2D`; built CSS carries identical tokens. No credentials in CSS. |
| T-04-18 | Tampering | low | mitigate | Old brand-blue triplets/hexes absent from UI source and built CSS (`git grep` + built-CSS grep clean); terracotta tokens present both themes. |
| T-04-19 | Destruction | low | mitigate | Five brand image files byte-identical since 04-04; only CSS references dereferenced, files retained. |
| T-04-20 | Tampering | low | mitigate | `.dark` palette 12 tokens intact (`src/ui/index.css:26-40`); both `color-scheme` declarations present (`:23`, `:39`). |
| T-04-21 | Tampering | low | mitigate | `tailwind.config.ts` untouched in phase 4 (`git log 765334a..HEAD --` = empty); built CSS still emits `rgb(var(--nb-*))` consumers. |
| T-04-22 | Tampering | low | accept | Documented acceptance verified: `src/extension/border.ts` blue glow byte-identical; `edgeBlue()` in `src/background/checks/page-border.ts` and `fixtures/pages/d-overlay.html` untouched. |
| T-04-23 | Information Disclosure | low | mitigate | `src/ui/index.css:11-20,27-36` fg `#0F1B2D`, muted `#38332D`, link `#6E2E17` on white/warm canvas; WCAG AA ratios per plan; no unsafe CSS. |
| T-04-24 | Tampering | low | mitigate | Five canvas rules exactly `background: rgb(var(--nb-canvas));` (`:78,81,87,90,96`); no blue/navy hex or wave image URL in source or built CSS. |
| T-04-25 | Destruction | low | mitigate | Brand files byte-identical to HEAD; no delete/rename commits. |
| T-04-26 | Tampering | low | mitigate | `tailwind.config.ts` byte-identical; `nb-*` names intact in built CSS. |
| T-04-27 | Tampering | low | mitigate | Accent family `#C15F3C`/`#B1ADA1` border/amber unchanged; `text-nb-accent` absent from all `.tsx` (grep = 0 hits) so accent-strong never used as text. |
| T-04-28 | Information Disclosure | low | mitigate | Warm-gray tokens `#B1ADA1` (177 173 161), muted 56 51 45, link 110 46 23 in both themes (`:11-20,27-36`); built CSS matches. |
| T-04-29 | Tampering | low | mitigate | Four accent-as-text consumers switched to `text-nb-link`; repo-wide `.tsx` grep for `text-nb-accent` = 0 hits; no handler/href changed. |
| T-04-30 | Tampering | low | mitigate | All five background rules exact; built CSS shows `.nb-wave,.dark .nb-wave,.nb-start,.dark .nb-start,.dark .nb-field{background:rgb(var(--nb-canvas))}`; no `linear-gradient`/`radial-gradient`/`140deg`/image literals. |
| T-04-31 | Destruction | low | mitigate | Five brand images byte-identical; Task 3 gate recorded in 04-07 summary; no new asset added. |
| T-04-32 | Tampering | low | mitigate | Both configs byte-identical, version 0.3.0 + `pnpm@10.34.7` unchanged, no `dist/**` hand-edit, diff limited to CSS/class files. |
| T-04-33 | Information Disclosure | low | mitigate | `--nb-muted: 56 51 45` (#38332D, 5.574:1) in both `:root` and `.dark` (`:14,30`); stale `148 166 192` absent; fg 15 27 45 intact. |
| T-04-34 | Information Disclosure | low | mitigate | Single global rule `input::placeholder, textarea::placeholder { color: rgb(var(--nb-muted)); opacity: 1; }` at `:69-73`; built CSS places it AFTER Tailwind preflight `#9ca3af` rule so token colour wins. |
| T-04-35 | Tampering | low | mitigate | No consumer file edited in 04-08; `text-nb-muted` consumers intact in built CSS (`.text-nb-muted`, `.placeholder\:text-nb-muted`). |
| T-04-36 | Tampering | low | mitigate | Diff limited to three expected files; brand images, both configs, package.json 0.3.0 byte-identical; no feature/behaviour change, no new dependency. |
| T-04-SC | Tampering | high | mitigate | `package.json`: only 04-03 commit `4074b1f` changed `name` + `repository` (deps untouched); `git diff 95ef674..HEAD -- package.json` = empty (byte-identical from 04-04 onward); `pnpm-lock.yaml` untouched in phase 4; no install scripts added. No npm/pip/cargo install anywhere in phase. |

### Accepted risks (documented + guardrails verified)

- **T-04-03 / T-04-11** — page content is untrusted data inside a nonce-sealed boundary with defused marker shapes, invisible characters and host labels; CONTRACT in system prompt reinforces it.
- **T-04-08** — legacy name intentionally retained in upgrade fixtures (`old-manifest.json`, `old-storage.json`) for upgrade tests.
- **T-04-22** — blue page glow in `src/extension/border.ts` intentionally unchanged; asserted by `edgeBlue()` check + fixture.

### Unregistered Flags

None. Only two SUMMARY.md files carry a `## Threat Flags` section (04-05, 04-06); both report "None" — no new attack surface mapped without a threat ID.

### New-issue sweep (outside declared register)

| Check | Result |
|-------|--------|
| Credentials in committed files / commit patches | PASS — 0 secret-pattern hits across full `git log -p`; `.env.example:4` key empty; test tokens only (`sk-test`, `Bearer k`, `wrong-key`) are fixtures. |
| Unsafe dynamic URLs | PASS — `websiteUrl()` takes a typed union path; About link static fork URL with `rel="noreferrer"`; no page-controlled URL interpolated into `href`/links in phase-4 changes. |
| CSP / CORS implications | PASS — no `content_security_policy` override added to `wxt.config.ts`; no new endpoint; status-0/CORS notice only surfaces existing endpoint-allowance guidance to the user. |
| Injection via page content | PASS — boundary defuse robust (nonce, marker shape, invisible chars, labels, template tokens, quote/cut helpers); no phase-4 change weakened it. |
| Secret masking | PASS — `maskSecrets`/`isSensitiveField` fail-closed path (`core/redact.ts`, `core/perception/masking.ts`, `core/controller.ts:757-758`) intact. |
| Unsafe CSS / external input to CSS | PASS — CSS is static token values; no `url()`, `@import`, `javascript:`, gradient/image literals introduced. |

**threats_open:** 0

*Auditor note: severity-filtered count because `block_on: high`; no open threats at any severity. No open blocking or non-blocking threats — every declared threat resolved CLOSED.*
