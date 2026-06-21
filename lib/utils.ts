/**
 * Tiny classname combiner. Filters falsy values and joins with a space.
 * Keeps the project dependency-free (no clsx/tailwind-merge) while staying
 * ergonomic for conditional classes.
 */
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Remove stray HTML tags (e.g. a leaked </blockquote>) that some local models
 * emit, while preserving fenced ``` code blocks so real code is untouched.
 */
export function stripHtml(text: string): string {
  const segments = text.split(/(```[\s\S]*?```)/g);
  return segments
    .map((seg, i) =>
      i % 2 === 1 ? seg : seg.replace(/<\/?[a-z][a-z0-9]*(?:\s[^>]*)?\/?>/gi, ""),
    )
    .join("");
}
