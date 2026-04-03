"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi } from "@/lib/api";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Cpu,
  Zap,
  MessageSquare,
  Bell,
  BrainCircuit,
  Mic,
  BarChart3,
  Activity,
  Terminal,
  ShieldCheck,
  Bug,
  X,
} from "lucide-react";

const springConfig = { type: "spring", stiffness: 120, damping: 20 } as const;

const AGENT_META = [
  {
    id: "scheduler",
    name: "Scheduler",
    icon: Zap,
    desc: "Conflict detection, slot optimization, simulation sandbox",
    status: "active",
  },
  {
    id: "email",
    name: "Email",
    icon: MessageSquare,
    desc: "Parse emails, classify intent, and draft AI replies",
    status: "active",
  },
  {
    id: "notification",
    name: "Notification",
    icon: Bell,
    desc: "Channel selection logic: WhatsApp, Email, & Voice Push",
    status: "active",
  },
  {
    id: "context",
    name: "Context",
    icon: BrainCircuit,
    desc: "User habits, behavioral patterns, and Vector DB memory",
    status: "active",
  },
  {
    id: "voice",
    name: "Voice",
    icon: Mic,
    desc: "Voice command processing and Vision-to-Event parsing",
    status: "pending",
  },
  {
    id: "analytics",
    name: "Analytics",
    icon: BarChart3,
    desc: "Weekly PDF reports and user feedback summarization",
    status: "pending",
  },
  {
    id: "monitoring",
    name: "Monitoring",
    icon: Activity,
    desc: "API health checks, LLM metrics, and error tracking",
    status: "pending",
  },
];

export default function AdminAgentsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTerminal, setActiveTerminal] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin"))
      router.push("/dashboard");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === "admin") {
      adminApi
        .agentLogs()
        .then(({ data }) => setLogs(data?.logs || []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (authLoading || !user) return null;

  return (
    <div
      className="max-w-[1200px] mx-auto px-6 lg:px-8 py-8"
      data-testid="admin-agents-page"
    >
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={springConfig}
        >
          <div className="flex items-center gap-2 mb-2">
            <Terminal className="w-5 h-5 text-mf-accent" />
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-mf-accent">
              Agent Orchestration
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">
            AI Agent Infrastructure
          </h1>
          <p className="text-mf-text-secondary mt-3 max-w-2xl text-lg">
            Monitor the decision logs and reasoning transparency for the
            VoloNexus.AI autonomous swarm.
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
        className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        initial="initial"
        animate="animate"
        variants={{
          animate: { transition: { staggerChildren: 0.1 } },
        }}
      >
        {AGENT_META.map((agent, i) => (
          <motion.div
            key={agent.name}
            variants={{
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 },
            }}
            transition={springConfig}
            whileHover={{
              y: -4,
              rotateX: 2,
              rotateY: -2,
              scale: 1.02,
              boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
            }}
            className="p-6 rounded-[24px] bg-[#111827] border border-[#1F2937] hover:border-mf-accent/30 transition-all group relative overflow-hidden flex flex-col"
            data-testid={`agent-card-${i}`}
          >
            <div
              className={`absolute -right-4 -top-4 w-24 h-24 blur-3xl opacity-20 transition-opacity group-hover:opacity-40 pointer-events-none ${
                agent.status === "active" ? "bg-mf-accent" : "bg-amber-500"
              }`}
            />

            <div className="flex justify-between items-start mb-6 relative z-10">
              <div
                className={`p-3 rounded-2xl bg-mf-bg border border-white/5 ${
                  agent.status === "active"
                    ? "text-mf-accent"
                    : "text-mf-text-secondary"
                }`}
              >
                <agent.icon className="w-6 h-6" />
              </div>

              <div
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                  agent.status === "active"
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                }`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full ${agent.status === "active" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`}
                />
                {agent.status === "active" ? "Online" : "Pending"}
              </div>
            </div>

            <div className="relative z-10 flex-1 flex flex-col">
              <h3 className="text-xl font-bold text-white mb-2">
                {agent.name} Agent
              </h3>
              <p className="text-sm text-mf-text-secondary leading-relaxed mb-6 flex-1">
                {agent.desc}
              </p>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between mt-auto">
                <span className="text-[10px] font-bold text-mf-text-secondary uppercase tracking-widest">
                  Decision Logs
                </span>
                <button
                  onClick={() => setActiveTerminal(agent.id)}
                  disabled={agent.status !== "active"}
                  className="text-[10px] font-black uppercase tracking-widest text-mf-accent hover:text-mf-accent-light transition-colors outline-none disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  View Raw Stream
                </button>
              </div>
            </div>
          </motion.div>
        ))}

        <motion.div
          variants={{
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
          }}
          className="p-6 rounded-[24px] bg-mf-accent/5 border border-mf-accent/20 lg:col-span-2 flex flex-col md:flex-row items-center gap-8"
        >
          <div className="w-20 h-20 bg-mf-accent/10 rounded-3xl flex items-center justify-center shrink-0 border border-mf-accent/20">
            <ShieldCheck className="w-10 h-10 text-mf-accent" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-2">
              Agent Health & Compliance
            </h3>
            <p className="text-sm text-mf-text-secondary leading-relaxed">
              VoloNexus.AI agents operate under strict privacy constraints. No
              PII is stored within the decision logs. All Vector DB embeddings
              are isolated per user namespace and encrypted at rest.
            </p>
          </div>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {activeTerminal && (
          <TerminalModal
            agentId={activeTerminal}
            dbLogs={logs.filter(
              (l) => l.agent.toLowerCase() === activeTerminal.toLowerCase(),
            )}
            onClose={() => setActiveTerminal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function TerminalModal({
  agentId,
  dbLogs,
  onClose,
}: {
  agentId: string;
  dbLogs: any[];
  onClose: () => void;
}) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [displayLogs, setDisplayLogs] = useState<any[]>([]);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < dbLogs.length) {
        setDisplayLogs((prev) => [...prev, dbLogs[index]]);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 300);

    return () => clearInterval(interval);
  }, [dbLogs]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [displayLogs]);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
      />
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={springConfig}
        className="relative w-full max-w-4xl bg-[#0B0F1A] border border-[#1F2937] rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[600px] max-h-[80vh]"
      >
        <div className="bg-[#111827] border-b border-[#1F2937] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Terminal className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-white tracking-wider flex items-center gap-2">
                {agentId}-cluster{" "}
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </h3>
              <p className="text-[10px] text-mf-text-secondary uppercase font-mono tracking-widest mt-0.5">
                Live Database Stream
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg text-mf-text-secondary hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div
          ref={terminalRef}
          className="flex-1 p-6 overflow-y-auto font-mono text-sm leading-relaxed custom-scrollbar"
        >
          <div className="text-blue-400 font-bold mb-1.5">
            [sys] Connected to Mongo Monitoring Ledger...
          </div>
          <div className="text-purple-400 mb-1.5">
            [auth] Valid Admin Token Detected. Loading history for {agentId}.
          </div>
          <div className="text-gray-500 mb-4">
            --------------------------------------------------
          </div>

          {displayLogs.length === 0 && (
            <div className="text-gray-600 mb-1.5">
              No recent decision logs recorded for this agent in DB.
            </div>
          )}

          {displayLogs.map((log, i) => (
            <motion.div
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              key={i}
              className="mb-3 border-b border-white/5 pb-3"
            >
              <span className="text-emerald-400 font-bold">
                [{new Date(log.timestamp || Date.now()).toISOString()}]
              </span>
              <span className="text-white ml-2">Action: {log.decision}</span>
              <div className="text-mf-text-secondary mt-1 pl-4 border-l-2 border-white/10">
                Reasoning: {log.reasoning}
              </div>
            </motion.div>
          ))}
          <div className="w-2 h-4 bg-white/50 animate-pulse mt-2" />
        </div>
      </motion.div>
    </div>
  );
}
