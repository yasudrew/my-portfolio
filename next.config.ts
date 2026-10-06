import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Cloudflare Workers の静的アセットとして配信するため、全ページを out/ に書き出す。
   * サーバー側の処理（Route Handler や cookie など）は使っていないので静的書き出しで足りる。
   */
  output: "export",
  /**
   * 静的書き出しでは Next.js の画像最適化サーバーが使えない。
   * 実績の画像はもともと WebP で 1 枚 100KB 前後なので、そのまま配信する。
   */
  images: { unoptimized: true },
  turbopack: {
    /**
     * Pin the workspace root to the directory the build runs in.
     *
     * Without it Turbopack walks up looking for a lockfile and can find one
     * outside the repo, then warns and ignores it. `process.cwd()` is used
     * rather than `import.meta.dirname` because this file is loaded as CJS in
     * some environments — the package has no `"type": "module"` — and
     * `import.meta` is unavailable there.
     */
    root: process.cwd(),
  },
};

export default nextConfig;
