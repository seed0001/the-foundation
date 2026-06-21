"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "./sidebar";
import { TopBar } from "./topbar";
import { useSidebar } from "./sidebar-context";

/**
 * The persistent application shell: fixed Sidebar + TopBar, with the main
 * content area shifting to make room for the sidebar on desktop. Only the
 * `children` (the page) change between routes.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { collapsed } = useSidebar();

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div
        className={cn(
          "flex min-h-screen flex-col transition-[margin] duration-200 ease-in-out",
          collapsed ? "md:ml-[68px]" : "md:ml-64",
        )}
      >
        <TopBar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
