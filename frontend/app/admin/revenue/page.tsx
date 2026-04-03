"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi } from "@/lib/api";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  BarChart3,
  Bug,
  Cpu,
  Activity,
  ShieldCheck,
  Zap,
  DollarSign,
  TrendingUp,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock,
  Wallet,
  Users,
} from "lucide-react";
import { formatDate, formatTime } from "@/lib/utils";

const springConfig = { type: "spring", stiffness: 120, damping: 20 } as const;

export default function AdminRevenuePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [hoveredMonth, setHoveredMonth] = useState<any>(null);
  const [viewFullLedger, setViewFullLedger] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === "admin") {
      adminApi
        .revenue()
        .then((res) => setData(res.data))
        .catch((err) => console.error("Failed to load revenue data", err))
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (authLoading || !user || user.role !== "admin") return null;

  const metrics = data || {
    mrr: 0,
    arr: 0,
    arpu: 0,
    churnRate: 0,
    totalCustomers: 0,
    growthMoM: 0,
  };
  const history = data?.history || [];
  const transactions = data?.recent_transactions || [];

  const displayedTransactions = viewFullLedger
    ? transactions
    : transactions.slice(0, 5);

  const maxRevenue = Math.max(
    ...(history.length ? history.map((d: any) => d.revenue) : [1000]),
  );
  const maxAxis = maxRevenue === 0 ? 1000 : maxRevenue;

  return (
    <div
      className="max-w-[1200px] mx-auto px-6 lg:px-8 py-8"
      data-testid="admin-revenue-dashboard"
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
            Revenue Intelligence
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-xs font-bold text-mf-text-secondary uppercase tracking-widest">
              Live Financial Data
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
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8"
      >
        <KpiCard
          label="Monthly Recurring (MRR)"
          value={`$${metrics.mrr.toLocaleString()}`}
          trend={
            metrics.growthMoM >= 0
              ? `+${metrics.growthMoM}%`
              : `${metrics.growthMoM}%`
          }
          trendUp={metrics.growthMoM >= 0}
          icon={<DollarSign className="w-5 h-5 text-emerald-400" />}
          bg="bg-emerald-400/10"
          border="border-emerald-400/20"
        />
        <KpiCard
          label="Annual Run Rate (ARR)"
          value={`$${(metrics.arr / 1000).toFixed(1)}k`}
          trend="+15.2%"
          trendUp={true}
          icon={<TrendingUp className="w-5 h-5 text-blue-400" />}
          bg="bg-blue-400/10"
          border="border-blue-400/20"
        />
        <KpiCard
          label="Avg Revenue Per User"
          value={`$${metrics.arpu}`}
          trend="+2.1%"
          trendUp={true}
          icon={<Users className="w-5 h-5 text-purple-400" />}
          bg="bg-purple-400/10"
          border="border-purple-400/20"
        />
        <KpiCard
          label="Gross Churn Rate"
          value={`${metrics.churnRate}%`}
          trend="-0.3%"
          trendUp={true}
          icon={<Activity className="w-5 h-5 text-amber-400" />}
          bg="bg-amber-400/10"
          border="border-amber-400/20"
        />
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8 pb-20">
        <div className="lg:col-span-2 bg-[#111827] border border-[#1F2937] rounded-[24px] p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-emerald-400" /> Revenue
                Trajectory
              </h2>
              <p className="text-xs text-mf-text-secondary mt-1">
                6-Month historical gross revenue vs operational expenses.
              </p>
            </div>
            <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white">
              YTD:{" "}
              <span className="text-emerald-400">
                ${metrics.arr.toLocaleString()}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="flex-1 min-h-[300px] flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="relative flex-1 min-h-[300px] mt-auto">
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8">
                {[maxAxis, maxAxis * 0.66, maxAxis * 0.33, 0].map((val, i) => (
                  <div
                    key={i}
                    className="border-b border-white/5 w-full h-0 flex items-center relative"
                  >
                    <span className="text-[10px] text-mf-text-secondary font-bold absolute -top-2.5 bg-[#111827] pr-2">
                      ${(val / 1000).toFixed(1)}k
                    </span>
                  </div>
                ))}
              </div>

              <div className="absolute inset-0 flex items-end justify-between pl-12 pb-8 pr-2 gap-2 sm:gap-6 z-10">
                {history.map((data: any, i: number) => {
                  const revHeight = (data.revenue / maxAxis) * 100;
                  const expHeight = (data.expenses / maxAxis) * 100;
                  const isFarRight = i >= history.length - 2;

                  return (
                    <div
                      key={i}
                      className="relative flex flex-col items-center justify-end w-full h-full group"
                      onMouseEnter={() => setHoveredMonth(data)}
                      onMouseLeave={() => setHoveredMonth(null)}
                    >
                      <AnimatePresence>
                        {hoveredMonth?.month === data.month && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className={`absolute bottom-full mb-4 w-max px-4 py-3 bg-[#1F2937] border border-white/10 rounded-xl shadow-2xl z-50 pointer-events-none ${isFarRight ? "right-0" : "left-1/2 -translate-x-1/2"}`}
                          >
                            <p className="text-xs font-bold text-white mb-2 pb-2 border-b border-white/10">
                              {data.month} 2026
                            </p>
                            <div className="flex justify-between gap-6 mb-1">
                              <span className="text-[10px] text-mf-text-secondary uppercase font-bold">
                                Gross
                              </span>
                              <span className="text-xs font-black text-emerald-400">
                                ${data.revenue.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between gap-6">
                              <span className="text-[10px] text-mf-text-secondary uppercase font-bold">
                                Expenses
                              </span>
                              <span className="text-xs font-black text-red-400">
                                ${data.expenses.toLocaleString()}
                              </span>
                            </div>
                            <div
                              className={`absolute top-full border-4 border-transparent border-t-[#1F2937] ${isFarRight ? "right-4" : "left-1/2 -translate-x-1/2"}`}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="relative w-full max-w-[40px] h-full flex items-end justify-center">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${revHeight}%` }}
                          transition={{ duration: 1, delay: i * 0.1 }}
                          className={`absolute bottom-0 w-full rounded-t-md transition-colors duration-300 ${hoveredMonth?.month === data.month ? "bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.4)]" : "bg-emerald-500/80 hover:bg-emerald-400"}`}
                        />
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${expHeight}%` }}
                          transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                          className="absolute bottom-0 w-1/2 rounded-t-sm bg-red-500/80 z-10"
                        />
                      </div>

                      <span className="absolute -bottom-6 text-[10px] font-bold text-mf-text-secondary uppercase tracking-widest">
                        {data.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
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
              <CreditCard className="w-4 h-4 text-mf-accent" /> Plan
              Distribution
            </h3>

            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />{" "}
                    Business ($100/mo)
                  </span>
                  <span className="text-sm font-black text-white">41%</span>
                </div>
                <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "41%" }}
                    transition={{ duration: 1, delay: 0.4 }}
                    className="h-full bg-purple-500 rounded-full"
                  />
                </div>
                <p className="text-[10px] text-mf-text-secondary font-bold tracking-widest mt-2">
                  412 USERS • $41,200 MRR
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" /> Pro
                    ($20/mo)
                  </span>
                  <span className="text-sm font-black text-white">59%</span>
                </div>
                <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "59%" }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-full bg-blue-500 rounded-full"
                  />
                </div>
                <p className="text-[10px] text-mf-text-secondary font-bold tracking-widest mt-2">
                  592 USERS • $11,840 MRR
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-[#111827] border border-[#1F2937] rounded-[24px] overflow-hidden shadow-xl"
      >
        <div className="p-6 border-b border-[#1F2937] flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-mf-text-secondary" /> Recent
            Transactions
          </h3>
          <button
            onClick={() => setViewFullLedger(!viewFullLedger)}
            className="text-xs font-bold text-mf-accent hover:text-mf-accent-light transition-colors outline-none"
          >
            {viewFullLedger ? "Show Less" : "View Full Ledger \u2192"}
          </button>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-mf-text-secondary text-sm animate-pulse">
              Loading Ledger...
            </div>
          ) : displayedTransactions.length === 0 ? (
            <div className="p-8 text-center text-mf-text-secondary text-sm">
              No transactions found.
            </div>
          ) : (
            <motion.table layout className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/20 border-b border-[#1F2937] text-[10px] uppercase tracking-widest text-mf-text-secondary">
                  <th className="px-6 py-4 font-black">Customer</th>
                  <th className="px-6 py-4 font-black">Invoice</th>
                  <th className="px-6 py-4 font-black">Plan</th>
                  <th className="px-6 py-4 font-black">Amount</th>
                  <th className="px-6 py-4 font-black">Status</th>
                  <th className="px-6 py-4 font-black text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2937]/50">
                <AnimatePresence>
                  {displayedTransactions.map((tx: any, idx: number) => (
                    <motion.tr
                      key={tx.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: idx * 0.05 }}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-white group-hover:text-mf-accent transition-colors">
                          {tx.user}
                        </p>
                        <p className="text-xs text-mf-text-secondary">
                          {tx.email}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs text-mf-text-secondary">
                          {tx.invoice}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${tx.plan === "Business" || tx.plan === "paid" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20"}`}
                        >
                          {tx.plan === "paid" ? "Business" : tx.plan}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-black text-white">
                          ${tx.amount.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {tx.status === "success" ? (
                          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                            <CheckCircle2 className="w-4 h-4" /> Paid
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-xs font-bold text-red-400">
                            <Activity className="w-4 h-4" /> Failed
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-xs font-bold text-white">
                          {formatDate(tx.date)}
                        </p>
                        <p className="text-[10px] text-mf-text-secondary">
                          {formatTime(tx.date)}
                        </p>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </motion.table>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function KpiCard({ label, value, trend, trendUp, icon, bg, border }: any) {
  return (
    <div
      className={`bg-[#111827] border border-[#1F2937] rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-white/10 transition-colors`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className={`p-2.5 rounded-xl ${bg} ${border} border`}>{icon}</div>
        <div
          className={`flex items-center gap-1 text-[10px] font-black tracking-widest px-2 py-1 rounded-lg border ${trendUp ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/20" : "bg-red-400/10 text-red-400 border-red-400/20"}`}
        >
          {trendUp ? (
            <ArrowUpRight className="w-3 h-3" />
          ) : (
            <ArrowDownRight className="w-3 h-3" />
          )}
          {trend}
        </div>
      </div>

      <div className="relative z-10">
        <p className="text-3xl font-black text-white mb-1 tracking-tight">
          {value}
        </p>
        <p className="text-[10px] font-bold text-mf-text-secondary uppercase tracking-widest">
          {label}
        </p>
      </div>
    </div>
  );
}
