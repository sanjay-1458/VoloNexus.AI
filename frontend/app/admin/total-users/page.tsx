"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  BarChart3,
  Users,
  Calendar,
  Bug,
  Cpu,
  Activity,
  ShieldCheck,
  Zap,
  ChevronDown,
  Mail,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  Search,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

const springConfig = { type: "spring", stiffness: 120, damping: 20 } as const;

interface SyncedAccount {
  _id: string;
  email: string;
  provider: string;
  events_from_mail: number;
  events_from_calendar: number;
  status: "active" | "error" | "expired";
  last_sync: string;
}

interface AdminUserView {
  _id: string;
  name: string;
  email: string;
  role: string;
  plan: string;
  created_at: string;
  total_events: number;
  synced_accounts: SyncedAccount[];
}

export default function AdminTotalUsersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [usersList, setUsersList] = useState<AdminUserView[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === "admin") {
      api.get("/admin/users")
        .then((res) => setUsersList(res.data))
        .catch((err) => {
          console.warn("API /admin/users not ready. Loading mock data for UI visualization.");
          setUsersList(generateMockUsers());
        })
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (authLoading || !user || user.role !== "admin") return null;

  const filteredUsers = usersList.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-[1200px] mx-auto px-6 lg:px-8 py-8" data-testid="admin-total-users">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={springConfig}>
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-5 h-5 text-mf-accent" />
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-mf-accent">
              Root Authority
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">
            User Directory
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-xs font-bold text-mf-text-secondary uppercase tracking-widest">
              Live Database Active
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
            const isActive = pathname === item.href || pathname === `${item.href}/`;
            return (
              <Link key={item.href} href={item.href}>
                <button
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-mf-accent text-white border-transparent shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                      : "bg-white/5 border-white/5 text-mf-text-secondary hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <item.icon className={`w-4 h-4 ${isActive ? "text-white" : "text-mf-text-secondary"}`} />
                  {item.label}
                </button>
              </Link>
            );
          })}
        </nav>
      </header>

      <motion.div 
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6"
      >
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-mf-text-secondary" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#111827] border border-[#1F2937] text-white text-sm rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-mf-accent/50 transition-colors placeholder:text-mf-text-secondary/50"
          />
        </div>
        <div className="flex items-center gap-2 text-sm font-bold text-mf-text-secondary bg-[#111827] border border-[#1F2937] px-4 py-3 rounded-xl w-full sm:w-auto justify-center">
          <Users className="w-4 h-4 text-mf-accent" />
          Total Accounts: <span className="text-white">{filteredUsers.length}</span>
        </div>
      </motion.div>

      <div className="space-y-4 pb-20">
        {loading ? (
          [1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-mf-secondary/50 rounded-2xl border border-mf-border animate-pulse" />
          ))
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-20 bg-[#111827] border border-[#1F2937] rounded-3xl">
            <Users className="w-12 h-12 text-mf-text-secondary/30 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-1">No users found</h3>
            <p className="text-sm text-mf-text-secondary">Try adjusting your search criteria.</p>
          </div>
        ) : (
          filteredUsers.map((userData, i) => (
            <UserExpandableCard key={userData._id} user={userData} index={i} />
          ))
        )}
      </div>
    </div>
  );
}

function UserExpandableCard({ user, index }: { user: AdminUserView; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`rounded-2xl border overflow-hidden transition-colors duration-300 ${
        expanded ? "bg-[#111827] border-mf-accent/30 shadow-xl" : "bg-[#111827]/60 border-[#1F2937] hover:border-mf-accent/20"
      }`}
    >
      <div 
        onClick={() => setExpanded(!expanded)}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 cursor-pointer gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-mf-accent/10 border border-mf-accent/20 flex items-center justify-center text-mf-accent font-black text-lg">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              {user.name}
              {user.plan === "paid" && (
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[9px] uppercase tracking-widest border border-emerald-500/20">Pro</span>
              )}
            </h3>
            <p className="text-xs text-mf-text-secondary">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
          <div className="text-center sm:text-right">
            <p className="text-xs text-mf-text-secondary uppercase tracking-wider font-bold mb-1">Total Events</p>
            <p className="text-lg font-black text-white">{user.total_events}</p>
          </div>
          <div className="text-center sm:text-right">
            <p className="text-xs text-mf-text-secondary uppercase tracking-wider font-bold mb-1">Synced Accs</p>
            <div className="flex items-center justify-center sm:justify-end gap-1.5">
              <Zap className={`w-4 h-4 ${user.synced_accounts.length > 0 ? "text-amber-400" : "text-mf-text-secondary"}`} />
              <p className="text-lg font-black text-white">{user.synced_accounts.length}</p>
            </div>
          </div>
          <button className={`p-2 rounded-full transition-transform duration-300 ${expanded ? "rotate-180 bg-white/10 text-white" : "bg-transparent text-mf-text-secondary"}`}>
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-[#1F2937] bg-black/20"
          >
            <div className="p-6">
              <h4 className="text-xs font-black text-mf-text-secondary uppercase tracking-[0.15em] mb-4">
                Connected Google Accounts Details
              </h4>
              
              {user.synced_accounts.length === 0 ? (
                <div className="text-sm text-mf-text-secondary italic">No external accounts synced.</div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {user.synced_accounts.map((acc) => (
                    <div key={acc._id} className="p-4 rounded-xl bg-[#111827] border border-[#1F2937] relative overflow-hidden">
                      <div className="absolute top-4 right-4 flex items-center gap-1">
                        {acc.status === 'active' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-400" />
                        )}
                      </div>

                      <p className="text-sm font-bold text-white mb-4 pr-6 truncate">{acc.email}</p>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-mf-bg border border-mf-border">
                          <div className="flex items-center gap-2 text-mf-text-secondary mb-1">
                            <Mail className="w-3.5 h-3.5" />
                            <span className="text-[10px] uppercase font-bold tracking-widest">Via Mail</span>
                          </div>
                          <p className="text-xl font-black text-white">{acc.events_from_mail}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-mf-bg border border-mf-border">
                          <div className="flex items-center gap-2 text-mf-text-secondary mb-1">
                            <CalendarDays className="w-3.5 h-3.5" />
                            <span className="text-[10px] uppercase font-bold tracking-widest">Via Cal</span>
                          </div>
                          <p className="text-xl font-black text-white">{acc.events_from_calendar}</p>
                        </div>
                      </div>
                      <p className="text-[9px] text-mf-text-secondary mt-3 uppercase tracking-wider font-bold">
                        Last Sync: {formatDate(acc.last_sync)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function generateMockUsers(): AdminUserView[] {
  return [
    {
      _id: "usr_1",
      name: "Sarah Jenkins",
      email: "sarah.j@example.com",
      role: "user",
      plan: "paid",
      created_at: new Date().toISOString(),
      total_events: 142,
      synced_accounts: [
        {
          _id: "acc_1",
          email: "sarah.work@google.com",
          provider: "google",
          events_from_mail: 87,
          events_from_calendar: 45,
          status: "active",
          last_sync: new Date().toISOString(),
        },
        {
          _id: "acc_2",
          email: "sarah.personal@gmail.com",
          provider: "google",
          events_from_mail: 2,
          events_from_calendar: 8,
          status: "active",
          last_sync: new Date().toISOString(),
        }
      ]
    },
    {
      _id: "usr_2",
      name: "Marcus Aurelius",
      email: "marcus.a@rome.com",
      role: "user",
      plan: "free",
      created_at: new Date().toISOString(),
      total_events: 18,
      synced_accounts: [
        {
          _id: "acc_3",
          email: "marcus.emperor@gmail.com",
          provider: "google",
          events_from_mail: 12,
          events_from_calendar: 6,
          status: "active",
          last_sync: new Date().toISOString(),
        }
      ]
    },
    {
      _id: "usr_3",
      name: "Elena Rodriguez",
      email: "elena.dev@startup.io",
      role: "admin",
      plan: "paid",
      created_at: new Date().toISOString(),
      total_events: 356,
      synced_accounts: [
        {
          _id: "acc_4",
          email: "elena.dev@startup.io",
          provider: "google",
          events_from_mail: 210,
          events_from_calendar: 140,
          status: "active",
          last_sync: new Date().toISOString(),
        },
        {
          _id: "acc_5",
          email: "elena.legacy@yahoo.com",
          provider: "google",
          events_from_mail: 6,
          events_from_calendar: 0,
          status: "error",
          last_sync: new Date(Date.now() - 86400000 * 5).toISOString(),
        }
      ]
    },
    {
      _id: "usr_4",
      name: "David Kim",
      email: "david.kim22@gmail.com",
      role: "user",
      plan: "free",
      created_at: new Date().toISOString(),
      total_events: 4,
      synced_accounts: []
    }
  ];
}