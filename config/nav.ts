import { type LucideIcon } from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Optional grouping header this item belongs under. */
  section?: string;
};

/**
 * Sidebar navigation. Empty by design — add your own items as you build pages.
 * Each entry: create app/(app)/<route>/page.tsx and add it here.
 */
export const navItems: NavItem[] = [];
