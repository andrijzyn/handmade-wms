"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  Package,
  Users,
  Sun,
  Moon,
  LogOut,
  Shield,
  FolderTree,
  Logs,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import Dashboard from "@/components/pages/dashboard";
import Products from "@/components/pages/products";
import UsersPage from "@/components/pages/users";
import LocationsPage from "@/components/pages/locations";
import LogsPage from "@/components/pages/logs";
import { Permission, PERMISSIONS } from "@/lib/permissions";
import type { SafeUser } from "@/lib/userTypes";

type Page = "dashboard" | "products" | "users" | "locations" | "logs";

interface NavItem {
  page: Page;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SidebarContentProps {
  navItems: NavItem[];
  currentPage: Page;
  onNavigate: (page: Page) => void;
  user: SafeUser | null;
  dark: boolean;
  onToggleDark: () => void;
  onLogout: () => void;
}

function SidebarContent({
  navItems,
  currentPage,
  onNavigate,
  user,
  dark,
  onToggleDark,
  onLogout,
}: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col bg-sidebar">
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-sidebar-border px-5">
        <div className="flex items-center gap-2.5">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            aria-label="StockPulse logo"
          >
            <rect
              x="2"
              y="6"
              width="6"
              height="12"
              rx="1.5"
              fill="currentColor"
              className="text-primary"
            />
            <rect
              x="9"
              y="3"
              width="6"
              height="18"
              rx="1.5"
              fill="currentColor"
              className="text-primary/70"
            />
            <rect
              x="16"
              y="9"
              width="6"
              height="9"
              rx="1.5"
              fill="currentColor"
              className="text-primary/40"
            />
          </svg>
          <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
            StockPulse
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-3">
        {navItems.map(({ page, label, icon: Icon }) => {
          const isActive = currentPage === page;

          return (
            <button
              key={page}
              onClick={() => onNavigate(page)}
              className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
              data-testid={`link-${label.toLowerCase()}`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-sidebar-border">
        {user && (
          <div className="space-y-1.5 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-primary/10">
                <Shield className="h-4 w-4 text-primary" />
              </div>

              <div className="min-w-0 flex-1">
                <p
                  className="truncate text-xs font-medium text-sidebar-foreground"
                  data-testid="text-current-user"
                >
                  {user.callsign ? user.callsign : user.full_name}
                </p>
                <p className="truncate text-[10px] text-muted-foreground">
                  {user.rank}
                </p>
              </div>
            </div>

            <Badge
              variant="outline"
              className="h-5 px-1.5 py-0 text-[10px] font-normal"
            >
              {user.clearance_level}
            </Badge>
          </div>
        )}

        <div className="space-y-1.5 px-3 pb-5">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-full justify-start gap-2 text-xs text-muted-foreground"
            onClick={onToggleDark}
            data-testid="button-theme-toggle"
          >
            {dark ? (
              <Sun className="h-3.5 w-3.5" />
            ) : (
              <Moon className="h-3.5 w-3.5" />
            )}
            {dark ? "Light theme" : "Dark theme"}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-full justify-start gap-2 text-xs text-destructive/80 hover:bg-destructive/10 hover:text-destructive"
            onClick={onLogout}
            data-testid="button-logout"
          >
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AppShell() {
  const { user, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dark, setDark] = useState(
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : false,
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const hasPermission = (permission: Permission): boolean =>
    user?.permissions?.includes(permission) ?? false;

  const navItems = [
    { page: "dashboard" as Page, label: "Dashboard", icon: LayoutDashboard },

    ...(hasPermission(PERMISSIONS.READ_PRODUCTS)
      ? [{ page: "products" as Page, label: "Products", icon: Package }]
      : []),

    ...(hasPermission(PERMISSIONS.READ_LOCATIONS)
      ? [{ page: "locations" as Page, label: "Locations", icon: FolderTree }]
      : []),

    ...(hasPermission(PERMISSIONS.READ_USERS)
      ? [{ page: "users" as Page, label: "Users", icon: Users }]
      : []),

    ...(hasPermission(PERMISSIONS.READ_LOGS)
      ? [{ page: "logs" as Page, label: "Audit Logs", icon: Logs }]
      : []),
  ];

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
    setSidebarOpen(false);
  };

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard onNavigateAction={setCurrentPage} />;
      case "products":
        return hasPermission(PERMISSIONS.READ_PRODUCTS) ? (
          <Products />
        ) : (
          <Dashboard onNavigateAction={setCurrentPage} />
        );
      case "locations":
        return hasPermission(PERMISSIONS.READ_LOCATIONS) ? (
          <LocationsPage />
        ) : (
          <Dashboard onNavigateAction={setCurrentPage} />
        );
      case "users":
        return hasPermission(PERMISSIONS.READ_USERS) ? (
          <UsersPage />
        ) : (
          <Dashboard onNavigateAction={setCurrentPage} />
        );
      case "logs":
        return hasPermission(PERMISSIONS.READ_LOGS) ? (
          <LogsPage />
        ) : (
          <Dashboard onNavigateAction={setCurrentPage} />
        );
      default:
        return <Dashboard onNavigateAction={setCurrentPage} />;
    }
  };

  const sidebarProps: SidebarContentProps = {
    navItems,
    currentPage,
    onNavigate: handleNavigate,
    user,
    dark,
    onToggleDark: () => setDark(!dark),
    onLogout: () => {
      setSidebarOpen(false);
      logout();
    },
  };

  return (
    <div
      className="flex h-dvh overflow-hidden bg-background"
      data-testid="app-layout"
    >
      {/* Desktop sidebar */}
      <aside
        className="hidden w-[220px] shrink-0 overflow-y-auto border-r border-sidebar-border bg-sidebar md:flex md:flex-col"
        data-testid="sidebar"
      >
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-[280px] p-0 sm:w-[320px]">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation menu</SheetTitle>
          </SheetHeader>
          <SidebarContent {...sidebarProps} />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur md:hidden">
          <div className="flex items-center gap-2.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="flex items-center gap-2">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <rect
                  x="2"
                  y="6"
                  width="6"
                  height="12"
                  rx="1.5"
                  fill="currentColor"
                  className="text-primary"
                />
                <rect
                  x="9"
                  y="3"
                  width="6"
                  height="18"
                  rx="1.5"
                  fill="currentColor"
                  className="text-primary/70"
                />
                <rect
                  x="16"
                  y="9"
                  width="6"
                  height="9"
                  rx="1.5"
                  fill="currentColor"
                  className="text-primary/40"
                />
              </svg>
              <span className="text-sm font-semibold tracking-tight">
                StockPulse
              </span>
            </div>
          </div>

          <Badge variant="outline" className="max-w-[120px] truncate text-[10px]">
            {user?.clearance_level ?? "User"}
          </Badge>
        </header>

        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1100px] px-4 py-4 sm:px-6 sm:py-6">
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
}
