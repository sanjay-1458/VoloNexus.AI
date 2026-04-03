"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import {
  Calendar,
  Zap,
  Shield,
  MessageSquare,
  Users,
  BarChart3,
  ArrowRight,
  Check,
  Sparkles,
  Star,
  Quote,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";

const springConfig = { type: "spring", stiffness: 120, damping: 20 } as const;

const features = [
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description:
      "AI-powered conflict resolution and optimal time slot suggestions.",
  },
  {
    icon: Zap,
    title: "Auto-Mode",
    description:
      "Define rules and let AI handle scheduling, rescheduling, and notifications.",
  },
  {
    icon: Shield,
    title: "Multi-Account",
    description: "Manage up to 7 email accounts with a unified calendar view.",
  },
  {
    icon: MessageSquare,
    title: "Natural Language",
    description:
      "Schedule meetings with voice commands or simple chat messages.",
  },
  {
    icon: Users,
    title: "Team Coordination",
    description: "Associated accounts for agency or shared access management.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description:
      "Insights into your scheduling patterns and productivity metrics.",
  },
];

const testimonials = [
  {
    id: 1,
    name: "Sarah Jenkins",
    role: "Director @ TechFlow",
    content:
      "VoloNexus.AI didn't just organize my calendar; it gave me back 10 hours a week. The agent swarm handles conflicts better than any assistant I've ever had.",
    avatar: "SJ",
  },
  {
    id: 2,
    name: "Marcus Chen",
    role: "Founder, Zenith Agency",
    content:
      "The multi-account sync is flawless. Managing 7 different client domains used to be a nightmare. Now, the AI orchestrator keeps everything perfectly aligned.",
    avatar: "MC",
  },
  {
    id: 3,
    name: "Elena Rodriguez",
    role: "Product Lead @ Innovate",
    content:
      "I was skeptical about AI scheduling, but the natural language processing is incredible. I just type 'find time for sync' and it's done.",
    avatar: "ER",
  },
  {
    id: 4,
    name: "David Kim",
    role: "Head of Operations",
    content:
      "The Knight Tier is worth every penny. Persistent behavior memory means the agents actually learn how I prefer to work over time.",
    avatar: "DK",
  },
  {
    id: 5,
    name: "Lisa Thompson",
    role: "Freelance Consultant",
    content:
      "Beautiful UI and even better logic. It handles rescheduling via email automatically, which has been a game-changer for my client relations.",
    avatar: "LT",
  },
  {
    id: 6,
    name: "James Wilson",
    role: "VP Engineering @ CloudScale",
    content:
      "The autonomous rescheduling is spooky good. It handled a 50-person conflict across three timezones without me lifting a finger. Pure magic.",
    avatar: "JW",
  },
  {
    id: 7,
    name: "Amara Okafor",
    role: "Senior Architect",
    content:
      "Integrating VoloNexus into our DevOps workflow transformed how we handle standups. The AI agent actually understands meeting technical priority.",
    avatar: "AO",
  },
  {
    id: 8,
    name: "Sophia Wright",
    role: "Executive Assistant",
    content:
      "I used to spend 4 hours a day on calendar Tetris. Now I just monitor the Swarm's decisions. It's like having a team of 10 working for me.",
    avatar: "SW",
  },
];

function TestimonialsSection() {
  const [index, setIndex] = useState(0);
  const { user } = useAuth();

  const nextTestimonial = useCallback(() => {
    setIndex((prev) => (prev + 1) % testimonials.length);
  }, []);

  useEffect(() => {
    console.log(`[UI]: Rotating to testimonial index ${index}`);
    const timer = setInterval(nextTestimonial, 3000);
    return () => clearInterval(timer);
  }, [nextTestimonial, index]);

  const getCardStyles = (i: number) => {
    const diff = (i - index + testimonials.length) % testimonials.length;

    if (diff === 0) return "center";
    if (diff === 1) return "right";
    if (diff === testimonials.length - 1) return "left";
    return "hidden";
  };

  return (
    <section className="py-32 px-6 overflow-hidden relative bg-mf-bg">
      <div className="max-w-6xl mx-auto text-center mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-mf-accent/10 border border-mf-accent/20 mb-6"
        >
          <Star className="w-3 h-3 text-mf-accent fill-mf-accent" />
          <span className="text-[10px] font-black uppercase tracking-widest text-mf-accent">
            Verified User Feedback
          </span>
        </motion.div>
        <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
          Trusted by Industry Leaders
        </h2>
      </div>

      <div className="relative h-[480px] flex items-center justify-center">
        <div className="flex items-center justify-center w-full max-w-5xl relative">
          <AnimatePresence mode="popLayout">
            {testimonials.map((t, i) => {
              const position = getCardStyles(i);
              if (position === "hidden") return null;

              const isCenter = position === "center";

              return (
                <motion.div
                  key={t.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{
                    opacity: isCenter ? 1 : 0.4,
                    scale: isCenter ? 1.1 : 0.85,
                    zIndex: isCenter ? 20 : 10,
                    x:
                      position === "center"
                        ? 0
                        : position === "right"
                          ? 340
                          : -340,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 150,
                    damping: 20,
                  }}
                  className={cn(
                    "absolute w-full max-w-[380px] p-8 rounded-[32px] border transition-colors duration-500",
                    isCenter
                      ? "bg-[#111827] border-mf-accent shadow-[0_0_50px_rgba(59,130,246,0.15)]"
                      : "bg-[#111827]/50 border-[#1F2937]",
                  )}
                >
                  <div className="flex flex-col h-full">
                    <div className="flex gap-1 mb-6">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className="w-4 h-4 text-mf-accent fill-mf-accent"
                        />
                      ))}
                    </div>

                    <Quote className="w-10 h-10 text-mf-accent/20 mb-4" />

                    <p className="text-mf-text leading-relaxed mb-8 font-medium italic">
                      "{t.content}"
                    </p>

                    <div className="mt-auto flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-mf-accent flex items-center justify-center font-bold text-white shadow-lg">
                        {t.avatar}
                      </div>
                      <div className="text-left">
                        <h4 className="text-sm font-bold text-white">
                          {t.name}
                        </h4>
                        <p className="text-[11px] text-mf-text-secondary uppercase tracking-wider font-bold">
                          {t.role}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Join the Network CTA */}
      <motion.div
        className="mt-20 text-center"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <Link href={user ? "/dashboard" : "/register"}>
          <button className="inline-flex items-center gap-2 text-mf-accent font-bold hover:text-white transition-colors group">
            <Globe className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            <span className="border-b border-mf-accent/30 group-hover:border-white">
              Join the Global Network
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </Link>
      </motion.div>
    </section>
  );
}

export default function LandingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

  const handleStripeCheckout = async () => {
    if (!user) {
      router.push("/register");
      return;
    }
    try {
      setIsCheckoutLoading(true);
      const res = await api.post("/stripe/create-checkout-session");
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (error) {
      console.error("Failed to start checkout", error);
      alert("Checkout is currently unavailable.");
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  return (
    <div className="relative isolate bg-mf-bg">
      <section className="relative min-h-[95vh] flex items-center justify-center px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-mf-accent/15 blur-[120px] rounded-full -z-10 opacity-60" />

        <motion.div
          className="relative z-10 max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ...springConfig }}
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-mf-accent/10 border border-mf-accent/20 mb-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, ...springConfig }}
          >
            <Sparkles className="w-4 h-4 text-mf-accent" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-mf-accent-light">
              Autonomous Scheduling is Here
            </span>
          </motion.div>

          <h1 className="text-5xl md:text-8xl font-bold leading-[1.05] mb-8 tracking-tighter text-white">
            Your meetings, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-mf-accent-light to-mf-accent">
              orchestrated by AI
            </span>
          </h1>

          <p className="text-xl text-mf-text-secondary max-w-2xl mx-auto mb-12 leading-relaxed">
            VoloNexus.AI manages your calendar across multiple accounts,
            resolves conflicts intelligently, and communicates with participants
            — all with AI agents working behind the scenes.
          </p>

          <div
            className="flex flex-col sm:flex-row gap-5 justify-center"
            data-testid="hero-cta"
          >
            <Link href={user ? "/dashboard" : "/register"}>
              <motion.button
                className="px-10 py-5 bg-mf-accent hover:bg-mf-accent-hover text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-2xl shadow-mf-accent/30 flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
                data-testid="get-started-btn"
              >
                {user ? "Go to Dashboard" : "Get Started Free"}{" "}
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
            <Link href="/testimonials">
              <motion.button
                className="px-10 py-5 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-xs rounded-2xl border border-white/10 backdrop-blur-md transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
                data-testid="see-reviews-btn"
              >
                See Reviews
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </section>

      <section className="py-32 px-6 relative border-t border-white/5">
        <div className="max-w-[1200px] mx-auto">
          <motion.div
            className="text-center mb-24"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={springConfig}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-white">
              Everything you need to own your time
            </h2>
            <p className="text-mf-text-secondary text-lg max-w-2xl mx-auto">
              7 specialized AI agents working in a Kafka-driven swarm to manage
              your schedule, parse emails, and resolve conflicts.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                className="p-8 rounded-[24px] bg-[#111827] border border-[#1F2937] hover:border-mf-accent/40 transition-all duration-500 group relative overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ ...springConfig, delay: i * 0.1 }}
                whileHover={{
                  y: -4,
                  scale: 1.02,
                  rotateX: 2,
                  rotateY: -2,
                  boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
                }}
                data-testid={`feature-card-${i}`}
              >
                <div className="w-14 h-14 rounded-2xl bg-mf-accent/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                  <feature.icon className="w-7 h-7 text-mf-accent" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">
                  {feature.title}
                </h3>
                <p className="text-mf-text-secondary text-sm leading-relaxed">
                  {feature.description}
                </p>
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-mf-accent/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <TestimonialsSection />

      <section className="py-32 px-6 bg-mf-secondary/20 border-y border-white/5">
        <div className="max-w-[1200px] mx-auto text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-white">
              Simple pricing
            </h2>
            <p className="text-mf-text-secondary text-lg">
              Start free, upgrade when your schedule demands more power.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-10 max-w-4xl mx-auto">
            <motion.div
              className="p-10 rounded-[32px] bg-mf-bg border border-mf-border text-left relative group"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={springConfig}
              data-testid="pricing-free"
            >
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-mf-text-secondary mb-6">
                Entry Tier
              </h3>
              <p className="text-6xl font-bold text-white mb-2">$0</p>
              <p className="text-mf-text-secondary text-xs mb-10 font-bold uppercase tracking-widest">
                Forever Free
              </p>
              <ul className="space-y-4 mb-10">
                <PriceCheckItem text="Connect up to 2 Google/Outlook accounts" />
                <PriceCheckItem text="Standard AI conflict detection" />
                <PriceCheckItem text="Unified Calendar View & Manual Entry" />
                <PriceCheckItem text="Basic Email Parsing (No custom rules)" />
                <PriceCheckItem text="Standard In-App Notifications" />
              </ul>
              {user?.plan === "free" ? (
                <button
                  disabled
                  className="w-full text-center py-4 border border-emerald-500/30 text-emerald-400 bg-emerald-500/5 rounded-2xl font-black uppercase tracking-widest text-[10px] opacity-70 cursor-not-allowed"
                >
                  Current Plan
                </button>
              ) : (
                <Link
                  href={user ? "/dashboard" : "/register"}
                  className="block text-center py-4 border border-mf-border text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white/5 transition-all active:scale-95"
                >
                  {user ? "Go to Dashboard" : "Get Started Free"}
                </Link>
              )}
            </motion.div>

            <motion.div
              className="p-10 rounded-[32px] bg-[#111827] border-2 border-mf-accent relative text-left shadow-[0_0_50px_rgba(59,130,246,0.15)]"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={springConfig}
              data-testid="pricing-paid"
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-mf-accent text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg shadow-mf-accent/30">
                Most Powerful
              </div>
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-mf-accent-light mb-6">
                Knight Tier
              </h3>
              <p className="text-6xl font-bold text-white mb-2">$100</p>
              <p className="text-mf-accent-light text-xs mb-10 font-bold uppercase tracking-widest">
                Per Month
              </p>
              <p className="text-sm text-white font-bold mb-4">
                Everything in Entry, plus:
              </p>
              <ul className="space-y-4 mb-10">
                <PriceCheckItem text="Connect up to 7 Google/Outlook accounts" />
                <PriceCheckItem text="Full 7-Agent autonomous suite" />
                <PriceCheckItem text="Pinecone long-term behavior memory" />
                <PriceCheckItem text="Priority LLM Processing & Conflict Logic" />
                <PriceCheckItem text="Automated Rebuttals & Email Drafting" />
              </ul>
              {user?.plan === "paid" ? (
                <button
                  disabled
                  className="w-full text-center py-4 border border-mf-accent text-mf-accent bg-mf-accent/10 rounded-2xl font-black uppercase tracking-widest text-[10px] cursor-not-allowed"
                >
                  Knight Tier Active
                </button>
              ) : (
                <button
                  onClick={handleStripeCheckout}
                  disabled={isCheckoutLoading}
                  className="w-full block text-center py-4 bg-mf-accent hover:bg-mf-accent-hover text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-mf-accent/20 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isCheckoutLoading ? "Loading..." : "Go Unlimited"}
                </button>
              )}
            </motion.div>
          </div>

          <p className="mt-12 text-sm text-mf-text-secondary font-medium italic">
            Active users (10+ meetings/week) are eligible for{" "}
            <span className="text-mf-accent-light">60% developer rebates</span>.
          </p>
        </div>
      </section>

      <section className="py-32 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={springConfig}
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-4xl md:text-6xl font-bold mb-6 text-white tracking-tighter">
            Ready to reclaim your time?
          </h2>
          <p className="text-mf-text-secondary mb-12 text-lg">
            Join the automated scheduling revolution. Let the agents handle the
            logistics.
          </p>
          <Link href={user ? "/dashboard" : "/register"}>
            <motion.button
              className="px-12 py-5 bg-mf-accent hover:bg-mf-accent-hover text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-2xl shadow-mf-accent/40"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
              data-testid="cta-signup-btn"
            >
              {user ? "Go to Dashboard" : "Create Your AI Domain"}
            </motion.button>
          </Link>
        </motion.div>
      </section>
    </div>
  );
}

function PriceCheckItem({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-3 text-sm text-mf-text-secondary font-medium">
      <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
        <Check className="w-3 h-3 text-emerald-400" />
      </div>
      {text}
    </li>
  );
}
