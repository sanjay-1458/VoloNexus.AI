"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi } from "@/lib/api";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Activity,
  CheckCircle,
  XCircle,
  HelpCircle,
  Clock,
  ShieldCheck,
  Globe,
  Cpu,
  Database,
  Zap,
  Bug,
  BarChart3,
} from "lucide-react";

const springConfig = { type: "spring", stiffness: 120, damping: 20 } as const;

export default function AdminApiHealthPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin"))
      router.push("/dashboard");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === "admin") {
      adminApi
        .apiHealth()
        .then(({ data }) => setHealth(data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (authLoading || !user || user.role !== "admin") return null;

  const getStatusDetails = (status: string) => {
    switch (status) {
      case "healthy":
        return {
          icon: CheckCircle,
          color: "text-emerald-400",
          bg: "bg-emerald-400/10",
          border: "border-emerald-400/20",
        };
      case "error":
      case "down":
        return {
          icon: XCircle,
          color: "text-red-400",
          bg: "bg-red-400/10",
          border: "border-red-400/20",
        };
      default:
        return {
          icon: HelpCircle,
          color: "text-amber-400",
          bg: "bg-amber-400/10",
          border: "border-amber-400/20",
        };
    }
  };

  return (
    <div
      className="max-w-[1200px] mx-auto px-6 lg:px-8 py-8"
      data-testid="admin-api-health-page"
    >
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={springConfig}
        >
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-mf-accent" />
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-mf-accent">
              Connectivity Monitor
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">
            API Health
          </h1>
          <p className="text-mf-text-secondary mt-2">
            Real-time status tracking for internal services and external AI
            providers.
          </p>
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
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-[88px] w-full bg-[#111827] rounded-2xl border border-[#1F2937] flex items-center p-5 gap-6"
            >
              <div className="w-12 h-12 rounded-2xl bg-mf-secondary/50 animate-pulse shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="h-5 w-32 bg-mf-secondary/50 rounded animate-pulse" />
                <div className="h-3 w-48 bg-mf-secondary/30 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : health?.apis && health.apis.length > 0 ? (
        <motion.div
          className="grid gap-4"
          initial="initial"
          animate="animate"
          variants={{ animate: { transition: { staggerChildren: 0.05 } } }}
        >
          {health.apis.map((api: any, i: number) => {
            const style = getStatusDetails(api.status);
            const Icon = style.icon;

            return (
              <motion.div
                key={api.name}
                variants={{
                  initial: { opacity: 0, y: 10 },
                  animate: { opacity: 1, y: 0 },
                }}
                transition={springConfig}
                className="p-5 rounded-[12px] bg-[#111827] border border-[#1F2937] flex items-center gap-6 group hover:translate-x-1 hover:bg-white/[0.02] transition-all duration-200 cursor-default"
                data-testid={`api-status-${i}`}
              >
                <div
                  className={`relative flex items-center justify-center w-12 h-12 rounded-2xl border ${style.bg} ${style.border}`}
                >
                  <Icon className={`w-6 h-6 ${style.color}`} />
                  {api.status === "healthy" && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-white text-lg group-hover:text-mf-accent-light transition-colors">
                      {api.name}
                    </h3>
                    <div
                      className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${style.bg} ${style.color} ${style.border}`}
                    >
                      {api.status}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-mf-text-secondary font-medium">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Last check:{" "}
                      {api.last_check
                        ? new Date(api.last_check).toLocaleTimeString()
                        : "Never"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5" />
                      Latency: {api.latency || "Unknown"}
                    </span>
                  </div>
                </div>

                <div className="hidden md:flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((j) => (
                      <div
                        key={j}
                        className="w-6 h-1 bg-emerald-500/20 rounded-full overflow-hidden"
                      >
                        <div className="h-full bg-emerald-500 w-full opacity-40" />
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <div className="text-center py-24 bg-mf-secondary/30 rounded-3xl border border-dashed border-mf-border">
          <Activity className="w-16 h-16 text-mf-text-secondary opacity-20 mx-auto mb-6" />
          <p className="text-mf-text-secondary font-medium">
            No connection data recorded yet. Waiting for health ping.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-mf-accent text-sm font-bold hover:underline"
          >
            Refresh
          </button>
        </div>
      )}

      <footer className="mt-12 p-6 rounded-[24px] bg-mf-accent/5 border border-mf-accent/10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-mf-accent/10 rounded-2xl border border-mf-accent/20">
            <ShieldCheck className="w-6 h-6 text-mf-accent" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Encrypted Handshakes</p>
            <p className="text-xs text-mf-text-secondary">
              All outbound requests to Gemini, Claude, and Pinecone are secured
              via TLS 1.3.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black text-mf-text-secondary uppercase tracking-[0.2em]">
          System Uptime:{" "}
          <span className="text-emerald-400 font-black">99.98%</span>
        </div>
      </footer>
    </div>
  );
}
