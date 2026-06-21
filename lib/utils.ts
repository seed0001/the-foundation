/**
 * Tiny classname combiner. Filters falsy values and joins with a space.
 * Keeps the project dependency-free (no clsx/tailwind-merge) while staying
 * ergonomic for conditional classes.
 */
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
