"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { formatApiError } from "@/lib/utils";
import { authApi } from "@/lib/api";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Cpu,
  ArrowRight,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  ChevronLeft,
} from "lucide-react";

const springConfig = { type: "spring", stiffness: 120, damping: 20 } as const;

export default function RegisterPage() {
  const [step, setStep] = useState<"details" | "otp">("details");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { register, login } = useAuth();
  const router = useRouter();

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authApi.register({ name, email, password });
      setStep("otp");
    } catch (err: any) {
      setError(
        formatApiError(
          err.response?.data?.detail || err.response?.data?.message,
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) return;
    setError("");
    setLoading(true);
    try {
      await authApi.verifyEmail(email, otpString);
      window.location.href = "/assistant";
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden bg-mf-bg">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-mf-accent/10 blur-[140px] rounded-full -z-10 opacity-40" />

      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springConfig}
      >
        <div className="flex flex-col items-center mb-10 text-center">
          <motion.div
            className="w-12 h-12 bg-mf-accent rounded-2xl flex items-center justify-center shadow-lg shadow-mf-accent/20 mb-4"
            whileHover={{ rotate: -10, scale: 1.1 }}
            transition={springConfig}
          >
            <Cpu className="w-7 h-7 text-white" />
          </motion.div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-mf-accent/10 border border-mf-accent/20 mb-3">
            <Sparkles className="w-3 h-3 text-mf-accent" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-mf-accent">
              VoloNexus.AI Swarm
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            {step === "details"
              ? "Create your account"
              : "Verify your identity"}
          </h1>
          <p className="text-mf-text-secondary mt-2 text-sm max-w-[280px]">
            {step === "details"
              ? "Initialize your personal agent swarm and reclaim your time."
              : `We've sent a code to ${email}. Enter it below.`}
          </p>
        </div>

        <motion.div
          className="p-8 rounded-[24px] bg-[#111827] border border-[#1F2937] shadow-2xl relative overflow-hidden"
          transition={springConfig}
        >
          <AnimatePresence mode="wait">
            {step === "details" ? (
              <motion.form
                key="details-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleRegisterSubmit}
                className="space-y-5 relative z-10"
              >
                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div
                      className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold flex items-center gap-3"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                    >
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-4">
                  <div className="grid gap-2">
                    <label className="text-[10px] uppercase font-bold text-mf-text-secondary tracking-widest px-1">
                      Full Name
                    </label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-mf-text-secondary group-focus-within:text-mf-accent transition-colors" />
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-12 pr-5 py-3.5 bg-mf-bg border border-mf-border rounded-2xl focus:border-mf-accent outline-none transition-all text-white placeholder:text-white/10 text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <label className="text-[10px] uppercase font-bold text-mf-text-secondary tracking-widest px-1">
                      Email Address
                    </label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-mf-text-secondary group-focus-within:text-mf-accent transition-colors" />
                      <input
                        type="email"
                        placeholder="john@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-12 pr-5 py-3.5 bg-mf-bg border border-mf-border rounded-2xl focus:border-mf-accent outline-none transition-all text-white placeholder:text-white/10 text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <label className="text-[10px] uppercase font-bold text-mf-text-secondary tracking-widest px-1">
                      Password
                    </label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-mf-text-secondary group-focus-within:text-mf-accent transition-colors" />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Min. 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={6}
                        className="w-full pl-12 pr-12 py-3.5 bg-mf-bg border border-mf-border rounded-2xl focus:border-mf-accent outline-none transition-all text-white placeholder:text-white/10 text-sm"
                        required
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
                  className="w-full py-4 bg-mf-accent hover:bg-mf-accent-hover text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-mf-accent/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                  whileTap={{ scale: loading ? 1 : 0.97 }}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Create Account <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </motion.form>
            ) : (
              <motion.div
                key="otp-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 relative z-10"
              >
                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div
                      className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold flex items-center gap-3"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                    >
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex justify-between gap-2">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpRefs.current[idx] = el;
                      }}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className="w-12 h-14 bg-mf-bg border border-mf-border rounded-xl text-center text-xl font-bold text-white focus:border-mf-accent outline-none transition-all"
                    />
                  ))}
                </div>

                <div className="flex flex-col gap-3">
                  <motion.button
                    onClick={handleVerifyOtp}
                    disabled={loading || otp.join("").length < 6}
                    className="w-full py-4 bg-mf-accent hover:bg-mf-accent-hover text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-mf-accent/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    whileTap={{ scale: loading ? 1 : 0.97 }}
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Verify Account <ShieldCheck className="w-4 h-4" />
                      </>
                    )}
                  </motion.button>

                  <button
                    onClick={() => setStep("details")}
                    className="text-xs font-bold text-mf-text-secondary hover:text-white flex items-center justify-center gap-2 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" /> Edit Details
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-mf-accent/5 blur-3xl rounded-full" />
        </motion.div>

        <p className="text-center mt-8 text-xs text-mf-text-secondary font-medium">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-mf-accent hover:text-mf-accent-light font-black uppercase tracking-widest ml-1"
          >
            Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
