"use client";

import { motion } from "framer-motion";
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  Zap,
  Cpu,
  Users,
} from "lucide-react";

const springConfig = { type: "spring", stiffness: 120, damping: 20 } as const;

export default function TermsOfService() {
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
            <FileText className="w-4 h-4 text-mf-accent" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-mf-accent-light">
              Service Agreement
            </span>
          </div>
          <h1 className="text-5xl font-bold text-white tracking-tighter mb-4">
            Terms of Service
          </h1>
          <p className="text-mf-text-secondary">
            Please read these terms carefully before using VoloNexus.AI
          </p>
        </motion.div>

        <div className="space-y-4 mb-16">
          <TermFeature
            icon={<Zap />}
            title="AI Authorization"
            desc="You grant VoloNexus.AI permission to read your emails and send messages on your behalf to coordinate meetings."
          />
          <TermFeature
            icon={<Cpu />}
            title="Automated Actions"
            desc="The system will automatically reschedule events based on your priority scores and rules."
          />
          <TermFeature
            icon={<Users />}
            title="Account Ownership"
            desc="You are responsible for all activity under your connected Google and Outlook accounts."
          />
        </div>

        <div className="bg-[#111827] rounded-[40px] border border-[#1F2937] p-8 md:p-12 shadow-2xl">
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">
              1. Service Description
            </h2>
            <p className="text-mf-text-secondary leading-relaxed">
              VoloNexus.AI provides an AI-driven orchestration engine. By
              connecting your accounts, you explicitly authorize our system to:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-mf-text-secondary text-sm">
              <li>Analyze your inbox for scheduling-related communications.</li>
              <li>Read, create, and modify events on your Calendar.</li>
              <li>
                <strong>Draft and send email replies</strong> to meeting
                participants to finalize times.
              </li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" /> 2. Accuracy
              & Reliability
            </h2>
            <p className="text-mf-text-secondary leading-relaxed">
              While our AI agents are highly accurate, VoloNexus.AI is provided
              "as is." We are not liable for any missed appointments, incorrect
              time zone conversions, or email misinterpretations during the beta
              phase of the platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" /> 3. Termination
            </h2>
            <p className="text-mf-text-secondary leading-relaxed">
              You may stop using the service at any time. Upon disconnecting
              your accounts, we immediately cease all automated reading and
              sending actions for those specific mailboxes.
            </p>
          </section>
        </div>

        <div className="text-center mt-12 text-xs text-mf-text-secondary">
          For further inquiries, contact:{" "}
          <span className="text-white">support.volonexus.ai@gmail.com</span>
        </div>
      </div>
    </div>
  );
}

function TermFeature({
  icon,
  title,
  desc,
}: {
  icon: any;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-4 p-6 rounded-2xl bg-white/5 border border-white/5">
      <div className="mt-1 w-8 h-8 rounded-lg bg-mf-accent/20 flex items-center justify-center shrink-0">
        {require("react").cloneElement(icon, {
          className: "w-4 h-4 text-mf-accent",
        })}
      </div>
      <div>
        <h4 className="text-white font-bold text-sm mb-1">{title}</h4>
        <p className="text-mf-text-secondary text-xs leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
