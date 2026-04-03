"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { authApi } from "@/lib/api";
import { ArrowLeft, Mail, AlertCircle, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await authApi.forgotPassword(email);
      setSuccess(true);
    } catch (err: any) {
      console.error("Forgot Password Error:", err);
      setError(err.response?.data?.message || "Failed to process request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-mf-bg p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#111827] border border-[#1F2937] p-8 rounded-[32px] shadow-2xl relative overflow-hidden"
      >
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-mf-accent/10 blur-[60px] rounded-full pointer-events-none" />

        <Link
          href="/login"
          className="inline-flex items-center text-mf-text-secondary hover:text-white transition-colors mb-8 cursor-pointer text-sm font-medium gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </Link>

        {success ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">
              Check your inbox
            </h2>
            <p className="text-mf-text-secondary text-sm leading-relaxed mb-8">
              We have sent password reset instructions to{" "}
              <span className="text-white font-medium">{email}</span>.
            </p>
            <button
              onClick={() => setSuccess(false)}
              className="text-mf-accent text-sm font-bold hover:underline cursor-pointer"
            >
              Try another email address
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-3xl font-bold text-white mb-3">
              Reset Password
            </h2>
            <p className="text-mf-text-secondary text-sm mb-8">
              Enter the email address associated with your account and we'll
              send you a link to reset your password.
            </p>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-mf-text-secondary mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-mf-text-secondary" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-mf-bg border border-[#1F2937] text-white rounded-xl pl-11 pr-4 py-3.5 focus:outline-none focus:border-mf-accent focus:ring-1 focus:ring-mf-accent transition-all"
                    placeholder="agent@volonexus.ai"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-mf-accent hover:bg-mf-accent-hover text-white font-black uppercase tracking-widest text-xs py-4 rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-mf-accent/20"
              >
                {loading ? "Sending link..." : "Send Reset Link"}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}
