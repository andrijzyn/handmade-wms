"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { LayoutDashboard, Package, Users, Sun, Moon, LogOut, Shield, FolderTree } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Dashboard from "@/components/pages/dashboard";
import Products from "@/components/pages/products";
import UsersPage from "@/components/pages/users";
import Locations from "@/components/pages/locations";
import {Permission, PERMISSIONS} from "@/lib/permissions";

type Page = "dashboard" | "products" | "users" | "locations";

export default function AppShell() {
  const { user, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [dark, setDark] = useState(
      typeof window !== "undefined"
          ? window.matchMedia("(prefers-color-scheme: dark)").matches
          : false
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
  ];

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard onNavigateAction={setCurrentPage} />;
      case "products":
        return hasPermission(PERMISSIONS.READ_PRODUCTS)
            ? <Products />
            : <Dashboard onNavigateAction={setCurrentPage} />;
      case "locations":
        return hasPermission(PERMISSIONS.READ_LOCATIONS)
            ? <Locations />
            : <Dashboard onNavigateAction={setCurrentPage} />;
      case "users":
        return hasPermission(PERMISSIONS.READ_USERS)
            ? <UsersPage />
            : <Dashboard onNavigateAction={setCurrentPage} />;
      default:
        return <Dashboard onNavigateAction={setCurrentPage} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden" data-testid="app-layout">
      {/* Sidebar */}
      <aside
        className="w-[220px] flex-shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col"
        data-testid="sidebar"
      >
        {/* Logo */}
        <div className="h-14 flex items-center px-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-label="StockPulse logo">
              <rect x="2" y="6" width="6" height="12" rx="1.5" fill="currentColor" className="text-primary" />
              <rect x="9" y="3" width="6" height="18" rx="1.5" fill="currentColor" className="text-primary/70" />
              <rect x="16" y="9" width="6" height="9" rx="1.5" fill="currentColor" className="text-primary/40" />
            </svg>
            <span className="font-semibold text-sm tracking-tight text-sidebar-foreground">
              StockPulse
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-3 space-y-1">
          {navItems.map(({ page, label, icon: Icon }) => {
            const isActive = currentPage === page;
            return (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-foreground"
                    : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                }`}
                data-testid={`link-${label.toLowerCase()}`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-sidebar-border">
          {user && (
            <div className="px-4 py-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Shield className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className="text-xs font-medium truncate text-sidebar-foreground"
                    data-testid="text-current-user"
                  >
                    {user.callsign ? user.callsign : user.full_name}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">{user.rank}</p>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal">
                {user.clearanceLevel}
              </Badge>
            </div>
          )}

          <div className="px-3 pb-5 space-y-1.5">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-xs text-muted-foreground h-8"
              onClick={() => setDark(!dark)}
              data-testid="button-theme-toggle"
            >
              {dark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              {dark ? "Light theme" : "Dark theme"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-xs text-destructive/80 h-9 hover:text-destructive hover:bg-destructive/10"
              onClick={() => logout()}
              data-testid="button-logout"
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1100px] mx-auto px-6 py-6">{renderPage()}</div>
      </main>
    </div>
  );
}