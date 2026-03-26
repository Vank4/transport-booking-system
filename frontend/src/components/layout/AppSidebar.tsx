"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { CircleHelp, Gift, Home, LogIn, LogOut, Search, Ticket, User, X } from "lucide-react";
import { buildLoginRedirect, clearAuthSession, isAuthenticated } from "@/lib/auth";

type AppSidebarProps = {
  open: boolean;
  onClose: () => void;
  searchHref?: string;
};

type NavItem = {
  href: string;
  label: string;
  icon: typeof Home;
  requiresAuth?: boolean;
};

const publicNavItems: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/voucher", label: "Voucher", icon: Gift },
  { href: "/help", label: "Help", icon: CircleHelp },
];

const privateNavItems: NavItem[] = [
  { href: "/user/profile", label: "Profile", icon: User, requiresAuth: true },
  { href: "/user/bookings", label: "My booking", icon: Ticket, requiresAuth: true },
];

export default function AppSidebar({ open, onClose, searchHref }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const loggedIn = isAuthenticated();
  const navItems = [...publicNavItems, ...privateNavItems];

  const handleProtectedNavigation = (href: string, requiresAuth?: boolean) => {
    onClose();

    if (requiresAuth && !loggedIn) {
      router.push(buildLoginRedirect(href));
      return;
    }

    router.push(href);
  };

  const handleLogout = () => {
    clearAuthSession();
    onClose();
    router.push("/auth/login");
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.aside
            initial={{ x: -420, opacity: 0.95 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -420, opacity: 0.95 }}
            transition={{ type: "spring", stiffness: 220, damping: 28 }}
            className="fixed left-0 top-0 z-50 flex h-screen w-[82vw] max-w-[300px] flex-col overflow-hidden bg-white shadow-2xl"
          >
            <div className="bg-gradient-to-r from-white via-sky-50 to-sky-400 px-4 py-3">
              <div className="mb-2.5 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[1.15rem] font-semibold leading-none tracking-tight text-slate-950">
                    Transport Booking
                  </p>
                  <p className="mt-1 text-[0.74rem] leading-snug text-slate-700">
                    Quick navigation across the system
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/80 text-slate-700 shadow-sm transition hover:bg-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="rounded-[1.2rem] bg-white/65 px-3.5 py-2 text-[0.74rem] leading-5 text-slate-700 backdrop-blur">
                Home, my bookings, and the key areas of the app are always close by.
              </div>
            </div>

            <nav className="flex-1 px-4 py-3">
              <ul className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const targetHref =
                    item.href === "/search" && searchHref ? searchHref : item.href;
                  const targetPathname = targetHref.split("?")[0];
                  const active =
                    targetPathname === "/"
                      ? pathname === "/"
                      : pathname.startsWith(targetPathname);

                  return (
                    <li key={`${item.href}-${targetPathname}`}>
                      <button
                        type="button"
                        onClick={() =>
                          handleProtectedNavigation(targetHref, item.requiresAuth)
                        }
                        className={[
                          "group flex w-full items-center justify-between rounded-[1.15rem] border px-3.5 py-2.5 text-left transition-all duration-200",
                          active
                            ? "border-sky-300 bg-sky-50 text-sky-700 shadow-sm"
                            : "border-slate-200 bg-white text-slate-800 hover:border-sky-200 hover:bg-slate-50",
                        ].join(" ")}
                      >
                        <span className="flex items-center gap-2.5">
                          <span
                            className={[
                              "flex h-9 w-9 items-center justify-center rounded-[0.95rem] transition",
                              active
                                ? "bg-sky-100 text-sky-700"
                                : "bg-slate-100 text-slate-600 group-hover:bg-sky-50 group-hover:text-sky-700",
                            ].join(" ")}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="text-[0.78rem] font-medium">{item.label}</span>
                        </span>
                        <span className="text-[0.76rem] text-slate-400 group-hover:text-sky-500">
                          {"->"}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="border-t border-slate-200 px-4 py-2.5 text-[0.68rem] text-slate-500">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-700">Transport Booking System</p>
                  <p className="mt-1 leading-[1.15rem]">
                    Shared sidebar for Home and the main feature pages.
                  </p>
                </div>

                {loggedIn ? (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1.5 text-[0.7rem] font-semibold text-red-700 transition hover:bg-red-100"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Logout
                  </button>
                ) : (
                  <Link
                    href="/auth/login"
                    onClick={onClose}
                    className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1.5 text-[0.7rem] font-semibold text-sky-700 transition hover:bg-sky-100"
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    Login
                  </Link>
                )}
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
