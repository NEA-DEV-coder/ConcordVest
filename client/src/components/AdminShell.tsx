/* CONCORDVEST / Admin Shell: functional staff chrome uses the same navy, white, and orange system with denser spacing and a dashboard-first hierarchy. */

import { useState } from "react";
import {
  BarChart3,
  Building2,
  FileText,
  FolderKanban,
  Image,
  Loader2,
  LogOut,
  Menu,
  Settings,
  Shield,
  Sparkles,
  Users,
  X,
  LineChart,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { UserRole } from "@/lib/supabase";

const navItems = [
  { label: "Overview", href: "/admin", icon: BarChart3 },
  { label: "Analytics", href: "/admin/analytics", icon: LineChart },
  { label: "Properties", href: "/admin/properties", icon: Building2 },
  { label: "Projects", href: "/admin/projects", icon: FolderKanban },
  { label: "Services", href: "/admin/services", icon: Sparkles },
  { label: "Leads", href: "/admin/leads", icon: Users },
  { label: "Content", href: "/admin/content", icon: FileText },
  { label: "Media", href: "/admin/media", icon: Image },
  { label: "Staff", href: "/admin/staff", icon: Shield },
];

interface AdminShellProps {
  path: string;
  onNavigate: (path: string) => void;
  onSignOut: () => void;
  children: React.ReactNode;
  userName?: string | null;
  userRole?: UserRole | null;
  unreadCount?: number;
}

export function AdminShell({
  path,
  onNavigate,
  onSignOut,
  children,
  userName,
  userRole,
  unreadCount,
}: AdminShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await onSignOut();
      onNavigate("/admin");
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navigate = (href: string) => {
    setMobileOpen(false);
    onNavigate(href);
  };

  // Get initials from user name
  const initials = userName
    ? userName
        .split(" ")
        .map(part => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "CV";

  // Check if using real Supabase or demo mode
  const isConfigured = isSupabaseConfigured();

  return (
    <div className="min-h-screen bg-[#f4f1ea] text-[#17212f]">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-[#012770]/12 bg-[#012770] text-white transition-transform lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-white/12 px-6 py-5">
            <Logo light />
            <button
              type="button"
              aria-label="Close admin menu"
              onClick={() => setMobileOpen(false)}
              className="lg:hidden"
            >
              <X size={18} />
            </button>
          </div>

          <div className="px-5 py-5">
            <div
              className={`border ${isConfigured ? "border-green-500/50 bg-green-500/10" : "border-[#ED7D01]/50 bg-[#ED7D01]/10"} p-3`}
            >
              <div
                className={`flex items-center gap-2 text-[0.58rem] font-extrabold uppercase tracking-[0.14em] ${isConfigured ? "text-green-400" : "text-[#ED7D01]"}`}
              >
                <Shield size={13} />{" "}
                {isConfigured ? "Connected" : "Prototype workspace"}
              </div>
              <p className="mt-2 text-[0.68rem] leading-[1.5] text-white/60">
                {isConfigured
                  ? "Supabase backend connected. Real data persistence enabled."
                  : "Local demo data only. Configure Supabase for production."}
              </p>
            </div>
          </div>

          <nav className="flex-1 space-y-1 px-3">
            {navItems.map(item => {
              const Icon = item.icon;
              const active =
                item.href === "/admin"
                  ? path === "/admin"
                  : path.startsWith(item.href);
              return (
                <button
                  type="button"
                  key={item.href}
                  onClick={() => navigate(item.href)}
                  className={`flex w-full items-center gap-3 px-3 py-3 text-left text-[0.7rem] font-bold transition-colors ${active ? "bg-[#ED7D01] text-[#012770]" : "text-white/65 hover:bg-white/8 hover:text-white"}`}
                >
                  <Icon size={16} />
                  <span className="flex-1">{item.label}</span>
                  {item.label === "Leads" &&
                    unreadCount !== undefined &&
                    unreadCount > 0 && (
                      <span
                        className={`grid h-4 min-w-4 place-items-center px-1.5 text-[0.52rem] font-extrabold rounded-full ${active ? "bg-[#012770] text-white" : "bg-[#ED7D01] text-[#012770]"}`}
                      >
                        {unreadCount}
                      </span>
                    )}
                </button>
              );
            })}
          </nav>

          <div className="border-t border-white/12 p-4">
            <button
              type="button"
              disabled={isLoggingOut}
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-3 py-3 text-[0.68rem] font-bold text-white/65 hover:text-white disabled:opacity-50"
            >
              {isLoggingOut ? (
                <Loader2 size={16} className="animate-spin text-[#ED7D01]" />
              ) : (
                <LogOut size={16} />
              )}
              <span>{isLoggingOut ? "Signing out..." : "Sign out"}</span>
            </button>
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <button
          aria-label="Close navigation overlay"
          type="button"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-[#012770]/55 lg:hidden"
        />
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#012770]/10 bg-white/95 px-4 backdrop-blur-md sm:px-7">
          <button
            type="button"
            aria-label="Open admin menu"
            onClick={() => setMobileOpen(true)}
            className="grid h-9 w-9 place-items-center border border-[#012770]/15 text-[#012770] lg:hidden"
          >
            <Menu size={18} />
          </button>

          <div className="hidden items-center gap-3 text-[0.65rem] font-bold text-[#637085] sm:flex">
            <span className="h-2 w-2 bg-[#ED7D01]" />
            Admin /{" "}
            {navItems.find(
              item =>
                item.href ===
                (path === "/admin"
                  ? "/admin"
                  : navItems.find(candidate => path.startsWith(candidate.href))
                      ?.href)
            )?.label || "Workspace"}
          </div>

          <div className="ml-auto flex items-center gap-4">
            <a
              href="/"
              className="text-[0.62rem] font-extrabold uppercase tracking-[0.12em] text-[#637085] hover:text-[#012770]"
            >
              View public site ↗
            </a>
            <div className="flex items-center gap-2 border-l border-[#012770]/12 pl-4">
              <span className="grid h-8 w-8 place-items-center bg-[#012770] text-[0.65rem] font-extrabold text-white">
                {initials}
              </span>
              <span className="hidden text-[0.65rem] font-bold text-[#012770] sm:block">
                {userName || "Admin"}
              </span>
              {userRole && (
                <span className="hidden rounded bg-[#ED7D01]/10 px-1.5 py-0.5 text-[0.55rem] font-extrabold uppercase tracking-wider text-[#ED7D01] sm:inline">
                  {userRole}
                </span>
              )}
            </div>
            <button
              type="button"
              disabled={isLoggingOut}
              onClick={handleLogout}
              className="flex items-center gap-1.5 border border-[#012770]/15 bg-white px-2.5 py-1.5 text-[0.62rem] font-extrabold uppercase tracking-[0.12em] text-[#012770] hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors disabled:opacity-50"
            >
              {isLoggingOut ? (
                <Loader2 size={13} className="animate-spin text-[#ED7D01]" />
              ) : (
                <LogOut size={13} />
              )}
              <span>{isLoggingOut ? "Signing out..." : "Logout"}</span>
            </button>
          </div>
        </header>

        <main className="p-4 sm:p-7 lg:p-9">{children}</main>
      </div>
    </div>
  );
}
