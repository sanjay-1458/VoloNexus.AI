"use client";

import { motion } from "framer-motion";
import { Shield, Lock, Eye, Server, Mail, Calendar, Globe } from "lucide-react";

const springConfig = { type: "spring", stiffness: 120, damping: 20 } as const;

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-mf-bg text-mf-text py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springConfig}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-mf-accent/10 border border-mf-accent/20 mb-6">
            <Shield className="w-4 h-4 text-mf-accent" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-mf-accent-light">
              Privacy Shield
            </span>
          </div>
          <h1 className="text-5xl font-bold text-white tracking-tighter mb-4">
            Privacy Policy
          </h1>
          <p className="text-mf-text-secondary">Last Updated: April 3, 2026</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 mb-16">
          <motion.div
            whileHover={{ y: -5 }}
            className="p-8 rounded-[32px] bg-[#111827] border border-[#1F2937] transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6">
              <Calendar className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Calendar Sync</h3>
            <p className="text-sm text-mf-text-secondary leading-relaxed">
              We access your Google Calendar to read existing events, identify
              free slots, and resolve scheduling conflicts automatically.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="p-8 rounded-[32px] bg-[#111827] border border-[#1F2937] transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-mf-accent/10 flex items-center justify-center mb-6">
              <Mail className="w-6 h-6 text-mf-accent" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">
              Gmail Automation
            </h3>
            <p className="text-sm text-mf-text-secondary leading-relaxed">
              Our AI reads incoming meeting requests and{" "}
              <strong>sends automated replies</strong> on your behalf to
              coordinate times without manual intervention.
            </p>
          </motion.div>
        </div>

        <div className="space-y-12 bg-[#111827]/50 p-8 md:p-12 rounded-[40px] border border-white/5 backdrop-blur-sm">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <Eye className="w-6 h-6 text-mf-accent" /> 1. Information
              Collection
            </h2>
            <p className="text-mf-text-secondary leading-relaxed mb-4">
              VoloNexus.AI collects information only necessary to orchestrate
              your schedule. This includes your name, email address, and OAuth
              tokens. We specifically process your{" "}
              <strong>Calendar events</strong> and{" "}
              <strong>Email headers/content</strong> related to scheduling.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <Lock className="w-6 h-6 text-mf-accent" /> 2. Security &
              Protection
            </h2>
            <p className="text-mf-text-secondary leading-relaxed">
              Your data is encrypted both in transit and at rest. We do not sell
              your personal data to third parties. We do not use your Gmail or
              Calendar data for advertising or marketing.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <Server className="w-6 h-6 text-mf-accent" /> 3. Data Retention
            </h2>
            <p className="text-mf-text-secondary leading-relaxed">
              We store your Google tokens securely in our vault. You may revoke
              VoloNexus.AI's access at any time through your Google Account
              permissions or by deleting your account in our dashboard.
            </p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-white/5 text-center">
          <p className="text-mf-text-secondary text-sm">
            Questions about your privacy? Contact our legal team at:
          </p>
          <a
            href="mailto:support.volonexus.ai@gmail.com"
            className="text-mf-accent font-bold mt-2 inline-block hover:underline"
          >
            support.volonexus.ai@gmail.com
          </a>
        </div>
      </div>
    </div>
  );
}
