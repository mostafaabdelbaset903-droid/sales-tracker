"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/app/actions/auth";
import {
  LayoutDashboard,
  BarChart3,
  Plus,
  History,
  Package,
  Settings,
  Upload,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { useSound } from "@/lib/use-sound";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/product-performance", label: "Performance", icon: BarChart3 },
  { href: "/add-sale", label: "Add Sale", icon: Plus },
  { href: "/history", label: "History", icon: History },
  { href: "/models", label: "Models", icon: Package },
  { href: "/bulk-import", label: "Import", icon: Upload },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Navigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { play } = useSound();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-sm transition-transform duration-300 hover:scale-105 hover:rotate-3">
              <span className="text-sm font-black text-primary-foreground">
                ST
              </span>
            </div>

            <div className="hidden sm:block">
              <span className="block text-sm font-bold leading-none text-foreground">
                Sales Tracker
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">
                Commission Dashboard
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onMouseEnter={() => play("hover")}
                  onClick={() => play("click")}
                  className={cn(
                    "relative flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors duration-200",
                    isActive
                      ? "text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  {isActive && (
                    <span className="absolute inset-0 -z-10 rounded-xl bg-primary shadow-sm animate-scale-in" />
                  )}
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Logout */}
          <form action={logoutAction} className="hidden md:block">
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:hover:border-red-900 dark:hover:bg-red-950 dark:hover:text-red-300"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </form>

          {/* Mobile Menu Button */}
          <button
            className="rounded-xl p-2 text-foreground hover:bg-accent md:hidden"
            onClick={() => {
              setMobileMenuOpen(!mobileMenuOpen);
              play("click");
            }}
            aria-label="Toggle navigation menu"
          >
            <span className="relative block h-5 w-5">
              <Menu
                className={cn(
                  "absolute inset-0 h-5 w-5 transition-all duration-200",
                  mobileMenuOpen
                    ? "rotate-90 opacity-0 scale-75"
                    : "rotate-0 opacity-100 scale-100"
                )}
              />
              <X
                className={cn(
                  "absolute inset-0 h-5 w-5 transition-all duration-200",
                  mobileMenuOpen
                    ? "rotate-0 opacity-100 scale-100"
                    : "-rotate-90 opacity-0 scale-75"
                )}
              />
            </span>
          </button>
        </div>

        {/* Mobile Navigation */}
        <div
          className={cn(
            "grid md:hidden transition-all duration-300 ease-out",
            mobileMenuOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          )}
        >
          <div className="overflow-hidden">
            <nav className="border-t border-border py-4">
              <div className="flex flex-col gap-1">
                {navItems.map((item, idx) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => {
                        setMobileMenuOpen(false);
                        play("click");
                      }}
                      style={{ transitionDelay: mobileMenuOpen ? `${idx * 30}ms` : "0ms" }}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  );
                })}

                <form action={logoutAction} className="pt-2">
                  <button
                    type="submit"
                    className="flex w-full items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-left text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950"
                  >
                    <LogOut className="h-5 w-5" />
                    Logout
                  </button>
                </form>
              </div>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
