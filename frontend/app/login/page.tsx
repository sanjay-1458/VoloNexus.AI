"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { formatApiError } from "@/lib/utils";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Cpu,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

const springConfig = { type: "spring", stiffness: 120, damping: 20 } as const;

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !authLoading) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(
        formatApiError(
          err.response?.data?.detail || err.response?.data?.message,
        ),
      );
      setLoading(false);
    }
  };

  if (authLoading || user) {
    return <div className="min-h-screen bg-mf-bg" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden bg-mf-bg">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-mf-accent/10 blur-[120px] rounded-full -z-10 opacity-50" />

      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springConfig}
      >
        <div className="flex flex-col items-center mb-10">
          <motion.div
            className="w-12 h-12 bg-mf-accent rounded-2xl flex items-center justify-center shadow-lg shadow-mf-accent/20 mb-4"
            whileHover={{ rotate: 10, scale: 1.1 }}
            transition={springConfig}
          >
            <Cpu className="w-7 h-7 text-white" />
          </motion.div>
          <h1
            className="text-3xl font-bold text-white tracking-tight"
            data-testid="login-heading"
          >
            Welcome back
          </h1>
          <p className="text-mf-text-secondary mt-2 text-sm">
            Synchronize your schedule with VoloNexus.AI
          </p>
        </div>

        <motion.div
          className="p-8 rounded-[24px] bg-[#111827] border border-[#1F2937] shadow-2xl relative overflow-hidden"
          whileHover={{ y: -4 }}
          transition={springConfig}
        >
          <form
            onSubmit={handleSubmit}
            className="space-y-6 relative z-10"
            data-testid="login-form"
          >
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold flex items-center gap-3"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  data-testid="login-error"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-4">
              <div className="grid gap-2">
                <label className="text-[10px] uppercase font-bold text-mf-text-secondary tracking-widest px-1">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-mf-text-secondary group-focus-within:text-mf-accent transition-colors" />
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-5 py-3.5 bg-mf-bg border border-mf-border rounded-2xl focus:border-mf-accent outline-none transition-all text-white placeholder:text-white/10 text-sm"
                    required
                    data-testid="login-email-input"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] uppercase font-bold text-mf-text-secondary tracking-widest">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    title="Forgot Password"
                    className="text-[10px] font-black uppercase tracking-widest text-mf-accent hover:text-mf-accent-light transition-colors"
                  >
                    Forgot?
                  </Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-mf-text-secondary group-focus-within:text-mf-accent transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3.5 bg-mf-bg border border-mf-border rounded-2xl focus:border-mf-accent outline-none transition-all text-white placeholder:text-white/10 text-sm"
                    required
                    data-testid="login-password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-mf-text-secondary hover:text-white transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-mf-accent hover:bg-mf-accent-hover text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-mf-accent/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.97 }}
              data-testid="login-submit-btn"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>

          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-mf-accent/5 blur-3xl rounded-full" />
        </motion.div>

        <p className="text-center mt-8 text-xs text-mf-text-secondary font-medium">
          New to the domain?{" "}
          <Link
            href="/register"
            className="text-mf-accent hover:text-mf-accent-light font-black uppercase tracking-widest ml-1"
          >
            Create Account
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
