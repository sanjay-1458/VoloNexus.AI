"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { settingsApi, authApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import {
  User,
  Building,
  Phone,
  Save,
  Clock,
  ShieldCheck,
  Zap,
  Globe,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  X,
  Trash2,
  ShieldAlert,
} from "lucide-react";

const springConfig = { type: "spring", stiffness: 120, damping: 20 } as const;

const TIMEZONES = [
  { label: "India Standard Time (IST)", value: "Asia/Kolkata" },
  { label: "Universal Coordinated Time (UTC)", value: "UTC" },
  { label: "Eastern Standard Time (EST)", value: "America/New_York" },
  { label: "British Summer Time (BST)", value: "Europe/London" },
];

export default function SettingsPage() {
  const { user, loading: authLoading, refreshUser, logout } = useAuth();
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const [form, setForm] = useState({ name: "", company: "", phone: "" });
  const [prefs, setPrefs] = useState({
    theme: "dark",
    timezone: "Asia/Kolkata",
    work_hours_start: "09:00",
    work_hours_end: "17:00",
    auto_mode: false,
  });

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      settingsApi.getProfile().then(({ data }) => {
        setForm({
          name: data.name || "",
          company: data.company || "",
          phone: data.phone || "",
        });
        if (data.preferences) {
          setPrefs((p) => ({ ...p, ...data.preferences }));
        }
      });
    }
  }, [user]);

  const handleSave = async (saveFn: () => Promise<any>) => {
    setSaving(true);
    try {
      await saveFn();
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const saveProfile = () =>
    handleSave(async () => {
      await settingsApi.updateProfile(form);
      await refreshUser();
    });

  const savePreferences = () =>
    handleSave(() => settingsApi.updatePreferences(prefs));

  const handleDeleteAccount = async () => {
    if (deleteConfirmEmail !== user?.email) return;
    setIsDeleting(true);
    try {
      await settingsApi.deleteAccount();
      await logout();
      router.push("/register");
    } catch (err) {
      console.error(err);
      alert("Failed to delete account. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (authLoading || !user) return null;

  return (
    <div
      className="max-w-[1200px] mx-auto py-12 px-6"
      data-testid="settings-page"
    >
      <AnimatePresence>
        {saved && (
          <motion.div
            className="fixed top-24 right-8 z-[100] px-6 py-4 rounded-2xl bg-[#10b981] border border-emerald-400/20 text-white flex items-center gap-4 shadow-[0_20px_50px_rgba(16,185,129,0.2)] backdrop-blur-xl"
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
          >
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-tight">
                Updated
              </p>
              <p className="text-[11px] opacity-80">
                Preferences saved successfully.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 bg-mf-accent/10 rounded-lg">
            <ShieldCheck className="w-5 h-5 text-mf-accent" />
          </div>
          <span className="text-[10px] uppercase tracking-widest font-bold text-mf-accent">
            User Configuration
          </span>
        </div>
        <h1 className="text-4xl font-bold text-white tracking-tight flex items-center gap-4">
          Settings
        </h1>
      </motion.header>

      <div className="grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-10">
          <motion.section
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={springConfig}
            className="p-8 rounded-[32px] bg-mf-secondary border border-mf-border shadow-2xl"
          >
            <h2 className="text-2xl font-black text-white mb-8 flex items-center gap-3 uppercase tracking-tight">
              <User className="w-6 h-6 text-mf-accent" /> Identity
            </h2>

            <div className="grid gap-8">
              <div className="grid gap-3">
                <label className="text-[11px] uppercase font-black text-mf-text-secondary tracking-widest px-1">
                  Full Name
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-6 py-4 bg-mf-bg border border-mf-border rounded-2xl outline-none focus:border-mf-accent text-white transition-all text-sm font-medium"
                  placeholder="Your Name"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="grid gap-3">
                  <label className="text-[11px] uppercase font-black text-mf-text-secondary tracking-widest px-1">
                    Organization
                  </label>
                  <div className="relative">
                    <Building className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-mf-accent" />
                    <input
                      value={form.company}
                      onChange={(e) =>
                        setForm({ ...form, company: e.target.value })
                      }
                      className="w-full pl-14 pr-6 py-4 bg-mf-bg border border-mf-border rounded-2xl outline-none focus:border-mf-accent text-white text-sm"
                      placeholder="Company"
                    />
                  </div>
                </div>
                <div className="grid gap-3">
                  <label className="text-[11px] uppercase font-black text-mf-text-secondary tracking-widest px-1">
                    Contact Phone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-mf-accent" />
                    <input
                      value={form.phone}
                      onChange={(e) =>
                        setForm({ ...form, phone: e.target.value })
                      }
                      className="w-full pl-14 pr-6 py-4 bg-mf-bg border border-mf-border rounded-2xl outline-none focus:border-mf-accent text-white text-sm"
                      placeholder="Phone Number"
                    />
                  </div>
                </div>
              </div>

              <motion.button
                onClick={saveProfile}
                disabled={saving}
                className="w-full sm:w-fit flex items-center justify-center gap-3 px-10 py-4 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-black uppercase tracking-widest text-[11px] rounded-2xl transition-all shadow-xl shadow-blue-500/20"
                whileTap={{ scale: 0.98 }}
              >
                <Save className="w-4 h-4" />{" "}
                {saving ? "Saving..." : "Save Profile"}
              </motion.button>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...springConfig, delay: 0.1 }}
            className="p-8 rounded-[32px] bg-mf-secondary border border-mf-border shadow-2xl"
          >
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-2xl font-black text-white flex items-center gap-3 uppercase tracking-tight">
                <Clock className="w-6 h-6 text-mf-accent" /> Scheduling
              </h2>
              <div className="px-4 py-1.5 bg-mf-accent/10 border border-mf-accent/20 rounded-full flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-mf-accent animate-pulse" />
                <span className="text-[10px] font-black text-mf-accent uppercase tracking-tighter">
                  AI Active
                </span>
              </div>
            </div>

            <div className="grid gap-10">
              <div className="grid gap-4">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-mf-accent" />
                  <label className="text-[11px] uppercase font-black text-mf-text-secondary tracking-widest">
                    Regional Timezone
                  </label>
                </div>
                <div className="relative">
                  <select
                    value={prefs.timezone}
                    onChange={(e) =>
                      setPrefs({ ...prefs, timezone: e.target.value })
                    }
                    className="w-full px-6 py-4 bg-mf-bg border border-mf-border rounded-2xl outline-none focus:border-mf-accent text-white text-sm font-bold appearance-none cursor-pointer"
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-mf-text-secondary pointer-events-none" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="grid gap-3">
                  <label className="text-[11px] uppercase font-black text-mf-text-secondary tracking-widest px-1">
                    Work Day Start
                  </label>
                  <input
                    type="time"
                    value={prefs.work_hours_start}
                    onChange={(e) =>
                      setPrefs({ ...prefs, work_hours_start: e.target.value })
                    }
                    className="w-full px-6 py-4 bg-mf-bg border border-mf-border rounded-2xl outline-none focus:border-mf-accent text-white font-mono"
                  />
                </div>
                <div className="grid gap-3">
                  <label className="text-[11px] uppercase font-black text-mf-text-secondary tracking-widest px-1">
                    Work Day End
                  </label>
                  <input
                    type="time"
                    value={prefs.work_hours_end}
                    onChange={(e) =>
                      setPrefs({ ...prefs, work_hours_end: e.target.value })
                    }
                    className="w-full px-6 py-4 bg-mf-bg border border-mf-border rounded-2xl outline-none focus:border-mf-accent text-white font-mono"
                  />
                </div>
              </div>

              <div className="p-6 bg-mf-bg border border-mf-border rounded-3xl flex items-center justify-between hover:border-mf-accent/40 transition-all group">
                <div className="flex items-center gap-5">
                  <div
                    className={`p-4 rounded-2xl transition-all ${prefs.auto_mode ? "bg-mf-accent text-white" : "bg-mf-secondary text-mf-text-secondary"}`}
                  >
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-black text-white text-sm uppercase tracking-tight">
                      Auto-Pilot Mode
                    </p>
                    <p className="text-xs text-mf-text-secondary mt-1">
                      Let AI resolve minor meeting overlaps automatically.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    setPrefs({ ...prefs, auto_mode: !prefs.auto_mode })
                  }
                  className={`w-16 h-8 rounded-full p-1 transition-all ${prefs.auto_mode ? "bg-mf-accent" : "bg-mf-border"}`}
                >
                  <motion.div
                    animate={{ x: prefs.auto_mode ? 32 : 0 }}
                    className="w-6 h-6 rounded-full bg-white shadow-xl"
                  />
                </button>
              </div>

              <motion.button
                onClick={savePreferences}
                disabled={saving}
                className="w-full sm:w-fit flex items-center justify-center gap-3 px-10 py-4 bg-mf-accent hover:bg-mf-accent-hover text-white font-black uppercase tracking-widest text-[11px] rounded-2xl transition-all shadow-xl shadow-mf-accent/20"
                whileTap={{ scale: 0.98 }}
              >
                <Save className="w-4 h-4" />{" "}
                {saving ? "Syncing..." : "Save Preferences"}
              </motion.button>
            </div>
          </motion.section>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-8"
        >
          <section className="p-8 rounded-[32px] bg-mf-secondary border border-mf-border shadow-xl">
            <h3 className="text-xs font-black text-white mb-8 uppercase tracking-[0.2em] px-1 opacity-60">
              Account
            </h3>

            <div className="space-y-6">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold text-mf-text-secondary tracking-widest">
                  Email Address
                </span>
                <span className="text-sm font-bold text-white truncate">
                  {user.email}
                </span>
              </div>

              <div className="flex items-center justify-between py-4 border-y border-white/5 font-black uppercase tracking-tighter text-[10px]">
                <span className="text-mf-text-secondary">Account Status</span>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 tracking-tighter">
                  VERIFIED
                </span>
              </div>

              <div className="flex items-center justify-between font-black uppercase tracking-tighter text-[10px]">
                <span className="text-mf-text-secondary">Current Plan</span>
                <span
                  className={
                    user.plan === "paid" ? "text-mf-accent" : "text-white"
                  }
                >
                  {user.plan || "Free"}
                </span>
              </div>
            </div>
          </section>

          <section className="p-8 rounded-[32px] bg-red-500/[0.03] border border-red-500/10">
            <h3 className="text-xs font-black text-red-400 mb-3 flex items-center gap-2 uppercase tracking-widest">
              <AlertCircle className="w-4 h-4" /> Danger Zone
            </h3>
            <p className="text-[11px] text-mf-text-secondary leading-relaxed mb-6 font-medium">
              Permanent actions regarding your cloud instance and data deletion.
            </p>
            <button
              onClick={() => setIsSecurityOpen(true)}
              className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-red-400 bg-red-400/5 hover:bg-red-400/10 border border-red-400/20 rounded-2xl transition-all"
            >
              Security Portal
            </button>
          </section>
        </motion.div>
      </div>

      <AnimatePresence>
        {isSecurityOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#0B0F1A]/95 backdrop-blur-md"
              onClick={() => setIsSecurityOpen(false)}
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={springConfig}
              className="relative w-full max-w-md bg-[#111827] border border-red-500/20 rounded-[32px] p-8 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />

              <div className="flex justify-between items-start mb-8">
                <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20">
                  <ShieldAlert className="w-8 h-8 text-red-500" />
                </div>
                <button
                  onClick={() => setIsSecurityOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-full text-mf-text-secondary"
                >
                  <X size={24} />
                </button>
              </div>

              <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2 italic">
                Destructive Action
              </h2>
              <p className="text-mf-text-secondary text-sm leading-relaxed mb-8">
                You are about to permanently delete your account. This will
                erase all scheduled events, connected accounts, and AI habit
                data.
                <span className="text-red-400 block mt-2 font-bold uppercase text-[10px]">
                  This action cannot be undone.
                </span>
              </p>

              <div className="space-y-6">
                <div className="grid gap-3">
                  <label className="text-[10px] uppercase font-black text-red-400/60 tracking-widest px-1 text-center">
                    Type your email to confirm:{" "}
                    <span className="text-white select-none">{user.email}</span>
                  </label>
                  <input
                    type="email"
                    value={deleteConfirmEmail}
                    onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                    className="w-full px-6 py-4 bg-mf-bg border border-red-500/20 rounded-2xl outline-none focus:border-red-500 text-white text-center font-bold"
                    placeholder="Verify Email"
                  />
                </div>

                <button
                  disabled={deleteConfirmEmail !== user.email || isDeleting}
                  onClick={handleDeleteAccount}
                  className="w-full py-5 bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl transition-all shadow-xl shadow-red-500/20 disabled:opacity-20 disabled:grayscale"
                >
                  {isDeleting
                    ? "Erasing Cloud Instance..."
                    : "Delete My Account Permanently"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
