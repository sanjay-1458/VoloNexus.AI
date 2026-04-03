"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi } from "@/lib/api";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  BarChart3,
  Users,
  Calendar,
  DollarSign,
  Bug,
  Cpu,
  Activity,
  ShieldCheck,
  Zap,
  ArrowUpRight,
} from "lucide-react";

const springConfig = { type: "spring", stiffness: 120, damping: 20 } as const;

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin"))
      router.push("/dashboard");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === "admin") {
      adminApi
        .analytics()
        .then(({ data }) => setAnalytics(data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (authLoading || !user || user.role !== "admin") return null;

  const stats = analytics
    ? [
        {
          label: "Total Users",
          value: analytics.users.total,
          icon: Users,
          color: "text-blue-400",
          bg: "bg-blue-400/10",
          href: "/admin/total-users",
        },
        {
          label: "Paid Users",
          value: analytics.users.paid,
          icon: DollarSign,
          color: "text-emerald-400",
          bg: "bg-emerald-400/10",
          href: "/admin/paid-users",
        },
        {
          label: "Total Events",
          value: analytics.events.total,
          icon: Calendar,
          color: "text-purple-400",
          bg: "bg-purple-400/10",
          href: "/admin/total-events",
        },
        {
          label: "Sync Active",
          value: analytics.accounts.connected,
          icon: Activity,
          color: "text-cyan-400",
          bg: "bg-cyan-400/10",
          href: "/admin/sync-active",
        },
        {
          label: "Bug Reports",
          value: analytics.bugs.total,
          icon: Bug,
          color: "text-red-400",
          bg: "bg-red-400/10",
          href: "/admin/bugs",
        },
        {
          label: "Revenue (est)",
          value: `$${analytics.earnings.total}`,
          icon: BarChart3,
          color: "text-amber-400",
          bg: "bg-amber-400/10",
          href: "/admin/revenue",
        },
      ]
    : [];

  return (
    <div
      className="max-w-[1200px] mx-auto px-6 lg:px-8 py-8"
      data-testid="admin-dashboard"
    >
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={springConfig}
        >
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-5 h-5 text-mf-accent" />
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-mf-accent">
              Root Authority
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Platform Overview
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-xs font-bold text-mf-text-secondary uppercase tracking-widest">
              Live Metrics Active
            </p>
          </div>
        </motion.div>

        <nav className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {[
            { label: "Dashboard", href: "/admin", icon: BarChart3 },
            { label: "Bug Reports", href: "/admin/bugs", icon: Bug },
            { label: "AI Agents", href: "/admin/agents", icon: Cpu },
            { label: "API Health", href: "/admin/api-health", icon: Activity },
          ].map((item) => {
            const isActive =
              pathname === item.href || pathname === `${item.href}/`;
            return (
              <Link key={item.href} href={item.href}>
                <button
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-mf-accent text-white border-transparent shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                      : "bg-white/5 border-white/5 text-mf-text-secondary hover:bg-white/10 hover:text-white"
                  }`}
                  data-testid={`admin-nav-${item.label.toLowerCase().replace(" ", "-")}`}
                >
                  <item.icon
                    className={`w-4 h-4 ${isActive ? "text-white" : "text-mf-text-secondary"}`}
                  />
                  {item.label}
                </button>
              </Link>
            );
          })}
        </nav>
      </header>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-32 bg-mf-secondary/50 rounded-[12px] border border-mf-border animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {stats.map((stat, i) => (
            <Link key={stat.label} href={stat.href} className="block group">
              <motion.div
                className="p-6 rounded-[12px] bg-[#111827] border border-[#1F2937] relative overflow-hidden h-full transition-colors group-hover:border-mf-accent/30"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springConfig, delay: i * 0.05 }}
                whileHover={{
                  y: -4,
                  rotateX: 2,
                  rotateY: -2,
                  scale: 1.02,
                  boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
                }}
                data-testid={`admin-stat-${i}`}
              >
                <div
                  className={`absolute -right-4 -top-4 w-24 h-24 ${stat.bg} blur-3xl opacity-30 group-hover:opacity-60 transition-opacity`}
                />

                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-mf-accent opacity-0 -translate-y-2 translate-x-2 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all duration-300" />
                </div>
                <div className="relative z-10">
                  <p className="text-3xl font-black text-white mb-1 group-hover:text-mf-accent-light transition-colors">
                    {stat.value}
                  </p>
                  <p className="text-[10px] font-bold text-mf-text-secondary uppercase tracking-[0.15em]">
                    {stat.label}
                  </p>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      )}

      {analytics?.ai_agents && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springConfig, delay: 0.4 }}
          className="p-8 rounded-[24px] bg-[#111827] border border-[#1F2937]"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <Cpu className="w-5 h-5 text-mf-accent" /> AI Core
                Infrastructure
              </h2>
              <p className="text-xs text-mf-text-secondary mt-1">
                Status monitor for all autonomous sub-processes.
              </p>
            </div>
            <div className="px-4 py-1.5 bg-mf-accent/10 border border-mf-accent/20 rounded-full hidden sm:flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-mf-accent animate-pulse" />
              <span className="text-[10px] font-black text-mf-accent uppercase tracking-widest">
                All Engines Nominal
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {Object.entries(analytics.ai_agents).map(([name, agent]: any) => (
              <motion.div
                key={name}
                whileHover={{ scale: 1.05 }}
                className="p-4 rounded-xl bg-mf-bg border border-mf-border text-center transition-all hover:border-mf-accent/30 cursor-default"
                data-testid={`agent-status-${name}`}
              >
                <div
                  className={`w-2.5 h-2.5 rounded-full mx-auto mb-3 shadow-[0_0_10px_rgba(0,0,0,0.5)] ${
                    agent.status === "active"
                      ? "bg-emerald-500 shadow-emerald-500/50"
                      : "bg-mf-text-secondary/30"
                  }`}
                />
                <p className="text-[10px] font-black text-white uppercase tracking-tighter mb-1 truncate">
                  {name}
                </p>
                <p
                  className={`text-[9px] font-bold uppercase tracking-widest ${
                    agent.status === "active"
                      ? "text-emerald-400"
                      : "text-mf-text-secondary"
                  }`}
                >
                  {agent.status}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
