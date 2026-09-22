import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
