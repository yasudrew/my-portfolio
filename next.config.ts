import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    /**
     * Pin the workspace root to this directory.
     *
     * Without it Turbopack walks up looking for a lockfile and finds one in the
     * home directory, outside the repo — then warns and ignores it. Stating the
     * root keeps local and CI builds resolving from the same place.
     */
    root: path.resolve(import.meta.dirname),
  },
};

export default nextConfig;
