"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, TrendingUp, Settings, Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Today", icon: LayoutDashboard },
  { href: "/log", label: "Log", icon: BookOpen },
  { href: "/insights", label: "Insights", icon: TrendingUp },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - desktop */}
      <aside className="hidden md:flex w-56 flex-col border-r bg-background">
        <div className="flex h-16 items-center gap-2.5 px-4 border-b">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
            <Dumbbell className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-sm">Cut Tracker</span>
        </div>
        <nav className="flex flex-col gap-1 p-3 flex-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t">
          <p className="text-xs text-muted-foreground px-3">Cut Tracker v1.0</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
        </div>
      </main>

      {/* Bottom nav - mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background flex z-50">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium transition-colors",
                active ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "text-foreground")} />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
