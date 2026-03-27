"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import { ToastProvider } from "@/components/admin/ToastProvider";
import { isAuthenticated, getStoredUserRole, buildLoginRedirect } from "@/lib/auth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    // Lớp bảo vệ phía client (dự phòng cho Middleware)
    if (!isAuthenticated()) {
      router.replace(buildLoginRedirect("/admin"));
      return;
    }
    const role = getStoredUserRole();
    if (role && role !== "ADMIN") {
      router.replace("/");
    }
  }, [router]);

  return (
    <div className="relative flex min-h-screen w-full flex-row bg-slate-50 dark:bg-[#101622] text-slate-900 dark:text-slate-100 font-sans antialiased">
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />
      
      <ToastProvider>
        <AdminSidebar />
        <main className="flex-1 flex flex-col min-h-screen">
          <AdminHeader />
          <div className="p-6 max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </ToastProvider>
    </div>
  );
}
