"use client";

import { type ReactNode, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { Logo } from "@/components/logo";
import { GradientBackground } from "@/components/gradient-background";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";

export function WorkspaceShell({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isMobile) {
    return (
      <div className="flex flex-col h-screen overflow-hidden relative">
        <GradientBackground />
        <div className="flex items-center px-3 py-2 shrink-0">
          <div
            onClickCapture={(e) => { e.stopPropagation(); e.preventDefault(); setSidebarOpen(true); }}
            className="cursor-pointer"
          >
            <Logo size="sm" iconOnly />
          </div>
        </div>
        <div className="flex-1 min-h-0 px-2 pb-2">
          <main className="h-full rounded-xl bg-card/80 backdrop-blur-xl shadow-lg ring-1 ring-border/40 overflow-hidden flex flex-col">
            {children}
          </main>
        </div>
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" showCloseButton={false} className="w-14 p-0">
            <AppSidebar onNavigate={() => setSidebarOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden relative">
      <GradientBackground />
      <AppSidebar />
      <div className="flex-1 min-w-0 p-2 pl-0">
        <main className="h-full rounded-xl bg-card/80 backdrop-blur-xl shadow-lg ring-1 ring-border/40 overflow-hidden flex flex-col">
          {children}
        </main>
      </div>
    </div>
  );
}
