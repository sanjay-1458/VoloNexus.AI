"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { aiApi } from "@/lib/api";
import { formatDate, formatTime } from "@/lib/utils";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Send,
  Bot,
  BrainCircuit,
  Calendar as CalendarIcon,
  Clock,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  CalendarDays,
  MapPin,
  Video,
  AlignLeft,
  X,
  Info,
  Eraser,
  Ban,
} from "lucide-react";
import api from "@/lib/api";

const springConfig = { type: "spring", stiffness: 120, damping: 20 } as const;

interface Message {
  role: "user" | "assistant" | "system" | "error";
  content: string;
}

interface AppEvent {
  _id: string;
  title: string;
  start_time: string;
  end_time: string;
  severity_score?: number;
  status: string;
  description?: string;
  location?: string;
  meeting_link?: string;
  type?: string;
}

export default function AssistantPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [cooldown, setCooldown] = useState(0);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());

  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [events, setEvents] = useState<AppEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);

  const [showDetails, setShowDetails] = useState<AppEvent | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    window.scrollTo(0, 0);
    const timer = setTimeout(() => window.scrollTo(0, 0), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const ONE_HOUR = 3600000;
    const interval = setInterval(() => {
      if (Date.now() - lastActivity > ONE_HOUR) {
        handleClearChat();
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [lastActivity]);

  const formatDateRange = (date: Date) => {
    return date
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
      .replace(/\//g, "-");
  };

  const fetchEvents = useCallback(async () => {
    if (!user || weekDates.length === 0) return;
    try {
      const start = new Date(weekDates[0]);
      start.setHours(0, 0, 0, 0);
      const end = new Date(weekDates[6]);
      end.setHours(23, 59, 59, 999);

      const res = await api.get(
        `/events?start_date=${start.toISOString()}&end_date=${end.toISOString()}`,
      );
      setEvents(res.data || []);
    } catch (err) {
      console.error("Sync error", err);
    }
  }, [user, weekDates]);

  useEffect(() => {
    if (!user) return;
    const loadHistory = async () => {
      try {
        const res = await aiApi.getHistory();
        if (res.data?.length > 0) {
          setMessages(res.data);
        } else {
          setMessages([
            {
              role: "assistant",
              content:
                "Hello! I am your scheduling assistant. How can I help you today?",
            },
          ]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsInitialLoading(false);
      }
    };
    loadHistory();
  }, [user]);

  useEffect(() => {
    const today = new Date();
    const monday = new Date(today);
    const dayOfWeek = today.getDay();
    const diffToMonday =
      today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
    monday.setDate(diffToMonday + weekOffset * 7);
    monday.setHours(0, 0, 0, 0);

    const week = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      week.push(d);
    }
    setWeekDates(week);

    if (weekOffset === 0) {
      today.setHours(0, 0, 0, 0);
      setSelectedDate(today);
    } else {
      setSelectedDate(week[0]);
    }
  }, [weekOffset]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, loading]);

  const handleSend = async (customMsg?: string) => {
    const userMsg = customMsg || input.trim();
    if (!userMsg || loading || cooldown > 0) return;

    if (userMsg.toLowerCase() === "clear") {
      handleClearChat();
      setInput("");
      return;
    }

    setLastActivity(Date.now());
    if (!customMsg) setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const { data } = await aiApi.chat(
        userMsg,
        messages.filter((m) => m.role !== "error"),
      );
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response },
      ]);
      if (data.refreshNeeded) await fetchEvents();
      setCooldown(60);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "error",
          content: "Connection lost. Please check your network and retry.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = async () => {
    setMessages([
      {
        role: "assistant",
        content: "Chat history cleared. How can I help you today?",
      },
    ]);

    try {
      await api.delete("/ai/history");
    } catch (err) {
      console.error("Failed to clear backend history", err);
    }
  };

  const handleResend = () => {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMsg) handleSend(lastUserMsg.content);
  };

  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const dailyEvents = events.filter(
    (e) =>
      new Date(e.start_time).toDateString() === selectedDate.toDateString() &&
      e.status !== "cancelled",
  );

  if (authLoading)
    return (
      <div className="h-screen flex items-center justify-center text-white bg-mf-bg">
        <RefreshCw className="w-5 h-5 animate-spin text-mf-accent" />
      </div>
    );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-[1400px] mx-auto px-6 py-8 min-h-[calc(100vh-4rem)] flex flex-col lg:flex-row gap-8"
    >
      <div className="flex-1 flex flex-col bg-mf-secondary border border-mf-border rounded-3xl shadow-2xl overflow-hidden min-h-[50vh] max-h-[80vh] lg:max-h-[85vh]">
        <div className="p-6 border-b border-mf-border bg-mf-bg/40 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-mf-accent/10 flex items-center justify-center border border-mf-accent/20">
              <Bot className="w-6 h-6 text-mf-accent" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                VoloNexus.AI Orchestrator
              </h2>
              <p className="text-[10px] text-mf-text-secondary uppercase font-bold tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Live Sync Enabled
              </p>
            </div>
          </div>
          <button
            onClick={handleClearChat}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-red-500/10 hover:text-red-400 text-mf-text-secondary text-xs font-bold rounded-xl transition-all border border-transparent hover:border-red-500/20"
          >
            <Eraser size={14} /> Clear
          </button>
        </div>

        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide"
        >
          {messages.map((msg, i) => (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              key={`${i}-${msg.content.substring(0, 10)}`}
              className={`flex flex-col ${
                msg.role === "user" ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`max-w-[85%] px-5 py-4 rounded-2xl text-[15px] leading-relaxed shadow-sm ${
                  msg.role === "user"
                    ? "bg-mf-accent text-white rounded-tr-none"
                    : msg.role === "error"
                      ? "bg-red-500/10 text-red-400 border border-red-500/20"
                      : "bg-mf-card border border-mf-border text-mf-text rounded-tl-none"
                }`}
              >
                {msg.role === "assistant" ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      table: ({ node, ...props }) => (
                        <div className="overflow-x-auto my-4 rounded-xl border border-mf-border">
                          <table
                            className="w-full text-sm text-left border-collapse bg-mf-bg/30"
                            {...props}
                          />
                        </div>
                      ),
                      thead: ({ node, ...props }) => (
                        <thead
                          className="bg-white/5 text-white/90 text-xs uppercase tracking-wider border-b border-mf-border"
                          {...props}
                        />
                      ),
                      th: ({ node, ...props }) => (
                        <th className="px-4 py-3 font-bold" {...props} />
                      ),
                      td: ({ node, ...props }) => (
                        <td
                          className="px-4 py-3 border-b border-mf-border/30 text-white/80 last:border-b-0"
                          {...props}
                        />
                      ),
                      h3: ({ node, ...props }) => (
                        <h3
                          className="text-[16px] font-bold text-white mt-6 mb-3 flex items-center gap-2"
                          {...props}
                        />
                      ),
                      ul: ({ node, ...props }) => (
                        <ul
                          className="space-y-2 my-4 pl-5 list-disc marker:text-mf-accent/70"
                          {...props}
                        />
                      ),
                      li: ({ node, ...props }) => (
                        <li
                          className="text-white/80 leading-relaxed"
                          {...props}
                        />
                      ),
                      p: ({ node, ...props }) => (
                        <p
                          className="mb-4 last:mb-0 text-white/90"
                          {...props}
                        />
                      ),
                      hr: ({ node, ...props }) => (
                        <hr className="my-6 border-mf-border/60" {...props} />
                      ),
                      strong: ({ node, ...props }) => (
                        <strong
                          className="text-mf-accent font-semibold"
                          {...props}
                        />
                      ),
                      em: ({ node, ...props }) => (
                        <em
                          className="text-mf-text-secondary italic"
                          {...props}
                        />
                      ),
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  msg.content
                )}

                {msg.role === "error" && (
                  <button
                    onClick={handleResend}
                    className="mt-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-red-400 hover:text-red-300 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" /> Retry Last Request
                  </button>
                )}
              </div>
            </motion.div>
          ))}

          {isInitialLoading && (
            <div className="flex gap-3 items-center text-[10px] font-bold uppercase tracking-widest text-mf-text-secondary opacity-50">
              <BrainCircuit className="w-4 h-4 text-mf-accent animate-pulse" />
              Recalibrating Context...
            </div>
          )}

          {loading && (
            <div className="flex gap-3 items-center text-sm text-mf-text-secondary">
              <BrainCircuit className="w-5 h-5 text-mf-accent animate-spin-slow" />
              Analyzing Schedule...
            </div>
          )}
        </div>

        <div className="p-6 border-t border-mf-border bg-mf-bg/30">
          <div className="relative flex items-center">
            <input
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              disabled={loading || cooldown > 0}
              placeholder={
                cooldown > 0
                  ? `One minute buffer so that ai can handle request (${cooldown}s)`
                  : "Type your command..."
              }
              className="w-full pl-5 pr-16 py-4 bg-mf-card border border-mf-border rounded-2xl text-sm text-white outline-none focus:border-mf-accent focus:ring-1 focus:ring-mf-accent/30 transition-all placeholder:text-mf-text-secondary/50"
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || cooldown > 0 || !input.trim()}
              className="absolute right-3 p-2.5 rounded-xl bg-mf-accent text-white disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 transition-all shadow-lg shadow-mf-accent/20 flex items-center justify-center"
            >
              {cooldown > 0 ? (
                <Ban className="w-5 h-5" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          <div className="mt-3 -mb-3 text-center text-[10px] text-mf-text-secondary opacity-50">
            To prevent overload, please wait 60 seconds between messages.
          </div>
        </div>
      </div>

      <div className="w-full lg:w-[420px] flex flex-col gap-6">
        <div className="bg-mf-secondary border border-mf-border rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-mf-accent" />
              <h3 className="text-sm font-bold text-white uppercase tracking-tight">
                Timeline
              </h3>
            </div>
            <div className="flex items-center bg-mf-bg/50 rounded-xl p-1 border border-mf-border">
              <button
                onClick={() => setWeekOffset((p) => p - 1)}
                className="p-2 hover:bg-white/5 rounded-lg text-mf-text-secondary transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="h-4 w-[1px] bg-mf-border mx-1" />
              <button
                onClick={() => setWeekOffset((p) => p + 1)}
                className="p-2 hover:bg-white/5 rounded-lg text-mf-text-secondary transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="mb-6 px-1">
            <p className="text-[10px] text-mf-text-secondary uppercase font-black tracking-widest mb-1 opacity-70">
              Active Window
            </p>
            <p className="text-sm text-white font-mono flex items-center gap-2">
              {weekDates.length > 0 && (
                <>
                  <span className="text-mf-accent">
                    {formatDateRange(weekDates[0])}
                  </span>
                  <span className="text-mf-text-secondary italic px-1">to</span>
                  <span className="text-mf-accent">
                    {formatDateRange(weekDates[6])}
                  </span>
                </>
              )}
            </p>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {weekDates.map((date, i) => {
              const isSelected =
                date.toDateString() === selectedDate.toDateString();
              const isToday = date.toDateString() === new Date().toDateString();
              const disabled = isPastDate(date);
              return (
                <button
                  key={i}
                  onClick={() => !disabled && setSelectedDate(date)}
                  className={`flex flex-col items-center py-3 rounded-2xl transition-all border ${
                    isSelected
                      ? "bg-mf-accent border-mf-accent text-white shadow-lg shadow-mf-accent/30"
                      : "bg-mf-bg/30 border-transparent hover:border-mf-border text-mf-text-secondary"
                  } ${disabled ? "opacity-20 cursor-not-allowed grayscale" : ""}`}
                >
                  <span className="text-[9px] uppercase font-bold mb-1 opacity-60">
                    {date.toLocaleDateString("en-US", { weekday: "short" })}
                  </span>
                  <span
                    className={`text-base font-black ${
                      isToday && !isSelected ? "text-mf-accent" : ""
                    }`}
                  >
                    {date.getDate()}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-mf-secondary border border-mf-border rounded-3xl p-6 shadow-xl flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-mf-accent" />
              <h3 className="text-sm font-bold text-white uppercase tracking-tight">
                {selectedDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}{" "}
                Agenda
              </h3>
            </div>
            <div className="text-[10px] font-bold text-mf-text-secondary bg-mf-bg px-2.5 py-1 rounded-full border border-mf-border">
              {dailyEvents.length} Tasks
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
            {dailyEvents.length > 0 ? (
              dailyEvents.map((event) => (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={event._id}
                  onClick={() => setShowDetails(event)}
                  className="p-4 bg-mf-card border border-mf-border rounded-2xl hover:border-mf-accent/40 hover:bg-mf-accent/[0.02] transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm font-bold text-white group-hover:text-mf-accent transition-colors">
                      {event.title}
                    </h4>
                    <ChevronRight className="w-4 h-4 text-mf-text-secondary group-hover:text-mf-accent transition-colors" />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-mf-text-secondary">
                    <div className="flex items-center gap-1.5 bg-mf-bg/80 px-2 py-1 rounded-lg border border-mf-border">
                      <Clock className="w-3 h-3 text-mf-accent" />
                      {new Date(event.start_time).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-mf-text-secondary/40 py-12">
                <div className="w-16 h-16 rounded-full bg-mf-bg/50 flex items-center justify-center mb-4 border border-mf-border/50">
                  <CalendarIcon className="w-8 h-8 opacity-20" />
                </div>
                <p className="text-sm font-medium">Agenda Clear</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showDetails && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDetails(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={springConfig}
              className="relative w-full max-w-md bg-[#111827] border border-[#1F2937] rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-mf-accent/10 rounded-2xl">
                  <Info className="w-6 h-6 text-mf-accent" />
                </div>
                <button
                  onClick={() => setShowDetails(null)}
                  className="p-2 hover:bg-white/5 rounded-full text-mf-text-secondary hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-white leading-tight">
                    {showDetails.title}
                  </h2>
                  {showDetails.type && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-mf-text-secondary uppercase">
                      {showDetails.type}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-mf-accent font-medium">
                  <CalendarIcon className="w-4 h-4" />
                  {formatDate(showDetails.start_time)}
                </div>
              </div>

              <div className="space-y-4 text-sm text-mf-text-secondary">
                <div className="flex items-center gap-3 p-4 bg-mf-bg rounded-2xl border border-mf-border">
                  <Clock className="w-5 h-5 text-white/50" />
                  <span className="text-white font-medium">
                    {formatTime(showDetails.start_time)} -{" "}
                    {formatTime(showDetails.end_time)}
                  </span>
                </div>

                {showDetails.location && (
                  <div className="flex items-center gap-3 p-4 bg-mf-bg rounded-2xl border border-mf-border">
                    <MapPin className="w-5 h-5 text-white/50" />
                    <span className="text-white">{showDetails.location}</span>
                  </div>
                )}

                {showDetails.meeting_link && (
                  <div className="flex items-center gap-3 p-4 bg-mf-bg rounded-2xl border border-mf-border">
                    <Video className="w-5 h-5 text-white/50" />
                    <a
                      href={showDetails.meeting_link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-mf-accent hover:underline break-all"
                    >
                      {showDetails.meeting_link}
                    </a>
                  </div>
                )}

                {showDetails.description && (
                  <div className="p-4 bg-mf-bg rounded-2xl border border-mf-border">
                    <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider text-white/50">
                      <AlignLeft className="w-3.5 h-3.5" /> Description
                    </div>
                    <p className="text-white/80 leading-relaxed whitespace-pre-wrap">
                      {showDetails.description}
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowDetails(null)}
                className="w-full mt-8 py-3.5 bg-white/5 hover:bg-white/10 border border-white/5 text-white font-bold rounded-xl transition-all"
              >
                Close Details
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
