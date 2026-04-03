"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Calendar, Settings, LogOut, Bot } from "lucide-react";
import React from "react";

import ChatPanel from "../../components/ai/ChatPanel";
import { useAuth } from "@/contexts/AuthContext";

const springConfig = { type: "spring", stiffness: 120, damping: 20 } as const;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-mf-bg selection:bg-mf-accent/30">
      <div className="flex-1 flex w-full max-w-[1200px] mx-auto px-6 gap-8 mt-8">
        <aside className="w-64 hidden lg:flex flex-col gap-2">
          <SidebarItem
            icon={<LayoutDashboard />}
            label="Overview"
            active={pathname === "/dashboard"}
            onClick={() => router.push("/dashboard")}
          />
          <SidebarItem
            icon={<Calendar />}
            label="Schedule"
            active={pathname === "/events"}
            onClick={() => router.push("/events")}
          />
          <SidebarItem
            icon={<Bot />}
            label="VoloNexus.AI Assistant"
            active={pathname === "/assistant"}
            onClick={() => router.push("/assistant")}
          />
          <SidebarItem
            icon={<Settings />}
            label="Settings"
            active={pathname === "/settings"}
            onClick={() => router.push("/settings")}
          />
          <div className="mt-auto pb-8">
            <button
              onClick={logout}
              className="flex items-center gap-3 px-4 py-3 w-full text-mf-text-secondary hover:text-red-400 hover:bg-red-400/5 rounded-xl transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </aside>

        <main className="flex-1 pb-20">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ...springConfig }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <ChatPanel />
    </div>
  );
}

function SidebarItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactElement;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
      flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 w-full text-left
      ${
        active
          ? "bg-mf-accent/10 text-mf-accent-light shadow-[inset_0_0_10px_rgba(59,130,246,0.1)]"
          : "text-mf-text-secondary hover:bg-white/5 hover:text-white"
      }
    `}
    >
      <span className={active ? "text-mf-accent" : "text-inherit"}>
        {React.cloneElement(icon as React.ReactElement<{ size: number }>, {
          size: 20,
        })}
      </span>
      <span className="text-sm font-semibold">{label}</span>
    </button>
  );
}
