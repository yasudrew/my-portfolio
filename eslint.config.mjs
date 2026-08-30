import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Scenes from earlier directions, kept for reference and not wired up.
    "src/gl/archive/**",
  ]),

  {
    // The WebGL layer works against three.js objects, which are mutable by
    // design: a uniform is *meant* to be written every frame, and copying it
    // instead would allocate per frame and defeat the point. React Compiler's
    // immutability model assumes plain React values, so it does not apply here.
    // Everything in this directory is decoration that renders outside React's
    // commit anyway — no React state is derived from it.
    files: ["src/gl/**/*.{ts,tsx}"],
    rules: {
      "react-hooks/immutability": "off",
      "react-hooks/refs": "off",
    },
  },
]);

export default eslintConfig;
