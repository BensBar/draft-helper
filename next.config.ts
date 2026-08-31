import type { NextConfig } from "next";

/**
 * GitHub Pages project site is https://bensbar.github.io/draft-helper/
 *
 * `basePath` / `assetPrefix` are applied only when GITHUB_PAGES=true (CI Pages
 * job). Hardcoding them would move `next dev` to localhost:3000/draft-helper.
 *
 * Do not use actions/configure-pages `static_site_generator: next` — it cannot
 * inject into next.config.ts and would fight this file.
 */
const pagesBase = process.env.GITHUB_PAGES === "true" ? "/draft-helper" : "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  // Pages serves directory index.html files; trailing slash keeps client routes
  // aligned with those URLs (and with /draft-helper/ on the project site).
  trailingSlash: true,
  images: { unoptimized: true },
  ...(pagesBase ? { basePath: pagesBase, assetPrefix: pagesBase } : {}),
};

export default nextConfig;
