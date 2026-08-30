/**
 * Tagged template for GLSL sources.
 *
 * Purely an identity function at runtime — its job is to give editors and
 * formatters a marker so shader bodies get syntax highlighting while still
 * living in TypeScript, where they can be composed, checked at the call site
 * and bundled without a loader.
 */
export function glsl(
  strings: TemplateStringsArray,
  ...values: readonly (string | number)[]
): string {
  return strings.reduce<string>(
    (out, chunk, i) => out + chunk + (i < values.length ? String(values[i]) : ""),
    "",
  );
}
