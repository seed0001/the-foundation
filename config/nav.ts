import {
  MessageSquare,
  Brain,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Optional grouping header this item belongs under. */
  section?: string;
};

/**
 * Sidebar navigation. Add an item per page you build.
 * Each entry: create app/(app)/<route>/page.tsx and add it here.
 */
export const navItems: NavItem[] = [
  {
    label: "AI Chat",
    href: "/ai",
    icon: MessageSquare,
  },
  {
    label: "Memory",
    href: "/memory",
    icon: Brain,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];
