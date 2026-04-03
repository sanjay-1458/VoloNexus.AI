"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi, accountsApi } from "@/lib/api";
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
  Search,
  Filter,
  AlertCircle,
  CheckCircle2,
  Clock,
  Mail,
  CalendarDays,
  RefreshCw,
  XCircle,
  ChevronDown,
} from "lucide-react";

const springConfig = { type: "spring", stiffness: 120, damping: 20 } as const;

interface SyncedConnection {
  id: string;
  user_id: string;
  user_name: string;
  account_email: string;
  provider: "google" | "outlook";
  status: "healthy" | "warning" | "failed";
  last_sync: string;
  events_imported: number;
  sync_latency_ms: number;
}

export default function AdminSyncActivePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [connections, setConnections] = useState<SyncedConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "healthy" | "warning" | "failed"
  >("all");
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin"))
      router.push("/dashboard");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === "admin") {
      adminApi
        .syncActive()
        .then((res) => setConnections(res.data))
        .catch((err) => console.error("Failed to load active syncs", err))
        .finally(() => setLoading(false));
    }
  }, [user]);

  const filteredConnections = useMemo(() => {
    return connections
      .filter((c) => statusFilter === "all" || c.status === statusFilter)
      .filter(
        (c) =>
          c.account_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.user_name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      .sort(
        (a, b) =>
          new Date(b.last_sync).getTime() - new Date(a.last_sync).getTime(),
      );
  }, [connections, searchTerm, statusFilter]);

  const metrics = useMemo(() => {
    const total = connections.length;
    const healthy = connections.filter((c) => c.status === "healthy").length;
    const failed = connections.filter((c) => c.status === "failed").length;
    const totalEvents = connections.reduce(
      (acc, curr) => acc + curr.events_imported,
      0,
    );
    return { total, healthy, failed, totalEvents };
  }, [connections]);

  if (authLoading || !user || user.role !== "admin") return null;

  const filterOptions = [
    { id: "all", label: "All Statuses" },
    { id: "healthy", label: "Healthy" },
    { id: "warning", label: "Warning (High Latency)" },
    { id: "failed", label: "Failed / Revoked" },
  ];

  return (
    <div
      className="max-w-[1200px] mx-auto px-6 lg:px-8 py-8"
      data-testid="admin-sync-dashboard"
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
            Active Synchronizations
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-xs font-bold text-mf-text-secondary uppercase tracking-widest">
              OAuth Integration Monitor
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        <MetricCard
          label="Total Connections"
          value={metrics.total}
          icon={<Activity className="w-5 h-5 text-blue-400" />}
          bg="bg-blue-400/10"
          border="border-blue-400/20"
        />
        <MetricCard
          label="Healthy Syncs"
          value={metrics.healthy}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          bg="bg-emerald-400/10"
          border="border-emerald-400/20"
        />
        <MetricCard
          label="Failing Syncs"
          value={metrics.failed}
          icon={<XCircle className="w-5 h-5 text-red-400" />}
          bg="bg-red-400/10"
          border="border-red-400/20"
          alert={metrics.failed > 0}
        />
        <MetricCard
          label="Events Processed"
          value={metrics.totalEvents.toLocaleString()}
          icon={<CalendarDays className="w-5 h-5 text-purple-400" />}
          bg="bg-purple-400/10"
          border="border-purple-400/20"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 bg-[#111827]/80 p-4 rounded-2xl border border-[#1F2937] backdrop-blur-xl shadow-xl relative z-20"
      >
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-mf-text-secondary" />
          <input
            type="text"
            placeholder="Search by email or user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/20 border border-white/5 text-white text-sm rounded-xl pl-11 pr-4 py-2.5 focus:outline-none focus:border-mf-accent/50 transition-colors placeholder:text-mf-text-secondary/50"
          />
        </div>

        <div className="relative w-full md:w-auto">
          <button
            onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
            className="flex items-center justify-between w-full md:min-w-[220px] bg-black/20 hover:bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white font-semibold transition-colors"
          >
            <span className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-mf-text-secondary" />
              {filterOptions.find((o) => o.id === statusFilter)?.label}
            </span>
            <ChevronDown className="w-4 h-4 text-mf-text-secondary" />
          </button>

          <AnimatePresence>
            {filterDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setFilterDropdownOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute top-full right-0 mt-2 w-full min-w-max bg-[#1F2937] border border-white/10 rounded-xl shadow-2xl z-20 overflow-hidden"
                >
                  {filterOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => {
                        setStatusFilter(option.id as any);
                        setFilterDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm transition-colors ${statusFilter === option.id ? "bg-mf-accent/20 text-mf-accent-light font-bold" : "text-white hover:bg-white/5"}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <div className="space-y-4 pb-20 relative z-0">
        {loading ? (
          [1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-20 bg-mf-secondary/50 rounded-2xl border border-mf-border animate-pulse"
            />
          ))
        ) : filteredConnections.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 bg-[#111827] border border-[#1F2937] rounded-3xl"
          >
            <Activity className="w-12 h-12 text-mf-text-secondary/30 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-1">
              No connections found
            </h3>
            <p className="text-sm text-mf-text-secondary">
              Try adjusting your search or filters.
            </p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredConnections.map((conn, i) => (
              <ConnectionRow key={conn.id} connection={conn} index={i} />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

function ConnectionRow({
  connection,
  index,
}: {
  connection: SyncedConnection;
  index: number;
}) {
  const [isSyncing, setIsSyncing] = useState(false);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "healthy":
        return {
          color: "text-emerald-400",
          bg: "bg-emerald-400/10",
          border: "border-emerald-400/20",
          icon: CheckCircle2,
          text: "Healthy",
        };
      case "warning":
        return {
          color: "text-amber-400",
          bg: "bg-amber-400/10",
          border: "border-amber-400/20",
          icon: AlertCircle,
          text: "High Latency",
        };
      case "failed":
        return {
          color: "text-red-400",
          bg: "bg-red-400/10",
          border: "border-red-400/20",
          icon: XCircle,
          text: "Auth Revoked",
        };
      default:
        return {
          color: "text-gray-400",
          bg: "bg-gray-400/10",
          border: "border-gray-400/20",
          icon: Activity,
          text: "Unknown",
        };
    }
  };

  const statusCfg = getStatusConfig(connection.status);

  const handleForceSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await accountsApi.syncCalendar(connection.id);
    } catch (error) {
      console.error("Manual sync failed", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const formattedLocalTime = useMemo(() => {
    try {
      const date = new Date(connection.last_sync);
      return new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
      }).format(date);
    } catch (e) {
      return "Unknown";
    }
  }, [connection.last_sync]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ ...springConfig, delay: index * 0.05 }}
      className="p-5 rounded-2xl bg-[#111827] border border-[#1F2937] hover:border-white/10 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-6 group relative overflow-hidden"
    >
      {connection.status === "failed" && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-3xl rounded-full pointer-events-none" />
      )}

      <div className="flex items-center gap-4 min-w-[300px]">
        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center relative">
          <Mail className="w-5 h-5 text-white" />
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-md bg-[#111827] border border-[#1F2937] flex items-center justify-center text-[8px] font-black uppercase">
            {connection.provider === "google" ? "G" : "O"}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight truncate max-w-[200px] sm:max-w-xs">
            {connection.account_email}
          </h3>
          <p className="text-xs text-mf-text-secondary flex items-center gap-1.5 mt-0.5">
            <Users className="w-3 h-3" /> Owner:{" "}
            <span className="font-semibold text-white/70">
              {connection.user_name}
            </span>
          </p>
        </div>
      </div>

      <div className="flex flex-wrap lg:flex-nowrap items-center gap-6 lg:gap-12 w-full lg:w-auto">
        <div className="text-left lg:text-right hidden sm:block">
          <p
            className="text-[10px] text-mf-text-secondary uppercase font-bold tracking-widest mb-1"
            title="Combined Calendar & Mail Volume"
          >
            Combined Volume
          </p>
          <p className="text-sm font-black text-white">
            {connection.events_imported.toLocaleString()}{" "}
            <span className="text-[10px] font-bold text-mf-text-secondary uppercase tracking-widest">
              Events
            </span>
          </p>
        </div>

        <div className="text-left lg:text-right hidden sm:block">
          <p className="text-[10px] text-mf-text-secondary uppercase font-bold tracking-widest mb-1">
            Latency
          </p>
          <p
            className={`text-sm font-black ${connection.sync_latency_ms > 1000 ? "text-amber-400" : "text-white"}`}
          >
            {connection.sync_latency_ms}{" "}
            <span className="text-xs font-normal text-mf-text-secondary">
              ms
            </span>
          </p>
        </div>

        <div className="text-left lg:text-right">
          <p className="text-[10px] text-mf-text-secondary uppercase font-bold tracking-widest mb-1">
            Last Sync
          </p>
          <p className="text-xs font-bold text-white flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-mf-text-secondary" />
            {formattedLocalTime}
          </p>
        </div>

        <div
          className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 ${statusCfg.bg} ${statusCfg.border} ${statusCfg.color} min-w-[130px] justify-center`}
        >
          <statusCfg.icon className="w-3.5 h-3.5" />
          <span className="text-xs font-bold tracking-wide">
            {statusCfg.text}
          </span>
        </div>

        <button
          onClick={handleForceSync}
          disabled={isSyncing}
          className="p-2.5 rounded-xl bg-white/5 hover:bg-mf-accent text-mf-text-secondary hover:text-white transition-all outline-none disabled:opacity-50"
        >
          <RefreshCw
            className={`w-4 h-4 ${isSyncing ? "animate-spin text-mf-accent" : ""}`}
          />
        </button>
      </div>
    </motion.div>
  );
}

function MetricCard({ label, value, icon, bg, border, alert }: any) {
  return (
    <div
      className={`bg-[#111827] border ${alert ? "border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]" : "border-[#1F2937]"} rounded-2xl p-5 shadow-lg relative overflow-hidden group`}
    >
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className={`p-2.5 rounded-xl ${bg} ${border} border`}>{icon}</div>
        {alert && (
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        )}
      </div>
      <div className="relative z-10">
        <p className="text-3xl font-black text-white mb-1">{value}</p>
        <p className="text-[10px] font-bold text-mf-text-secondary uppercase tracking-widest">
          {label}
        </p>
      </div>
    </div>
  );
}
