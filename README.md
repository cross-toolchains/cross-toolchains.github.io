<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="src/assets/wordmark-dark.svg" />
    <source media="(prefers-color-scheme: light)" srcset="src/assets/wordmark-light.svg" />
    <img src="src/assets/wordmark-dark.svg" alt="XROSS" height="52" />
  </picture>

  <p><strong>Build for anywhere, from anywhere.</strong></p>

  <p>Official documentation website for <strong>Xross</strong> (<a href="https://github.com/cross-toolchains"><code>cross-toolchains</code></a>) — live at <a href="https://cross-toolchains.github.io"><strong>cross-toolchains.github.io</strong></a>.</p>

  <p>
    <a href="https://github.com/cross-toolchains/cross-toolchains.github.io/actions/workflows/deploy.yml"><img src="https://github.com/cross-toolchains/cross-toolchains.github.io/actions/workflows/deploy.yml/badge.svg" alt="Deploy to GitHub Pages" /></a>
    <a href="LICENSE-MIT"><img src="https://img.shields.io/badge/license-MIT%20OR%20Apache--2.0-blue.svg" alt="License: MIT OR Apache-2.0" /></a>
  </p>
</div>

---

## Highlights

- **Built with Astro 7 + Starlight**: Fast static output powered by Vite & Rolldown with built-in Pagefind search.
- **6 Languages**: Full translations for English (`en`), 简体中文 (`zh-cn`), 日本語 (`ja`), Français (`fr`), Español (`es`), and Deutsch (`de`).
- **Automated Releases Hub**: `scripts/sync-releases.mjs` syncs live crate versions from `crates.io` and binary releases from GitHub Releases into per-crate release log pages.
- **AI-Ready Docs**: Auto-generates `/llms.txt`, `/llms-small.txt`, and `/llms-full.txt` via `starlight-llms-txt`, plus build-time internal link validation.

## Local Development

```sh
pnpm install
pnpm sync:releases   # optional: pull latest crates.io & GitHub Releases
pnpm dev             # start dev server at http://localhost:4321
pnpm build           # production build + Pagefind index + link validation
```

## Ecosystem Repositories

| Repository | Role |
|---|---|
| [`cross-toolchains/xsysroot`](https://github.com/cross-toolchains/xsysroot) | Zero-Docker target sysroot & SDK manager (`xlinux`, `xmac`, `xios`, `xdroid`, `xohos`) |
| [`cross-toolchains/xcompiler`](https://github.com/cross-toolchains/xcompiler) | Portable host compiler manager (`xllvm`, `xgcc`) |
| [`cross-toolchains/llvm-slim`](https://github.com/cross-toolchains/llvm-slim) | Minimal portable multi-target LLVM builds for all 6 host platforms |
| [`cross-toolchains/artwork`](https://github.com/cross-toolchains/artwork) | Official Pastel Macaron logos, `XROSS` wordmarks, favicons & avatars |

## License

Dual-licensed under [MIT](LICENSE-MIT) or [Apache-2.0](LICENSE-APACHE), at your option.
