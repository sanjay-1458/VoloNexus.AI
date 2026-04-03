"use client";

import React, { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi } from "@/lib/api";
import { Lock, AlertCircle, CheckCircle2 } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      console.error("Reset Password Error: No token provided in URL");
      setError(
        "Invalid or missing reset token. Please request a new password reset link.",
      );
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Missing reset token.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await authApi.resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err: any) {
      console.error("Reset Password Submission Error:", err);
      setError(
        err.response?.data?.message ||
          "Failed to reset password. The link might be expired.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-[#111827] border border-[#1F2937] p-8 rounded-[32px] shadow-2xl relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-mf-accent/10 blur-[60px] rounded-full pointer-events-none" />

      {success ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-6"
        >
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">
            Password Updated
          </h2>
          <p className="text-mf-text-secondary text-sm leading-relaxed mb-2">
            Your password has been successfully reset.
          </p>
          <p className="text-mf-text-secondary text-xs italic">
            Redirecting to login...
          </p>
        </motion.div>
      ) : (
        <>
          <h2 className="text-3xl font-bold text-white mb-3">
            Create New Password
          </h2>
          <p className="text-mf-text-secondary text-sm mb-8">
            Please enter your new password below. It must be different from your
            previously used password.
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-mf-text-secondary mb-2">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-mf-text-secondary" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-mf-bg border border-[#1F2937] text-white rounded-xl pl-11 pr-4 py-3.5 focus:outline-none focus:border-mf-accent focus:ring-1 focus:ring-mf-accent transition-all"
                  placeholder="••••••••"
                  disabled={loading || !token || success}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-mf-text-secondary mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-mf-text-secondary" />
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-mf-bg border border-[#1F2937] text-white rounded-xl pl-11 pr-4 py-3.5 focus:outline-none focus:border-mf-accent focus:ring-1 focus:ring-mf-accent transition-all"
                  placeholder="••••••••"
                  disabled={loading || !token || success}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !token || success}
              className="w-full mt-4 bg-mf-accent hover:bg-mf-accent-hover text-white font-black uppercase tracking-widest text-xs py-4 rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-mf-accent/20"
            >
              {loading ? "Updating..." : "Reset Password"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-mf-bg p-6">
      <Suspense
        fallback={
          <div className="text-white text-sm">Loading secure context...</div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
