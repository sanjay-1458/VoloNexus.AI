"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { eventsApi, accountsApi } from "@/lib/api";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import {
  Calendar as CalendarIcon,
  Users,
  AlertTriangle,
  Clock,
  Plus,
  ArrowRight,
  Zap,
  MapPin,
  Video,
  AlignLeft,
  X,
  Info,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  BrainCircuit,
  Crown,
  CheckCircle2,
  Lock,
  Unlock,
} from "lucide-react";
import Link from "next/link";
import { formatDate, formatTime, getEventTypeColor } from "@/lib/utils";

const springConfig = { type: "spring", stiffness: 120, damping: 20 } as const;

export default function DashboardPage() {
  const { user, loading, refreshUser } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [accountCount, setAccountCount] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [selectedCalDate, setSelectedCalDate] = useState<Date>(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  });
  const [monthEvents, setMonthEvents] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      eventsApi
        .stats()
        .then((r) => setStats(r.data))
        .catch(() => {});
      eventsApi
        .upcoming(8)
        .then((r) => setUpcoming(r.data))
        .catch(() => {});
      accountsApi
        .list()
        .then((r) => setAccountCount(r.data.length))
        .catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    if (showCalendar) {
      const fetchMonthEvents = async () => {
        try {
          const start = new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth(),
            1,
          );
          const end = new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth() + 1,
            0,
            23,
            59,
            59,
            999,
          );
          const res = await api.get(
            `/events?start_date=${start.toISOString()}&end_date=${end.toISOString()}`,
          );
          setMonthEvents(res.data || []);
        } catch (e) {
          console.error(e);
        }
      };
      fetchMonthEvents();
    }
  }, [showCalendar, currentMonth]);

  const updateSelectedDateForMonth = (monthDate: Date) => {
    const today = new Date();
    if (
      monthDate.getFullYear() === today.getFullYear() &&
      monthDate.getMonth() === today.getMonth()
    ) {
      const t = new Date(today);
      t.setHours(0, 0, 0, 0);
      setSelectedCalDate(t);
    } else {
      setSelectedCalDate(
        new Date(monthDate.getFullYear(), monthDate.getMonth(), 1),
      );
    }
  };

  const handlePrevMonth = () => {
    const prev = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() - 1,
      1,
    );
    setCurrentMonth(prev);
    updateSelectedDateForMonth(prev);
  };

  const handleNextMonth = () => {
    const next = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      1,
    );
    setCurrentMonth(next);
    updateSelectedDateForMonth(next);
  };

  const handleUpgrade = async () => {
    try {
      setIsCheckoutLoading(true);
      const res = await api.post("/stripe/create-checkout-session");
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (error) {
      console.error("Failed to initialize checkout:", error);
      alert("Checkout initialization failed. Please try again later.");
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-mf-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-mf-text-secondary animate-pulse text-sm font-medium">
            Synchronizing with Agents...
          </p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: "Upcoming",
      value: stats?.upcoming_events || 0,
      icon: CalendarIcon,
      color: "text-mf-accent",
      bg: "bg-mf-accent/10",
      glow: "bg-mf-accent",
    },
    {
      label: "Conflicts",
      value: stats?.unresolved_conflicts || 0,
      icon: AlertTriangle,
      color: "text-amber-400",
      bg: "bg-amber-400/10",
      glow: "bg-amber-400",
    },
    {
      label: "Connected Accounts",
      value: accountCount,
      icon: Users,
      color: "text-indigo-400",
      bg: "bg-indigo-400/10",
      glow: "bg-indigo-400",
    },
  ];

  const displayedUpcoming = upcoming.slice(0, 7);
  const hasMore = upcoming.length > 7;

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

  const maxAccounts = user.plan === "paid" ? 7 : 2;
  const accountPercentage = Math.min((accountCount / maxAccounts) * 100, 100);

  return (
    <div
      className="max-w-[1200px] mx-auto py-8 px-4 lg:px-0"
      data-testid="dashboard-page"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springConfig}
        className="mb-10"
      >
        <div className="flex items-center gap-3 mb-2">
          <Zap className="w-5 h-5 text-mf-accent fill-mf-accent" />
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-mf-accent">
            System Online
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
          Welcome back,{" "}
          <span className="text-mf-accent">{user.name.split(" ")[0]}</span>
        </h1>
        <p className="text-mf-text-secondary mt-3 text-lg max-w-2xl">
          Your agents have analyzed your incoming communications. Here is your
          optimized overview.
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6 mb-12">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            className="p-6 rounded-[24px] bg-[#111827] border border-[#1F2937] hover:border-white/10 shadow-lg relative overflow-hidden group transition-all duration-300 ease-out"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springConfig, delay: i * 0.1 }}
            whileHover={{ y: -4, scale: 1.01 }}
          >
            <div
              className={`absolute top-0 right-0 w-32 h-32 ${stat.glow} blur-[80px] -mr-8 -mt-8 opacity-20 group-hover:opacity-40 transition-opacity duration-500 pointer-events-none`}
            />

            <div className="flex items-center justify-between mb-4 relative z-10">
              <div
                className={`p-3 rounded-xl ${stat.bg} ${stat.color} border border-white/5`}
              >
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="relative z-10">
              <p className="text-4xl font-black text-white mb-1 tracking-tight">
                {stat.value}
              </p>
              <p className="text-[10px] font-bold text-mf-text-secondary uppercase tracking-[0.15em]">
                {stat.label}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-10 mb-12">
        <div className="lg:col-span-2">
          {!showCalendar ? (
            <motion.div
              key="upcoming-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  Upcoming Events
                  {stats?.unresolved_conflicts > 0 && (
                    <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-md font-black uppercase tracking-wider">
                      Action Required
                    </span>
                  )}
                </h2>
                <button
                  onClick={() => setShowCalendar(true)}
                  className="group text-sm font-bold text-mf-accent flex items-center gap-2 hover:text-mf-accent-light transition-colors"
                >
                  View full calendar
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                </button>
              </div>

              {displayedUpcoming.length === 0 ? (
                <div className="p-12 rounded-[24px] bg-[#111827] border border-dashed border-[#1F2937] text-center shadow-xl">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CalendarIcon className="w-8 h-8 text-mf-text-secondary" />
                  </div>
                  <p className="text-mf-text-secondary font-medium">
                    Your schedule is currently clear.
                  </p>
                  <Link href="/events">
                    <button className="mt-6 px-6 py-2.5 bg-mf-accent hover:bg-mf-accent-hover text-white rounded-xl text-sm font-bold shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all active:scale-95">
                      Create New Event
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {displayedUpcoming.map((event: any, i: number) => (
                    <motion.div
                      key={event._id || event.id}
                      onClick={() => setSelectedEvent(event)}
                      className="p-5 rounded-2xl bg-[#111827] border border-[#1F2937] flex items-center gap-5 hover:border-mf-accent/30 hover:bg-white/[0.02] transition-all duration-300 ease-out group cursor-pointer shadow-lg"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        type: "tween",
                        duration: 0.3,
                        delay: i * 0.05,
                      }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div
                        className="w-1.5 h-12 rounded-full shadow-sm"
                        style={{
                          backgroundColor: getEventTypeColor(event.type),
                          boxShadow: `0 0 10px ${getEventTypeColor(event.type)}80`,
                        }}
                      />
                      <div className="flex-1">
                        <p className="font-bold text-white text-lg group-hover:text-mf-accent transition-colors">
                          {event.title}
                        </p>
                        <div className="flex items-center gap-4 mt-1">
                          <p className="text-xs text-mf-text-secondary flex items-center gap-1.5 font-medium">
                            <CalendarIcon className="w-3.5 h-3.5" />
                            {formatDate(event.start_time)}
                          </p>
                          <p className="text-xs text-mf-text-secondary flex items-center gap-1.5 font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            {formatTime(event.start_time)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <span className="text-[9px] px-2.5 py-1 rounded-md bg-white/5 text-mf-text-secondary font-black uppercase tracking-[0.15em] border border-white/5">
                          {event.type || "other"}
                        </span>
                        {event.has_conflict && (
                          <div className="flex items-center gap-1.5 text-amber-400">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="text-[10px] font-black hidden sm:block uppercase">
                              Conflict
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}

                  {hasMore && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="pt-3"
                    >
                      <Link href="/events">
                        <button className="w-full py-4 rounded-2xl bg-white/5 border border-white/5 hover:border-mf-accent/30 hover:bg-mf-accent/10 text-sm font-bold text-mf-text-secondary hover:text-white transition-all duration-300 flex items-center justify-center gap-2 group shadow-sm">
                          View all remaining events
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                        </button>
                      </Link>
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="full-calendar"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <button
                    onClick={() => setShowCalendar(false)}
                    className="hover:bg-white/10 p-2 rounded-xl transition-colors -ml-2"
                  >
                    <ArrowLeft className="w-5 h-5 text-mf-text-secondary hover:text-white" />
                  </button>
                  Monthly Agenda
                </h2>
              </div>

              <div className="bg-[#111827] border border-[#1F2937] rounded-[24px] p-6 shadow-2xl mb-6">
                <div className="flex justify-between items-center mb-6">
                  <button
                    onClick={handlePrevMonth}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-mf-text-secondary hover:text-white transition border border-white/5"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-lg font-bold text-white tracking-wide">
                    {currentMonth.toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  <button
                    onClick={handleNextMonth}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-mf-text-secondary hover:text-white transition border border-white/5"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-2 text-center mb-2">
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                    <div
                      key={d}
                      className="text-[10px] font-black text-mf-text-secondary uppercase tracking-[0.2em] py-2"
                    >
                      {d}
                    </div>
                  ))}
                  {Array.from({ length: startDayOfWeek }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const cellDate = new Date(
                      currentMonth.getFullYear(),
                      currentMonth.getMonth(),
                      day,
                    );
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const isPast = cellDate < today;
                    const isSelected =
                      selectedCalDate.getDate() === day &&
                      selectedCalDate.getMonth() === currentMonth.getMonth() &&
                      selectedCalDate.getFullYear() ===
                        currentMonth.getFullYear();

                    const hasEvent = monthEvents.some((e) => {
                      const eDate = new Date(e.start_time);
                      return (
                        eDate.getDate() === day &&
                        eDate.getMonth() === currentMonth.getMonth()
                      );
                    });

                    return (
                      <button
                        key={day}
                        disabled={isPast}
                        onClick={() => setSelectedCalDate(cellDate)}
                        className={`
                          py-3 rounded-2xl text-sm font-bold transition-all relative border
                          ${isPast ? "text-mf-text-secondary/30 cursor-not-allowed border-transparent bg-black/10" : "text-white border-transparent hover:border-white/10 bg-white/5 hover:bg-white/10"}
                          ${isSelected ? "!bg-mf-accent !border-mf-accent text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]" : ""}
                        `}
                      >
                        {day}
                        {hasEvent && !isPast && (
                          <div
                            className={`absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${isSelected ? "bg-white" : "bg-mf-accent"}`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-black text-mf-text-secondary uppercase tracking-[0.2em] px-1 mb-4 flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  Events on{" "}
                  {selectedCalDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </h3>
                {monthEvents.filter((e) => {
                  const eDate = new Date(e.start_time);
                  return (
                    eDate.getDate() === selectedCalDate.getDate() &&
                    eDate.getMonth() === selectedCalDate.getMonth() &&
                    eDate.getFullYear() === selectedCalDate.getFullYear()
                  );
                }).length === 0 ? (
                  <div className="p-8 rounded-[24px] bg-[#111827]/50 border border-dashed border-[#1F2937] text-center shadow-lg">
                    <p className="text-mf-text-secondary text-sm font-medium">
                      No events scheduled for this day.
                    </p>
                  </div>
                ) : (
                  monthEvents
                    .filter((e) => {
                      const eDate = new Date(e.start_time);
                      return (
                        eDate.getDate() === selectedCalDate.getDate() &&
                        eDate.getMonth() === selectedCalDate.getMonth() &&
                        eDate.getFullYear() === selectedCalDate.getFullYear()
                      );
                    })
                    .map((event: any) => (
                      <motion.div
                        key={event._id || event.id}
                        onClick={() => setSelectedEvent(event)}
                        className="p-5 rounded-2xl bg-[#111827] border border-[#1F2937] flex items-center gap-5 hover:border-mf-accent/40 hover:bg-white/[0.02] transition-all duration-300 ease-out group cursor-pointer shadow-lg"
                        whileHover={{ scale: 1.02 }}
                      >
                        <div
                          className="w-1.5 h-12 rounded-full"
                          style={{
                            backgroundColor: getEventTypeColor(event.type),
                            boxShadow: `0 0 10px ${getEventTypeColor(event.type)}80`,
                          }}
                        />
                        <div className="flex-1">
                          <p className="font-bold text-white text-lg group-hover:text-mf-accent transition-colors">
                            {event.title}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <p className="text-xs text-mf-text-secondary flex items-center gap-1.5 font-medium">
                              <Clock className="w-3.5 h-3.5" />
                              {formatTime(event.start_time)}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="text-[9px] px-2.5 py-1 rounded-md bg-white/5 text-mf-text-secondary font-black uppercase tracking-[0.1em] border border-white/5">
                            {event.type || "other"}
                          </span>
                        </div>
                      </motion.div>
                    ))
                )}
              </div>
            </motion.div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-[#111827] border border-[#1F2937] rounded-[24px] p-6 shadow-xl">
            <h2 className="text-sm font-black text-white uppercase tracking-[0.1em] mb-5">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 gap-3">
              <QuickActionButton
                href="/events"
                icon={<Plus />}
                label="New Event"
                desc="Schedule manual entry"
                color="text-mf-accent"
              />
              <QuickActionButton
                href="/accounts"
                icon={<Users />}
                label="Sync Accounts"
                desc="Connect Gmail/Outlook"
                color="text-purple-400"
              />
            </div>
          </div>

          <div className="p-6 rounded-[24px] bg-mf-accent/5 border border-mf-accent/20 relative overflow-hidden shadow-xl">
            <div className="absolute -right-4 -bottom-4 opacity-10 pointer-events-none">
              <Zap className="w-32 h-32 text-mf-accent fill-mf-accent" />
            </div>
            <h3 className="text-sm font-black text-mf-accent-light uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
              <BrainCircuit className="w-4 h-4" /> Agent Tip
            </h3>
            <p className="text-sm text-white/80 leading-relaxed relative z-10 font-medium">
              Your Scheduler Agent noticed you are most productive on Tuesday
              mornings. Consider blocking this time for deep work.
            </p>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, ...springConfig }}
        className="mb-8"
      >
        {user.plan === "free" ? (
          <div className="p-8 md:p-10 rounded-[32px] bg-gradient-to-br from-[#111827] to-[#0B0F1A] border border-[#1F2937] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-mf-accent opacity-10 blur-[120px] pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
              <div className="flex-1 max-w-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-2 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />{" "}
                    Free Tier
                  </span>
                </div>

                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
                  Unlock the{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-mf-accent-light to-mf-accent">
                    Full AI Swarm
                  </span>
                </h2>

                <p className="text-mf-text-secondary text-base leading-relaxed mb-8">
                  You are currently on the Free plan. Upgrade to the Knight Tier
                  to remove account limitations and activate priority
                  processing.
                </p>

                <div className="bg-[#1A2333] rounded-2xl p-5 border border-white/5 mb-8">
                  <div className="flex justify-between items-end mb-3">
                    <div>
                      <p className="text-xs text-mf-text-secondary font-black uppercase tracking-widest mb-1">
                        Accounts Connected
                      </p>
                      <p className="text-white font-bold">
                        <span className="text-2xl">{accountCount}</span>{" "}
                        <span className="text-mf-text-secondary">
                          / {maxAccounts} Limit
                        </span>
                      </p>
                    </div>
                    {accountCount >= maxAccounts && (
                      <span className="text-amber-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Max Reached
                      </span>
                    )}
                  </div>
                  <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden border border-white/5 mb-4">
                    <motion.div
                      className={`h-full rounded-full ${accountCount >= maxAccounts ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" : "bg-mf-accent shadow-[0_0_10px_rgba(59,130,246,0.5)]"}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${accountPercentage}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-mf-accent/10 flex items-center justify-center shrink-0">
                      <Unlock className="w-4 h-4 text-mf-accent" />
                    </div>
                    <span className="text-sm font-medium text-white/90">
                      Connect up to 7 Accounts
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-mf-accent/10 flex items-center justify-center shrink-0">
                      <Zap className="w-4 h-4 text-mf-accent" />
                    </div>
                    <span className="text-sm font-medium text-white/90">
                      Priority AI Processing
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-mf-accent/10 flex items-center justify-center shrink-0">
                      <BrainCircuit className="w-4 h-4 text-mf-accent" />
                    </div>
                    <span className="text-sm font-medium text-white/90">
                      Pinecone Memory Active
                    </span>
                  </div>
                </div>
              </div>

              <div className="shrink-0 flex flex-col items-center p-8 bg-black/20 rounded-[24px] border border-white/5 backdrop-blur-md">
                <div className="text-center mb-6">
                  <p className="text-mf-text-secondary text-xs font-black uppercase tracking-widest mb-2">
                    Knight Tier
                  </p>
                  <div className="flex items-start justify-center gap-1">
                    <span className="text-2xl text-white font-bold mt-1">
                      $
                    </span>
                    <span className="text-6xl font-black text-white tracking-tighter">
                      100
                    </span>
                  </div>
                  <p className="text-mf-text-secondary text-xs mt-1">
                    per month
                  </p>
                </div>
                <button
                  onClick={handleUpgrade}
                  disabled={isCheckoutLoading}
                  className="w-full px-8 py-4 bg-mf-accent hover:bg-mf-accent-hover text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group"
                >
                  {isCheckoutLoading ? (
                    "Securing Checkout..."
                  ) : (
                    <>
                      Upgrade Now{" "}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 md:p-12 rounded-[32px] bg-gradient-to-br from-indigo-900/40 via-[#111827] to-[#0B0F1A] border border-indigo-500/30 shadow-[0_0_50px_rgba(99,102,241,0.15)] relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-indigo-500 opacity-15 blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-mf-accent opacity-10 blur-[100px] pointer-events-none translate-x-1/3 translate-y-1/3" />

            <div className="relative z-10 max-w-2xl">
              <div className="flex items-center gap-3 mb-6">
                <span className="px-4 py-2 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-xs font-black uppercase tracking-widest text-indigo-300 flex items-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                  <Crown className="w-4 h-4" /> Knight Tier Active
                </span>
              </div>
              <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">
                You have maximum clearance.
              </h2>
              <p className="text-indigo-200/70 text-lg leading-relaxed mb-8">
                Your AI Swarm is operating at full capacity with priority
                routing and persistent long-term memory.
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 bg-black/20 p-4 rounded-2xl border border-white/5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-bold text-white">
                    Up to 7 Connected Accounts
                  </span>
                </div>
                <div className="flex items-center gap-3 bg-black/20 p-4 rounded-2xl border border-white/5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-bold text-white">
                    Priority Conflict Resolution
                  </span>
                </div>
                <div className="flex items-center gap-3 bg-black/20 p-4 rounded-2xl border border-white/5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-bold text-white">
                    Pinecone Deep Memory
                  </span>
                </div>
                <div className="flex items-center gap-3 bg-black/20 p-4 rounded-2xl border border-white/5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-bold text-white">
                    Premium Email Parsing
                  </span>
                </div>
              </div>
            </div>

            <div className="relative z-10 shrink-0 w-full md:w-64 bg-black/30 p-6 rounded-3xl border border-white/10 backdrop-blur-md">
              <div className="text-center mb-4">
                <p className="text-xs text-mf-text-secondary font-black uppercase tracking-widest mb-1">
                  Account Limit
                </p>
                <p className="text-3xl font-bold text-white">
                  {accountCount}{" "}
                  <span className="text-lg text-mf-text-secondary">
                    / {maxAccounts}
                  </span>
                </p>
              </div>
              <div className="w-full h-3 bg-black/50 rounded-full overflow-hidden border border-white/5 mb-4">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-mf-accent shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${accountPercentage}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
              <p className="text-[10px] text-center text-mf-text-secondary uppercase tracking-wider font-bold">
                {maxAccounts - accountCount} slots remaining
              </p>
            </div>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {selectedEvent && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedEvent(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={springConfig}
              className="relative w-full max-w-lg bg-[#0B0F1A] border border-[#1F2937] rounded-[28px] p-8 shadow-2xl"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-mf-accent/10 border border-mf-accent/20 rounded-2xl">
                  <Info className="w-6 h-6 text-mf-accent" />
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="p-2 hover:bg-white/5 rounded-xl text-mf-text-secondary hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-8">
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-2xl font-bold text-white leading-tight">
                    {selectedEvent.title}
                  </h2>
                  {selectedEvent.type && (
                    <span className="text-[10px] px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-mf-text-secondary uppercase font-black tracking-widest shrink-0">
                      {selectedEvent.type}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-mf-accent font-bold">
                  <CalendarIcon className="w-4 h-4" />
                  {formatDate(selectedEvent.start_time)}
                </div>
              </div>

              <div className="space-y-4 text-sm">
                <div className="flex items-center gap-4 p-4 bg-[#111827] rounded-2xl border border-[#1F2937]">
                  <Clock className="w-5 h-5 text-mf-text-secondary" />
                  <span className="text-white font-bold tracking-wide">
                    {formatTime(selectedEvent.start_time)} -{" "}
                    {formatTime(selectedEvent.end_time)}
                  </span>
                </div>

                {selectedEvent.location && (
                  <div className="flex items-center gap-4 p-4 bg-[#111827] rounded-2xl border border-[#1F2937]">
                    <MapPin className="w-5 h-5 text-mf-text-secondary" />
                    <span className="text-white font-medium">
                      {selectedEvent.location}
                    </span>
                  </div>
                )}

                {selectedEvent.meeting_link && (
                  <div className="flex items-center gap-4 p-4 bg-[#111827] rounded-2xl border border-[#1F2937]">
                    <Video className="w-5 h-5 text-mf-text-secondary" />
                    <a
                      href={selectedEvent.meeting_link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-mf-accent hover:text-mf-accent-light hover:underline break-all font-medium transition-colors"
                    >
                      {selectedEvent.meeting_link}
                    </a>
                  </div>
                )}

                {selectedEvent.description && (
                  <div className="p-5 bg-[#111827] rounded-2xl border border-[#1F2937]">
                    <div className="flex items-center gap-2 mb-3 text-xs font-black uppercase tracking-widest text-mf-text-secondary">
                      <AlignLeft className="w-4 h-4" /> Description
                    </div>
                    <p className="text-white/80 leading-relaxed whitespace-pre-wrap font-medium text-sm">
                      {selectedEvent.description}
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelectedEvent(null)}
                className="w-full mt-8 py-4 bg-white/5 hover:bg-white/10 border border-white/5 text-white font-bold tracking-wide rounded-xl transition-all active:scale-95"
              >
                Close Summary
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function QuickActionButton({ href, icon, label, desc, color }: any) {
  return (
    <Link href={href} className="block">
      <motion.div
        className="p-4 rounded-[16px] bg-[#111827] border border-[#1F2937] flex items-center gap-4 hover:border-white/10 hover:bg-white/[0.02] transition-all duration-300 ease-out cursor-pointer group shadow-lg"
        whileHover={{ scale: 1.03 }}
      >
        <div
          className={`p-3 rounded-xl bg-white/5 border border-white/5 ${color} group-hover:scale-110 transition-transform`}
        >
          {icon}
        </div>
        <div>
          <p className="font-bold text-white mb-0.5">{label}</p>
          <p className="text-[10px] uppercase font-bold tracking-widest text-mf-text-secondary">
            {desc}
          </p>
        </div>
      </motion.div>
    </Link>
  );
}
