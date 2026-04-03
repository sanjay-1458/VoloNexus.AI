"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi } from "@/lib/api";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Bug,
  AlertTriangle,
  CheckCircle,
  Clock,
  Trash2,
  ShieldCheck,
  ExternalLink,
  Filter,
  BarChart3,
  Cpu,
  Activity,
  ChevronDown,
  Image as ImageIcon,
  X,
} from "lucide-react";

const springConfig = { type: "spring", stiffness: 120, damping: 20 } as const;

export default function AdminBugsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [bugs, setBugs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [selectedBug, setSelectedBug] = useState<any | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin"))
      router.push("/dashboard");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === "admin") {
      adminApi
        .bugs()
        .then(({ data }) => setBugs(data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await adminApi.updateBugStatus(id, status);
      setBugs(bugs.map((b) => (b.id === id ? { ...b, status } : b)));
      if (selectedBug?.id === id) setSelectedBug({ ...selectedBug, status });
    } catch (err) {
      console.error(err);
    }
  };

  const deleteBug = async (id: string) => {
    try {
      await adminApi.deleteBug(id);
      setBugs(bugs.filter((b) => b.id !== id));
      if (selectedBug?.id === id) setSelectedBug(null);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredBugs = useMemo(() => {
    if (statusFilter === "all") return bugs;
    return bugs.filter((bug) => bug.status === statusFilter);
  }, [bugs, statusFilter]);

  if (authLoading || !user) return null;

  const getSeverityStyle = (s: string) => {
    switch (s) {
      case "critical":
        return "text-red-400 bg-red-400/10 border-red-500/20";
      case "high":
        return "text-orange-400 bg-orange-400/10 border-orange-500/20";
      default:
        return "text-mf-text-secondary bg-white/5 border-white/5";
    }
  };

  const filterOptions = [
    { id: "all", label: "All Statuses" },
    { id: "submitted", label: "New (Submitted)" },
    { id: "verified", label: "Verified" },
    { id: "resolved", label: "Resolved" },
    { id: "dismissed", label: "Dismissed" },
  ];

  return (
    <div
      className="max-w-[1200px] mx-auto px-6 lg:px-8 py-8"
      data-testid="admin-bugs-page"
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
            Bug Reports
          </h1>
          <p className="text-mf-text-secondary mt-2">
            Monitor and resolve platform issues reported by users.
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

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center justify-between mb-6 bg-[#111827]/80 p-4 rounded-2xl border border-[#1F2937] backdrop-blur-xl shadow-xl relative z-20"
      >
        <div className="text-sm font-bold text-white">
          Total Issues:{" "}
          <span className="text-mf-accent">{filteredBugs.length}</span>
        </div>

        <div className="relative">
          <button
            onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
            className="flex items-center justify-between w-[180px] bg-black/20 hover:bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white font-semibold transition-colors"
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
                        setStatusFilter(option.id);
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

      <div className="pb-20 relative z-0">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-28 w-full bg-mf-secondary/50 rounded-2xl animate-pulse border border-mf-border"
              />
            ))}
          </div>
        ) : filteredBugs.length === 0 ? (
          <motion.div
            className="text-center py-24 bg-[#111827] rounded-[24px] border border-[#1F2937] shadow-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <CheckCircle className="w-16 h-16 text-emerald-500/20 mx-auto mb-6" />
            <p className="text-mf-text-secondary text-lg font-medium">
              Clear Skies. No bugs match this filter.
            </p>
          </motion.div>
        ) : (
          <motion.div
            className="space-y-4"
            initial="initial"
            animate="animate"
            variants={{ animate: { transition: { staggerChildren: 0.05 } } }}
          >
            <AnimatePresence mode="popLayout">
              {filteredBugs.map((bug, i) => (
                <motion.div
                  key={bug.id}
                  layout
                  variants={{
                    initial: { opacity: 0, y: 20 },
                    animate: { opacity: 1, y: 0 },
                  }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={springConfig}
                  className="p-6 rounded-[16px] bg-[#111827] border border-[#1F2937] hover:border-white/10 transition-all flex flex-col md:flex-row md:items-center gap-6 group cursor-pointer"
                  onClick={() => setSelectedBug(bug)}
                >
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 ${getSeverityStyle(bug.severity)}`}
                  >
                    <Bug className="w-6 h-6" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-bold text-white text-lg truncate max-w-md group-hover:text-mf-accent transition-colors">
                        {bug.ai_summary || bug.description}
                      </h3>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-widest border ${getSeverityStyle(bug.severity)}`}
                      >
                        {bug.severity}
                      </span>
                      <span className="text-[9px] px-2 py-0.5 rounded bg-white/5 border border-white/5 text-mf-text-secondary font-black uppercase tracking-widest">
                        {bug.status}
                      </span>
                      {bug.screenshots?.length > 0 && (
                        <span className="text-[9px] px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 font-black uppercase tracking-widest flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" /> Image Attached
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-mf-text-secondary font-medium">
                      <span className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" /> Reported{" "}
                        {new Date(bug.created_at).toLocaleDateString()}
                      </span>
                      {bug.page_url && (
                        <span
                          className="flex items-center gap-2 text-mf-accent-light"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />{" "}
                          <a
                            href={bug.page_url}
                            target="_blank"
                            className="hover:underline"
                          >
                            {bug.page_url}
                          </a>
                        </span>
                      )}
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <AnimatePresence mode="wait">
                      {bug.status === "submitted" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateStatus(bug.id, "verified")}
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95"
                          >
                            Verify
                          </button>
                          <button
                            onClick={() => updateStatus(bug.id, "dismissed")}
                            className="px-4 py-2 bg-white/5 border border-white/10 text-mf-text-secondary hover:text-red-400 hover:bg-red-400/5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95"
                          >
                            Dismiss
                          </button>
                        </div>
                      )}
                      {bug.status === "verified" && (
                        <button
                          onClick={() => updateStatus(bug.id, "resolved")}
                          className="px-6 py-2 bg-mf-accent hover:bg-mf-accent-hover text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95 shadow-lg shadow-mf-accent/10"
                        >
                          Resolve
                        </button>
                      )}
                      {bug.status === "resolved" && (
                        <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs bg-emerald-400/5 px-4 py-2 rounded-lg border border-emerald-400/10">
                          <CheckCircle className="w-4 h-4" /> Fixed
                        </div>
                      )}
                    </AnimatePresence>
                    <button
                      onClick={() => deleteBug(bug.id)}
                      className="p-2 ml-2 rounded-lg text-mf-text-secondary hover:text-red-500 hover:bg-red-500/10 transition-colors"
                      title="Delete Bug"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {selectedBug && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedBug(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={springConfig}
              className="relative w-full max-w-2xl bg-[#0B0F1A] border border-[#1F2937] rounded-[24px] p-8 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center border ${getSeverityStyle(selectedBug.severity)}`}
                  >
                    <Bug className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white leading-tight">
                      Bug Details
                    </h2>
                    <p className="text-xs font-bold text-mf-text-secondary uppercase tracking-widest mt-1">
                      ID: {selectedBug.id.substring(0, 8)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedBug(null)}
                  className="p-2 hover:bg-white/5 rounded-xl text-mf-text-secondary hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6 text-sm">
                <div className="p-5 bg-[#111827] rounded-xl border border-[#1F2937]">
                  <h4 className="text-[10px] font-black text-mf-accent uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                    <Cpu className="w-3.5 h-3.5" /> AI Analysis
                  </h4>
                  <p className="text-white/90 font-medium text-base mb-3 leading-relaxed">
                    {selectedBug.ai_summary}
                  </p>
                  <p className="text-white/60 italic border-l-2 border-mf-text-secondary/30 pl-3">
                    " {selectedBug.ai_impact_analysis} "
                  </p>
                </div>

                <div>
                  <h4 className="text-[10px] font-black text-mf-text-secondary uppercase tracking-[0.2em] mb-2">
                    Original User Report
                  </h4>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5 text-white/80 whitespace-pre-wrap leading-relaxed">
                    {selectedBug.description}
                  </div>
                </div>

                {selectedBug.screenshots?.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-black text-mf-text-secondary uppercase tracking-[0.2em] mb-2">
                      Attached Media
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedBug.screenshots.map(
                        (url: string, idx: number) => (
                          <a
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="block rounded-xl overflow-hidden border border-white/10 hover:border-mf-accent transition-colors"
                          >
                            <img
                              src={url}
                              alt="Bug Screenshot"
                              className="w-full h-32 object-cover opacity-80 hover:opacity-100 transition-opacity"
                            />
                          </a>
                        ),
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                  <div>
                    <p className="text-[10px] font-black text-mf-text-secondary uppercase tracking-[0.2em] mb-1">
                      Status
                    </p>
                    <span className="text-xs px-2 py-1 rounded bg-white/5 text-white font-bold uppercase tracking-wider border border-white/10">
                      {selectedBug.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-mf-text-secondary uppercase tracking-[0.2em] mb-1">
                      Reported At
                    </p>
                    <p className="text-xs text-white font-medium">
                      {new Date(selectedBug.created_at).toLocaleString()}
                    </p>
                  </div>
                  {selectedBug.browser_info && (
                    <div className="col-span-2">
                      <p className="text-[10px] font-black text-mf-text-secondary uppercase tracking-[0.2em] mb-1">
                        Environment
                      </p>
                      <p className="text-xs text-white/70 font-mono bg-black/50 p-2 rounded-lg">
                        {selectedBug.browser_info}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
