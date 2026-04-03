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
  ChevronDown,
  CreditCard,
  TrendingUp,
  Mail,
  CalendarDays,
  CheckCircle2,
  Star,
  Clock,
  Filter,
  AlertCircle,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

const springConfig = { type: "spring", stiffness: 120, damping: 20 } as const;

interface SyncedAccount {
  _id: string;
  email: string;
  events_from_mail: number;
  events_from_calendar: number;
  last_sync: string;
  status: "active" | "warning" | "failed";
}

interface PaidUser {
  _id: string;
  name: string;
  email: string;
  plan: "Pro" | "Business" | string;
  mrr: number;
  ltv: number;
  total_events: number;
  engagement_score: number;
  created_at: string;
  synced_accounts: SyncedAccount[];
}

export default function PremiumPaidUsersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [usersList, setUsersList] = useState<PaidUser[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"ltv" | "mrr" | "events" | "engagement">(
    "ltv",
  );
  const [filterPlan, setFilterPlan] = useState<"All" | "Pro" | "Business">(
    "All",
  );

  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin"))
      router.push("/dashboard");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === "admin") {
      adminApi
        .users("paid")
        .then((res) => setUsersList(res.data))
        .catch((err) => console.error("Failed to load paid users", err))
        .finally(() => setLoading(false));
    }
  }, [user]);

  const processedUsers = useMemo(() => {
    return usersList
      .filter((u) => filterPlan === "All" || u.plan === filterPlan)
      .filter(
        (u) =>
          u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      .sort((a, b) => {
        if (sortBy === "ltv") return b.ltv - a.ltv;
        if (sortBy === "mrr") return b.mrr - a.mrr;
        if (sortBy === "events") return b.total_events - a.total_events;
        return b.engagement_score - a.engagement_score;
      });
  }, [usersList, searchTerm, sortBy, filterPlan]);

  if (authLoading || !user || user.role !== "admin") return null;

  return (
    <div className="max-w-[1200px] mx-auto px-6 lg:px-8 py-8">
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
            Premium Subscriptions
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-xs font-bold text-mf-text-secondary uppercase tracking-widest">
              Revenue Explorer Active
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
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-8 bg-[#111827]/80 p-4 rounded-2xl border border-[#1F2937] backdrop-blur-xl shadow-xl z-20 relative"
      >
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-mf-text-secondary" />
          <input
            type="text"
            placeholder="Search premium accounts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/20 border border-white/5 text-white text-sm rounded-xl pl-11 pr-4 py-2.5 focus:outline-none focus:border-mf-accent/50 transition-colors placeholder:text-mf-text-secondary/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="relative">
            <button
              onClick={() => {
                setFilterDropdownOpen(!filterDropdownOpen);
                setSortDropdownOpen(false);
              }}
              className="flex items-center justify-between min-w-[140px] bg-black/20 hover:bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white font-semibold transition-colors"
            >
              <span className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-mf-text-secondary" />{" "}
                {filterPlan === "All" ? "All Plans" : filterPlan}
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
                    className="absolute top-full left-0 mt-2 w-full bg-[#1F2937] border border-white/10 rounded-xl shadow-2xl z-20 overflow-hidden"
                  >
                    {["All", "Pro", "Business"].map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          setFilterPlan(option as any);
                          setFilterDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm transition-colors ${filterPlan === option ? "bg-mf-accent/20 text-mf-accent-light font-bold" : "text-white hover:bg-white/5"}`}
                      >
                        {option === "All" ? "All Plans" : option}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <div className="relative">
            <button
              onClick={() => {
                setSortDropdownOpen(!sortDropdownOpen);
                setFilterDropdownOpen(false);
              }}
              className="flex items-center justify-between min-w-[180px] bg-black/20 hover:bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white font-semibold transition-colors"
            >
              <span className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-mf-text-secondary" />
                {sortBy === "ltv" && "Sort by LTV"}
                {sortBy === "mrr" && "Sort by MRR"}
                {sortBy === "events" && "Sort by Events"}
                {sortBy === "engagement" && "Sort by Engagement"}
              </span>
              <ChevronDown className="w-4 h-4 text-mf-text-secondary" />
            </button>
            <AnimatePresence>
              {sortDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setSortDropdownOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute top-full left-0 right-0 mt-2 w-full min-w-max bg-[#1F2937] border border-white/10 rounded-xl shadow-2xl z-20 overflow-hidden"
                  >
                    {[
                      { id: "ltv", label: "Sort by LTV" },
                      { id: "mrr", label: "Sort by MRR" },
                      { id: "events", label: "Sort by Total Events" },
                      { id: "engagement", label: "Sort by Engagement" },
                    ].map((option) => (
                      <button
                        key={option.id}
                        onClick={() => {
                          setSortBy(option.id as any);
                          setSortDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm transition-colors ${sortBy === option.id ? "bg-mf-accent/20 text-mf-accent-light font-bold" : "text-white hover:bg-white/5"}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      <div className="space-y-6 pb-20 relative z-0">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 bg-[#111827] rounded-3xl border border-[#1F2937] animate-pulse"
            />
          ))
        ) : (
          <AnimatePresence mode="popLayout">
            {processedUsers.map((user, i) => (
              <PremiumUserCard key={user._id} user={user} index={i} />
            ))}
            {processedUsers.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20 text-mf-text-secondary"
              >
                No premium accounts match your criteria.
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

function PremiumUserCard({ user, index }: { user: PaidUser; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const isBusiness = user.plan?.toLowerCase() === "business";

  const badgeColors = isBusiness
    ? "bg-purple-500/10 border-purple-500/30 text-purple-400"
    : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400";
  const glowColor = isBusiness ? "bg-purple-500/20" : "bg-emerald-500/20";

  const handleForceSync = async (accountId: string) => {
    setSyncingId(accountId);
    try {
      await accountsApi.syncCalendar(accountId);
    } catch (err) {
      console.error("Sync failed:", err);
    } finally {
      setSyncingId(null);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ ...springConfig, delay: index * 0.05 }}
      className={`relative rounded-3xl border overflow-hidden transition-all duration-500 ${
        expanded
          ? "bg-[#111827] border-white/20 shadow-2xl"
          : "bg-[#111827]/80 border-[#1F2937] hover:border-white/10"
      }`}
    >
      <div
        className={`absolute -right-20 -top-20 w-64 h-64 blur-[80px] rounded-full pointer-events-none transition-opacity duration-500 ${expanded ? glowColor : "opacity-0"}`}
      />

      <div
        onClick={() => setExpanded(!expanded)}
        className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between p-6 cursor-pointer gap-6"
      >
        <div className="flex items-center gap-5 w-full lg:w-auto">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black shadow-lg ${badgeColors}`}
          >
            {user.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-xl font-bold text-white tracking-tight">
                {user.name}
              </h3>
              <span
                className={`px-2.5 py-0.5 rounded-lg text-[10px] uppercase tracking-widest font-black border ${badgeColors}`}
              >
                {user.plan}
              </span>
            </div>
            <p className="text-sm text-mf-text-secondary">{user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-8 w-full lg:w-auto items-center">
          <div className="text-center lg:text-right">
            <p className="text-[10px] text-mf-text-secondary uppercase font-bold tracking-widest mb-1">
              Monthly Revenue
            </p>
            <p className="text-2xl font-black text-white">${user.mrr}</p>
          </div>
          <div className="text-center lg:text-right border-l border-white/5 pl-8">
            <p
              className="text-[10px] text-mf-text-secondary uppercase font-bold tracking-widest mb-1"
              title="Lifetime Value (Total Spent)"
            >
              Total Paid (LTV)
            </p>
            <p className="text-2xl font-black text-white">${user.ltv}</p>
          </div>
          <div className="text-center lg:text-right border-l border-white/5 pl-8 flex items-center gap-6">
            <div>
              <p className="text-[10px] text-mf-text-secondary uppercase font-bold tracking-widest mb-1">
                Total Events
              </p>
              <p className="text-2xl font-black text-white">
                {user.total_events}
              </p>
            </div>
            <motion.button
              animate={{ rotate: expanded ? 180 : 0 }}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors"
            >
              <ChevronDown className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="relative z-10 border-t border-white/10 bg-black/40"
          >
            <div className="p-8 space-y-10">
              <section>
                <h4 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-mf-text-secondary" />{" "}
                  Account Details
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                    <p className="text-xs text-mf-text-secondary mb-1">
                      Account Created
                    </p>
                    <p className="text-sm font-bold text-white">
                      {formatDate(user.created_at)}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-mf-text-secondary mb-1">
                        Status
                      </p>
                      <p className="text-sm font-bold text-white">
                        Active Subscription
                      </p>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                </div>
              </section>

              <section>
                <h4 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-mf-text-secondary" /> Usage
                  & Engagement
                </h4>
                <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-white">
                      Platform Engagement Score
                    </span>
                    <span className="text-sm font-black text-white flex items-center gap-1">
                      {user.engagement_score} / 100{" "}
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    </span>
                  </div>
                  <div className="w-full h-3 bg-black/50 rounded-full overflow-hidden mb-6">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${user.engagement_score}%` }}
                      transition={{ duration: 1, delay: 0.2 }}
                      className={`h-full rounded-full ${isBusiness ? "bg-purple-500" : "bg-emerald-500"}`}
                    />
                  </div>
                  <p className="text-xs text-mf-text-secondary leading-relaxed">
                    Based on calendar interaction frequency, orchestration
                    requests, and overall activity in the last 30 days.
                  </p>
                </div>
              </section>

              <section>
                <h4 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 text-mf-text-secondary" /> Synced
                  Accounts Integrations
                </h4>
                <div className="space-y-4">
                  {user.synced_accounts.length === 0 ? (
                    <div className="text-sm text-mf-text-secondary italic p-4">
                      No external accounts synced.
                    </div>
                  ) : (
                    user.synced_accounts.map((acc) => (
                      <div
                        key={acc._id}
                        className="p-5 rounded-2xl bg-black/20 border border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden group"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/[0.02] to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                            <Mail className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">
                              {acc.email}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span
                                className={`w-2 h-2 rounded-full ${acc.status === "active" ? "bg-emerald-500" : "bg-amber-500"}`}
                              />
                              <p className="text-xs text-mf-text-secondary">
                                {acc.status === "active"
                                  ? "Sync Active"
                                  : "Requires Re-Auth"}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-8">
                          <div>
                            <p className="text-[10px] text-mf-text-secondary uppercase font-bold tracking-widest mb-1 flex items-center gap-1.5">
                              <Mail className="w-3 h-3" /> Via Mail
                            </p>
                            <p className="text-xl font-black text-white">
                              {acc.events_from_mail}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-mf-text-secondary uppercase font-bold tracking-widest mb-1 flex items-center gap-1.5">
                              <CalendarDays className="w-3 h-3" /> Via Cal
                            </p>
                            <p className="text-xl font-black text-white">
                              {acc.events_from_calendar}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <button
                            onClick={() => handleForceSync(acc._id)}
                            disabled={syncingId === acc._id}
                            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors flex items-center gap-2 outline-none disabled:opacity-50"
                          >
                            <RefreshCwIcon
                              className={`w-3 h-3 ${syncingId === acc._id ? "animate-spin text-mf-accent" : ""}`}
                            />
                            {syncingId === acc._id
                              ? "Syncing..."
                              : "Force Sync"}
                          </button>
                          <p className="text-[10px] text-mf-text-secondary flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Last:{" "}
                            {formatDate(acc.last_sync)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function RefreshCwIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}
