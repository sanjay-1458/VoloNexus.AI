"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { accountsApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import {
  Mail,
  Trash2,
  ShieldCheck,
  Globe,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

export default function AccountsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState<string | null>(
    null,
  );
  const [confirmEmail, setConfirmEmail] = useState("");

  const fetchAccounts = async () => {
    try {
      const { data } = await accountsApi.list();
      setAccounts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
    const handleMessage = (event: MessageEvent) => {
      if (event.data === "google-account-connected") fetchAccounts();
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) fetchAccounts();
  }, [user]);

  const handleSync = async (id: string) => {
    setSyncingId(id);
    try {
      await accountsApi.syncCalendar(id);
      await fetchAccounts();
    } catch (err) {
      alert("Sync failed. Check connection.");
    } finally {
      setSyncingId(null);
    }
  };

  const handleConnectGoogle = async () => {
    try {
      const { data } = await accountsApi.getOAuthUrl();
      if (data.url) {
        const width = 500,
          height = 600;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        window.open(
          data.url,
          "google-auth",
          `width=${width},height=${height},left=${left},top=${top}`,
        );
      }
    } catch (err) {
      alert("OAuth error");
    }
  };

  const handleRemove = async (id: string, email: string) => {
    if (confirmEmail.toLowerCase() !== email.toLowerCase()) return;
    try {
      await accountsApi.remove(id);
      setShowRemoveConfirm(null);
      setConfirmEmail("");
      fetchAccounts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSetPrimary = async (id: string) => {
    try {
      await accountsApi.setPrimary(id);
      fetchAccounts();
    } catch (err) {
      console.error(err);
    }
  };

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-mf-bg w-full">
      <div className="max-w-[1200px] mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-5 h-5 text-mf-accent" />
              <span className="text-[10px] uppercase tracking-widest font-bold text-mf-accent">
                Connectivity Hub
              </span>
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight">
              Sync Accounts
            </h1>
            <p className="text-mf-text-secondary text-sm mt-2">
              Manage your calendar and email sources.
            </p>
          </motion.div>

          <button
            onClick={handleConnectGoogle}
            className="flex items-center gap-3 px-8 py-4 bg-white text-black font-bold rounded-2xl transition-all shadow-xl hover:bg-gray-100"
          >
            <Globe className="w-5 h-5 text-blue-600" /> Connect Google Account
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {accounts.map((account) => (
            <motion.div
              key={account.id}
              layout
              className="p-8 rounded-[32px] bg-[#111827] border border-[#1F2937] flex flex-col gap-6 relative overflow-hidden group shadow-2xl"
            >
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <img
                    src={account.profile_picture || "/default-avatar.png"}
                    className="w-16 h-16 rounded-2xl border-2 border-mf-accent/20 object-cover"
                  />
                  <div className="flex flex-col justify-center">
                    <h3 className="text-white font-bold text-xl leading-tight truncate max-w-[180px]">
                      {account.display_name || "Google Account"}
                    </h3>
                    <p className="text-mf-text-secondary text-sm truncate max-w-[200px]">
                      {account.email}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {account.is_primary && (
                    <span className="px-3 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-black rounded-full border border-amber-500/20 uppercase tracking-tighter">
                      Primary
                    </span>
                  )}
                  <div className="p-2 bg-mf-bg rounded-lg border border-white/5">
                    <Mail className="w-4 h-4 text-mf-accent" />
                  </div>
                </div>
              </div>

              <div className="bg-mf-bg/50 rounded-2xl p-4 border border-white/5 flex flex-col gap-2">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-mf-text-secondary">
                  <span>Status</span>
                  <span
                    className={
                      account.sync_status === "completed"
                        ? "text-emerald-400"
                        : "text-mf-accent"
                    }
                  >
                    {account.sync_status}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-white/80">
                  {account.sync_status === "completed" ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <RefreshCw
                      className={`w-4 h-4 text-mf-accent ${account.sync_status === "syncing" ? "animate-spin" : ""}`}
                    />
                  )}
                  {account.sync_status === "syncing"
                    ? "Retrieving data..."
                    : "Last update: " +
                      (account.last_synced
                        ? new Date(account.last_synced).toLocaleString()
                        : "Never")}
                </div>
              </div>

              <div className="flex items-center justify-between mt-2 pt-4 border-t border-white/5">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSync(account.id)}
                    disabled={
                      syncingId === account.id ||
                      account.sync_status === "syncing"
                    }
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-mf-accent/10 border border-mf-accent/20 text-[10px] font-black uppercase tracking-widest text-mf-accent hover:bg-mf-accent hover:text-white transition-all disabled:opacity-30"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${syncingId === account.id || account.sync_status === "syncing" ? "animate-spin" : ""}`}
                    />
                    Refresh
                  </button>
                  {!account.is_primary && (
                    <button
                      onClick={() => handleSetPrimary(account.id)}
                      className="text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl bg-mf-bg border border-white/5 text-mf-text-secondary hover:text-white transition-all"
                    >
                      Set Primary
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setShowRemoveConfirm(account.id)}
                  className="p-2.5 bg-red-500/10 rounded-xl text-red-400 hover:bg-red-500 hover:text-white transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        <AnimatePresence>
          {showRemoveConfirm && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
              <motion.div
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowRemoveConfirm(null)}
              />
              <motion.div
                className="relative w-full max-w-md bg-[#111827] border border-[#1F2937] rounded-[32px] p-10 text-center"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
              >
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-white mb-4">
                  Disconnect Sync?
                </h2>
                <input
                  type="email"
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  placeholder="Type email to confirm"
                  className="w-full p-4 bg-mf-bg border border-mf-border rounded-2xl text-white mb-6 outline-none focus:border-red-500"
                />
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowRemoveConfirm(null)}
                    className="flex-1 py-4 text-mf-text-secondary font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const acc = accounts.find(
                        (a) => a.id === showRemoveConfirm,
                      );
                      if (acc) handleRemove(showRemoveConfirm, acc.email);
                    }}
                    className="flex-1 py-4 bg-red-500 text-white font-bold rounded-2xl disabled:opacity-30"
                    disabled={!confirmEmail}
                  >
                    Disconnect
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
