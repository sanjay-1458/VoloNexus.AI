"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  BarChart3,
  Bug,
  Cpu,
  Activity,
  ShieldCheck,
  Zap,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Clock,
  Calendar as CalendarIcon,
  Video,
  Users,
  AlignLeft,
  AlertTriangle,
} from "lucide-react";

const springConfig = { type: "spring", stiffness: 120, damping: 20 } as const;

interface DayData {
  date: Date;
  count: number;
  intensity: "none" | "low" | "moderate" | "high";
}

interface EventInsights {
  totalMonth: number;
  totalWeek: number;
  busiestDayName: string;
  conflictRate: string;
  calendarDays: { date: string; count: number }[];
  typeDistribution: {
    type: string;
    count: number;
    color: string;
    icon?: any;
  }[];
  peakHours: { hour: string; percentage: number }[];
}

export default function AdminTotalEventsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [currentMonth, setCurrentMonth] = useState<Date>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [loading, setLoading] = useState(true);
  const [hoveredDay, setHoveredDay] = useState<DayData | null>(null);
  const [insights, setInsights] = useState<EventInsights | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === "admin") {
      setLoading(true);
      api
        .get(
          `/admin/events/analytics?year=${currentMonth.getFullYear()}&month=${currentMonth.getMonth() + 1}`,
        )
        .then((res) => setInsights(res.data))
        .catch((err) => console.error("Failed to load event analytics", err))
        .finally(() => setLoading(false));
    }
  }, [user, currentMonth]);

  const calendarGrid = useMemo(() => {
    const daysInMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0,
    ).getDate();
    const startDayOfWeek = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1,
    ).getDay();
    const days: (DayData | null)[] = Array(startDayOfWeek).fill(null);

    const backendDays = insights?.calendarDays || [];

    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        i,
      );

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const matchStr = `${year}-${month}-${day}`;

      const backendDay = backendDays.find((bd) => bd.date === matchStr);
      const count = backendDay ? backendDay.count : 0;

      let intensity: DayData["intensity"] = "none";
      if (count > 0 && count <= 3) intensity = "low";
      else if (count > 3 && count <= 8) intensity = "moderate";
      else if (count > 8) intensity = "high";

      days.push({ date: d, count, intensity });
    }

    return days;
  }, [currentMonth, insights]);

  const handlePrevMonth = () =>
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
    );
  const handleNextMonth = () =>
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    );

  const getDistributionIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes("video") || t.includes("zoom") || t.includes("call"))
      return Video;
    if (t.includes("interview")) return AlignLeft;
    if (t.includes("standard") || t.includes("meeting")) return Users;
    return CalendarIcon;
  };

  if (authLoading || !user || user.role !== "admin") return null;

  return (
    <div
      className="max-w-[1200px] mx-auto px-6 lg:px-8 py-8"
      data-testid="admin-events-dashboard"
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
            Global Event Intelligence
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-xs font-bold text-mf-text-secondary uppercase tracking-widest">
              System-Wide Aggregation (IST)
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
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all whitespace-nowrap ${isActive ? "bg-mf-accent text-white border-transparent shadow-[0_0_15px_rgba(59,130,246,0.3)]" : "bg-white/5 border-white/5 text-mf-text-secondary hover:bg-white/10 hover:text-white"}`}
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
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
      >
        <MetricCard
          label="Viewed Month"
          value={insights?.totalMonth?.toLocaleString() || "0"}
          icon={<CalendarDays className="w-5 h-5 text-mf-accent" />}
        />
        <MetricCard
          label="Rolling Week (Real-time)"
          value={insights?.totalWeek?.toLocaleString() || "0"}
          icon={<TrendingUp className="w-5 h-5 text-emerald-400" />}
          sublabel="May include cross-month days"
        />
        <MetricCard
          label="Busiest Day"
          value={insights?.busiestDayName || "--"}
          icon={<Zap className="w-5 h-5 text-amber-400" />}
        />
        <MetricCard
          label="Conflict Rate"
          value={insights?.conflictRate || "0%"}
          icon={<AlertTriangle className="w-5 h-5 text-red-400" />}
        />
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8 pb-20">
        <div className="lg:col-span-2 bg-[#111827] border border-[#1F2937] rounded-[24px] p-6 shadow-2xl relative overflow-hidden flex flex-col">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">
                Platform Volume Heatmap
              </h2>
              <p className="text-xs text-mf-text-secondary mt-1">
                Aggregated scheduled events across all active accounts.
              </p>
            </div>

            <div className="flex items-center gap-4 bg-black/20 border border-white/5 rounded-xl p-1.5 backdrop-blur-md">
              <button
                onClick={handlePrevMonth}
                className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="w-32 text-center text-sm font-bold text-white tracking-wider uppercase">
                {currentMonth.toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {loading || !insights ? (
            <div className="h-80 flex items-center justify-center flex-1">
              <div className="w-8 h-8 border-2 border-mf-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative z-10 flex-1 flex flex-col justify-between"
            >
              <div className="grid grid-cols-7 gap-2 sm:gap-3 text-center mb-4">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div
                    key={d}
                    className="text-[10px] font-black text-mf-text-secondary uppercase tracking-widest"
                  >
                    {d}
                  </div>
                ))}

                {calendarGrid.map((day, i) => {
                  if (!day)
                    return <div key={`empty-${i}`} className="aspect-square" />;

                  const isToday =
                    day.date.toDateString() === new Date().toDateString();

                  let bgClass = "bg-white/5 border-transparent text-white/30";
                  if (day.intensity === "low")
                    bgClass = "bg-blue-900/40 border-blue-800/50 text-blue-300";
                  if (day.intensity === "moderate")
                    bgClass = "bg-blue-600/70 border-blue-500/50 text-white";
                  if (day.intensity === "high")
                    bgClass =
                      "bg-cyan-400 border-cyan-300 text-slate-900 font-black shadow-[0_0_15px_rgba(34,211,238,0.4)]";

                  return (
                    <div
                      key={i}
                      className="relative aspect-square group"
                      onMouseEnter={() => setHoveredDay(day)}
                      onMouseLeave={() => setHoveredDay(null)}
                    >
                      <div
                        className={`w-full h-full rounded-xl sm:rounded-2xl border flex flex-col items-center justify-center transition-all duration-300 cursor-crosshair hover:scale-110 hover:z-20 ${bgClass} ${isToday ? "ring-2 ring-white ring-offset-2 ring-offset-[#111827]" : ""}`}
                      >
                        <span className="text-sm sm:text-base font-bold">
                          {day.date.getDate()}
                        </span>
                      </div>

                      <AnimatePresence>
                        {hoveredDay?.date === day.date && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-max px-4 py-2 bg-white text-black rounded-xl shadow-2xl z-50 flex items-center gap-3 pointer-events-none"
                          >
                            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                            <div>
                              <p className="text-xs font-black">
                                {day.count} Events
                              </p>
                              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                {day.date.toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </p>
                            </div>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-white/5">
                <span className="text-[10px] uppercase tracking-widest font-bold text-mf-text-secondary mr-2">
                  Volume Density:
                </span>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-white/5" />{" "}
                  <span className="text-[10px] text-mf-text-secondary">
                    None
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-blue-900/40 border border-blue-800/50" />{" "}
                  <span className="text-[10px] text-mf-text-secondary">
                    Low
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-blue-600/70 border border-blue-500/50" />{" "}
                  <span className="text-[10px] text-mf-text-secondary">
                    Moderate
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]" />{" "}
                  <span className="text-[10px] text-white font-bold">High</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#111827] border border-[#1F2937] rounded-[24px] p-6 shadow-xl"
          >
            <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
              <AlignLeft className="w-4 h-4 text-mf-accent" /> Event
              Distribution
            </h3>

            {loading || !insights ? (
              <div className="h-40 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-mf-accent border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-5">
                {insights.typeDistribution.map((item, i) => {
                  const Icon = getDistributionIcon(item.type);
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg bg-white/5`}>
                            <Icon className="w-3.5 h-3.5 text-white" />
                          </div>
                          <span className="text-xs font-bold text-white">
                            {item.type}
                          </span>
                        </div>
                        <span className="text-xs font-black text-mf-text-secondary">
                          {item.count}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${(item.count / Math.max(1, insights.totalMonth)) * 100}%`,
                          }}
                          transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                          className={`h-full rounded-full ${item.color || "bg-blue-500"}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#111827] border border-[#1F2937] rounded-[24px] p-6 shadow-xl"
          >
            <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-8 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" /> Peak Hours (IST)
            </h3>

            {loading || !insights ? (
              <div className="h-44 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="relative h-44 mt-4 px-2">
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6">
                  <div className="border-b border-white/5 w-full h-0 flex items-center">
                    <span className="text-[9px] text-mf-text-secondary font-bold -translate-y-2 bg-[#111827] pr-2">
                      100%
                    </span>
                  </div>
                  <div className="border-b border-white/5 w-full h-0 flex items-center">
                    <span className="text-[9px] text-mf-text-secondary font-bold -translate-y-2 bg-[#111827] pr-2">
                      50%
                    </span>
                  </div>
                  <div className="border-b border-white/10 w-full h-0 flex items-center">
                    <span className="text-[9px] text-mf-text-secondary font-bold -translate-y-2 bg-[#111827] pr-2">
                      0%
                    </span>
                  </div>
                </div>

                <div className="flex items-end justify-between h-full pl-8 pb-6 gap-2">
                  {insights.peakHours.map((slot, i) => (
                    <div
                      key={i}
                      className="flex flex-col items-center w-full group h-full justify-end relative"
                    >
                      <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-slate-900 bg-cyan-400 px-2 py-1 rounded shadow-[0_0_10px_rgba(34,211,238,0.3)] z-10">
                        {slot.percentage}%
                      </div>
                      <div className="w-full max-w-[28px] bg-white/5 rounded-t-lg relative flex items-end h-full">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${slot.percentage}%` }}
                          transition={{ duration: 1, delay: 0.6 + i * 0.1 }}
                          className={`w-full rounded-t-lg transition-colors ${slot.percentage === 100 ? "bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]" : "bg-blue-600/80 group-hover:bg-blue-500"}`}
                        />
                      </div>
                      <span className="text-[9px] font-bold text-mf-text-secondary absolute -bottom-5">
                        {slot.hour}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
  sublabel,
}: {
  label: string;
  value: string;
  icon: any;
  sublabel?: string;
}) {
  return (
    <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-5 shadow-lg flex items-center gap-4 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="p-3 bg-black/40 rounded-xl border border-white/5 relative z-10">
        {icon}
      </div>
      <div className="relative z-10 flex flex-col justify-center">
        <p className="text-[10px] font-bold text-mf-text-secondary uppercase tracking-widest mb-0.5">
          {label}
        </p>
        <p className="text-2xl font-black text-white">{value}</p>
        {sublabel && (
          <p className="text-[8px] text-mf-text-secondary uppercase mt-0.5 opacity-60">
            {sublabel}
          </p>
        )}
      </div>
    </div>
  );
}
