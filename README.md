# Veyrox Tweaks — website

Static website (HTML, CSS, vanilla JS — no build step, no frameworks) for **Veyrox Tweaks 1.2.0**.

```
veyrox-website/
├─ index.html              main page
├─ privacy.html            privacy policy — DRAFT TEMPLATE, fill in before publishing
├─ imprint.html            imprint / legal notice — DRAFT TEMPLATE, fill in before publishing
├─ downloads/
│  └─ VeyroxTweaks.exe     the real release file (66,533,150 bytes)
├─ assets/
│  ├─ css/styles.css
│  ├─ js/config.js         ← release facts + community links (edit this)
│  ├─ js/tweaks.js         ← tweak catalog extracted from the EXE
│  ├─ js/main.js           interactions and animations
│  └─ img/                 app icon (taken from the EXE) in 32/128/256 px
├─ favicon.ico             the app's own icon file
├─ site.webmanifest
└─ robots.txt
```

## Where the facts come from

Everything on the page was read from `VeyroxTweaks.exe` itself, without running it:

| Fact | Source |
| --- | --- |
| Version 1.2.0 (file version 1.2.0.0), © 2026 Veyrox | Windows version resource |
| 63.4 MB / 66,533,150 bytes | file size |
| SHA-256 `C8FB20BF…BCC9041E` | `Get-FileHash` |
| Windows 10 & 11, 64-bit | app manifest `supportedOS` + x64 PE header |
| Administrator rights at launch | app manifest `requireAdministrator` |
| Not code-signed | `Get-AuthenticodeSignature` → NotSigned |
| .NET 8, self-contained single file (WPF) | bundle manifest / runtimeconfig |
| 20 tweaks, categories, impact, restart, Turbo Boost membership | `VeyroxTweaks.Tweaks.Catalog` classes |
| Tweak texts, page texts, "What's new" list | the app's own English UI strings |
| 11 supported games, ping targets, Game Booster rules | app code |

The old website (v2.1.0) listed features that are **not** in this EXE (temp-file cleanup, autostart manager, system report export, DNS check, GPU temperature/VRAM readout). They were left out on purpose. If a later build adds them, add them back.

## Run it locally

Any static server works. From this folder:

```bash
python -m http.server 8080
```

Then open http://localhost:8080. (Opening `index.html` directly from disk also works, but the download button behaves best over http.)

## Hosting

**Current setup:** GitHub Pages at https://stralsundinbox32-dotcom.github.io/get.veyroxtweaks/ (repository `stralsundinbox32-dotcom/get.veyroxtweaks`). The download buttons point to the GitHub Release asset
`https://github.com/stralsundinbox32-dotcom/get.veyroxtweaks/releases/download/v1.2.0/VeyroxTweaks.exe`,
so upload `VeyroxTweaks.exe` to a release with the tag `v1.2.0`. The `downloads/` folder is not needed on GitHub.

On other hosts, upload the whole folder and point `release.filePath` (and the `href`s in `index.html`) back to `downloads/VeyroxTweaks.exe`.

The EXE is 63.4 MB. Check your host's per-file limit before deploying:

- GitHub repositories reject files over 100 MB and warn above 50 MB — the EXE fits, but a GitHub **Release** asset is the cleaner place for it.
- Some static hosts cap single files much lower (Cloudflare Pages: 25 MiB). The EXE will not deploy there.

If your host can't serve the file, upload the EXE somewhere that can (for example as a GitHub Release asset) and set `release.filePath` in `assets/js/config.js` to that full URL. Also replace `downloads/VeyroxTweaks.exe` in the `href` attributes of `index.html` (used when JavaScript is off). Test one download afterwards and compare the checksum.

## Shipping a new version

1. Replace `downloads/VeyroxTweaks.exe`.
2. Get the new facts in PowerShell:
   ```powershell
   (Get-Item .\downloads\VeyroxTweaks.exe).VersionInfo.ProductVersion
   (Get-Item .\downloads\VeyroxTweaks.exe).Length
   Get-FileHash .\downloads\VeyroxTweaks.exe -Algorithm SHA256
   ```
3. Update `release` in `assets/js/config.js`.
4. Search `index.html` for `1.2.0`, `63.4 MB`, `66,533,150` and the old checksum and update the static fallbacks (shown to search engines and visitors without JavaScript). Update the "What's new" list.

## Community links

Fill in `links` in `assets/js/config.js`. Empty links stay hidden; the Discord button shows "Discord invite coming soon" until `links.discord` is set. No placeholder URL is ever rendered as a working link.

## Before going live

- Complete `privacy.html` and `imprint.html` (all highlighted fields), then remove their `noindex` meta tag.
- Fonts load from Google Fonts. For GDPR-sensitive audiences, self-host Archivo, Geist and Geist Mono (download the woff2 files, add `@font-face` rules, remove the Google Fonts `<link>` tags) and update the privacy policy.
- Once you have a domain, make `og:image` and the JSON-LD `downloadUrl` absolute URLs and add `<link rel="canonical">`.
- The app screens on the page are a hand-built rebuild of the interface (labels from the app, example numbers). If you'd rather show real screenshots, they slot into the hero and tour sections.

## Accessibility & performance notes

- Respects `prefers-reduced-motion`: no loader, no pinned scroll scenes, no auto-advancing tour, no pointer effects.
- All continuous effects (particles, aurora, rotating rings) pause when their section is off-screen or the tab is hidden.
- Animations use `transform`/`opacity`; scroll work is batched into one `requestAnimationFrame`.
- Keyboard: skip link, visible focus, arrow-key tabs in the tour, `/` focuses the tweak search, `Esc` closes the mobile menu.
