"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  Star,
  Quote,
  Sparkles,
  Zap,
  MessageSquare,
  ArrowRight,
} from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";

const springConfig = { type: "spring", stiffness: 120, damping: 20 } as const;

const mockTestimonials = [
  {
    id: "m1",
    user_name: "Sarah Jenkins",
    company: "TechFlow",
    review:
      "VoloNexus.AI didn't just organize my calendar; it gave me back 10 hours a week. The agent swarm handles conflicts better than any assistant I've ever had.",
    rating: 5,
  },
  {
    id: "m2",
    user_name: "Marcus Chen",
    company: "Zenith Agency",
    review:
      "The multi-account sync is flawless. Managing 7 different client domains used to be a nightmare. Now, the AI orchestrator keeps everything perfectly aligned.",
    rating: 5,
  },
  {
    id: "m3",
    user_name: "Elena Rodriguez",
    company: "Innovate Inc.",
    review:
      "I was skeptical about AI scheduling, but the natural language processing is incredible. I just type 'find time for sync' and it's done.",
    rating: 5,
  },
  {
    id: "m4",
    user_name: "David Kim",
    company: "Global Ops",
    review:
      "The Knight Tier is worth every penny. Persistent behavior memory means the agents actually learn how I prefer to work over time.",
    rating: 5,
  },
  {
    id: "m5",
    user_name: "Lisa Thompson",
    company: "Freelance",
    review:
      "Beautiful UI and even better logic. It handles rescheduling via email automatically, which has been a game-changer for my client relations.",
    rating: 5,
  },
  {
    id: "m6",
    user_name: "James Wilson",
    company: "CloudScale",
    review:
      "The autonomous rescheduling is spooky good. It handled a 50-person conflict across three timezones without me lifting a finger. Pure magic.",
    rating: 5,
  },
];

export default function TestimonialsPage() {
  const [index, setIndex] = useState(0);
  const router = useRouter();
  const { user } = useAuth();

  const nextTestimonial = useCallback(() => {
    setIndex((prev) => (prev + 1) % mockTestimonials.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(nextTestimonial, 3000);
    return () => clearInterval(timer);
  }, [nextTestimonial]);

  const getCardStyles = (i: number) => {
    const diff =
      (i - index + mockTestimonials.length) % mockTestimonials.length;
    if (diff === 0) return "center";
    if (diff === 1) return "right";
    if (diff === mockTestimonials.length - 1) return "left";
    return "hidden";
  };

  const handleJoinNetwork = () => {
    if (user) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  };

  return (
    <div
      className="max-w-[1200px] mx-auto py-12"
      data-testid="testimonials-page"
    >
      <header className="text-center mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springConfig}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-mf-accent/10 border border-mf-accent/20 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-mf-accent-light" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-mf-accent-light">
              User Intelligence
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tighter mb-4">
            Trusted by the <span className="text-mf-accent">Swarm</span>
          </h1>
          <p className="text-mf-text-secondary text-lg max-w-2xl mx-auto">
            Real feedback from developers and managers orchestrating their time
            with VoloNexus.AI.
          </p>
        </motion.div>
      </header>

      <div className="relative h-[550px] flex items-center justify-center overflow-hidden mb-32">
        <div className="flex items-center justify-center w-full max-w-6xl relative h-full">
          <AnimatePresence mode="popLayout">
            {mockTestimonials.map((t, i) => {
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
                    "absolute w-full max-w-[400px] p-8 rounded-[32px] border transition-all duration-700 ease-in-out flex flex-col h-[350px]",
                    isCenter
                      ? "bg-[#111827] border-mf-accent shadow-[0_0_50px_rgba(59,130,246,0.15)]"
                      : "bg-[#111827]/50 border-[#1F2937]",
                  )}
                >
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-mf-accent/5 blur-3xl rounded-full" />

                  <Quote
                    className={cn(
                      "w-10 h-10 mb-4 transition-opacity duration-700 ease-in-out",
                      isCenter
                        ? "text-mf-accent opacity-20"
                        : "text-white opacity-5",
                    )}
                  />

                  <div className="flex-1">
                    <p
                      className={cn(
                        "text-sm leading-relaxed mb-6 italic font-medium transition-colors duration-700 ease-in-out",
                        isCenter ? "text-mf-text" : "text-mf-text-secondary",
                      )}
                    >
                      "{t.review}"
                    </p>
                  </div>

                  {t.rating >= 4 && isCenter && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mb-6 px-3 py-2 rounded-xl bg-mf-accent/5 border border-mf-accent/10 flex items-center gap-2 w-fit"
                    >
                      <Zap className="w-3 h-3 text-mf-accent" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-mf-accent-light">
                        AI Summary: Verified
                      </span>
                    </motion.div>
                  )}

                  <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/5">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-700 ease-in-out",
                          isCenter
                            ? "bg-mf-accent text-white"
                            : "bg-mf-bg border border-white/5 text-mf-accent",
                        )}
                      >
                        <span className="text-xs font-black">
                          {t.user_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p
                          className={cn(
                            "text-sm font-bold transition-colors duration-700 ease-in-out",
                            isCenter ? "text-white" : "text-mf-text-secondary",
                          )}
                        >
                          {t.user_name}
                        </p>
                        <p className="text-[10px] font-bold text-mf-text-secondary uppercase tracking-widest">
                          {t.company}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={cn(
                            "w-3 h-3 transition-all duration-700 ease-in-out",
                            star <= t.rating && isCenter
                              ? "text-mf-accent fill-mf-accent shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                              : star <= t.rating
                                ? "text-mf-accent/50 fill-mf-accent/50"
                                : "text-white/10",
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      <footer className="text-center">
        <div className="p-12 rounded-[32px] bg-mf-accent/5 border border-mf-accent/20 relative overflow-hidden max-w-4xl mx-auto">
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-white mb-4">
              Ready to optimize your own domain?
            </h2>
            <button
              onClick={handleJoinNetwork}
              className="px-10 py-4 bg-mf-accent hover:bg-mf-accent-hover text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-mf-accent/30 transition-all duration-300 ease-in-out active:scale-95 cursor-pointer flex items-center justify-center gap-3 mx-auto group"
            >
              Join the Networkk{" "}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          </div>
          <div className="absolute top-1/2 left-0 -translate-y-1/2 opacity-10">
            <MessageSquare className="w-48 h-48 text-mf-accent" />
          </div>
        </div>
      </footer>
    </div>
  );
}
