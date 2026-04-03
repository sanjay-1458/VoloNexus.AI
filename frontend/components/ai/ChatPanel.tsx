"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { aiApi } from "@/lib/api";
import { useSocket } from "@/hooks/useSocket";
import { useAuth } from "@/contexts/AuthContext";
import { MessageSquare, X, Send, Bot, AlertCircle, Zap } from "lucide-react";

interface Message {
  role: "user" | "assistant" | "system" | "error";
  content: string;
  originalMessage?: string;
}

const STORAGE_KEY = "volonexus.ai_chat_history";
const SESSION_TIMEOUT = 30 * 60 * 1000;
const springConfig = { type: "spring", stiffness: 200, damping: 20 } as const;

export default function ChatPanel() {
  const { user } = useAuth();
  const userId = user?.id;

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEnd = useRef<HTMLDivElement>(null);

  const socket = useSocket(userId);

  useEffect(() => {
    const savedData = sessionStorage.getItem(STORAGE_KEY);
    if (savedData) {
      const { history, lastTimestamp } = JSON.parse(savedData);
      const isExpired = Date.now() - lastTimestamp > SESSION_TIMEOUT;

      if (isExpired || !userId) {
        clearChat();
      } else {
        setMessages(history);
      }
    } else {
      setMessages([
        {
          role: "assistant",
          content:
            "Hi! I'm VoloNexus.AI AI. I can check conflicts, book slots, or draft replies for you.",
        },
      ]);
    }
  }, [userId]);

  useEffect(() => {
    if (messages.length > 0 && userId) {
      const saveableHistory = messages.filter((m) => m.role !== "error");
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          history: saveableHistory,
          lastTimestamp: Date.now(),
        }),
      );
    }
  }, [messages, userId]);

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content:
          "Hi! I'm VoloNexus.AI AI. I can check conflicts, book slots, or draft replies for you.",
      },
    ]);
    sessionStorage.removeItem(STORAGE_KEY);
  };

  useEffect(() => {
    if (!socket) return;
    socket.on("conflict_detected", (data: any) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          content: `⚠️ Conflict Alert: overlap between "${data.event1}" and "${data.event2}".`,
        },
      ]);
      setOpen(true);
    });
    return () => {
      socket.off("conflict_detected");
    };
  }, [socket]);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (retryMsg?: string) => {
    const userMsg = retryMsg || input.trim();
    if (!userMsg || loading) return;

    if (!retryMsg) {
      setInput("");
      setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    }

    setLoading(true);
    setMessages((prev) => prev.filter((m) => m.role !== "error"));

    try {
      const currentHistory = messages.filter((m) => m.role !== "error");
      const { data } = await aiApi.chat(userMsg, currentHistory);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "error",
          content: "Connection to AI core failed.",
          originalMessage: userMsg,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.button
        onClick={() => setOpen(!open)}
        className={`fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full flex items-center justify-center transition-all ${
          open
            ? "bg-white/10 text-white border border-white/20 hover:bg-white/20"
            : "bg-mf-accent text-white shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)]"
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {open ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageSquare className="w-6 h-6" />
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed bottom-24 right-6 z-40 w-[400px] h-[650px] max-h-[80vh] bg-[#0B0F1A]/95 border border-[#1F2937] rounded-[24px] shadow-2xl flex flex-col overflow-hidden backdrop-blur-2xl"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={springConfig}
          >
            <div className="p-4 border-b border-[#1F2937] bg-white/[0.02] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-mf-accent/10 rounded-xl border border-mf-accent/20">
                  <Bot className="w-5 h-5 text-mf-accent" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white tracking-wide">
                    VoloNexus.AI AI
                  </p>
                  <p className="text-[10px] uppercase font-black tracking-widest text-emerald-400 flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />{" "}
                    Online
                  </p>
                </div>
              </div>
              <button
                onClick={clearChat}
                title="Clear conversation"
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X className="w-4 h-4 text-mf-text-secondary" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
              {messages.map((msg, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={i}
                  className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : msg.role === "error" ? "justify-center" : "flex-row"}`}
                >
                  {msg.role === "error" || msg.role === "system" ? (
                    <div
                      className={`px-4 py-3 rounded-xl text-xs font-medium flex items-center gap-2 border ${
                        msg.role === "error"
                          ? "bg-red-500/10 text-red-400 border-red-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}
                    >
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {msg.content}
                      {msg.role === "error" && (
                        <button
                          onClick={() => handleSend(msg.originalMessage)}
                          className="underline font-bold ml-2 hover:text-white transition-colors"
                        >
                          Retry
                        </button>
                      )}
                    </div>
                  ) : (
                    <div
                      className={`flex flex-col gap-1 max-w-[85%] ${msg.role === "user" ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`px-5 py-3.5 text-sm leading-relaxed shadow-sm ${
                          msg.role === "user"
                            ? "bg-mf-accent text-white rounded-[20px] rounded-br-sm shadow-[0_4px_15px_rgba(59,130,246,0.3)]"
                            : "bg-[#111827] border border-[#1F2937] text-white/90 rounded-[20px] rounded-bl-sm"
                        }`}
                      >
                        {msg.content}
                      </div>
                      <span className="text-[9px] font-bold text-mf-text-secondary uppercase tracking-widest px-2">
                        {msg.role === "user" ? "You" : "AI Agent"}
                      </span>
                    </div>
                  )}
                </motion.div>
              ))}

              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-start gap-3"
                >
                  <div className="flex flex-col items-start gap-1">
                    <div className="px-5 py-4 bg-[#111827] border border-[#1F2937] rounded-[20px] rounded-bl-sm flex items-center gap-1.5">
                      <motion.div
                        animate={{ y: [0, -4, 0] }}
                        transition={{
                          repeat: Infinity,
                          duration: 0.6,
                          delay: 0,
                        }}
                        className="w-1.5 h-1.5 bg-mf-accent rounded-full"
                      />
                      <motion.div
                        animate={{ y: [0, -4, 0] }}
                        transition={{
                          repeat: Infinity,
                          duration: 0.6,
                          delay: 0.2,
                        }}
                        className="w-1.5 h-1.5 bg-mf-accent rounded-full"
                      />
                      <motion.div
                        animate={{ y: [0, -4, 0] }}
                        transition={{
                          repeat: Infinity,
                          duration: 0.6,
                          delay: 0.4,
                        }}
                        className="w-1.5 h-1.5 bg-mf-accent rounded-full"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEnd} className="h-1" />
            </div>

            <div className="p-4 border-t border-[#1F2937] bg-[#0B0F1A]">
              <div className="relative flex items-center group">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  disabled={loading}
                  placeholder={
                    loading
                      ? "Orchestrating..."
                      : "Type a command or question..."
                  }
                  className={`w-full pl-5 pr-14 py-4 bg-[#111827] border border-[#1F2937] focus:border-mf-accent/50 rounded-[18px] text-sm text-white outline-none transition-all placeholder:text-mf-text-secondary/50 ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                />
                <button
                  onClick={() => handleSend()}
                  disabled={loading || !input.trim()}
                  className={`absolute right-2 p-2.5 rounded-xl transition-all flex items-center justify-center ${
                    input.trim() && !loading
                      ? "bg-mf-accent text-white shadow-lg shadow-mf-accent/30 hover:bg-mf-accent-light active:scale-95"
                      : "bg-white/5 text-white/30 cursor-not-allowed"
                  }`}
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </div>
              <div className="flex items-center justify-center gap-1 mt-3">
                <Zap className="w-3 h-3 text-mf-text-secondary/50" />
                <p className="text-[9px] uppercase tracking-widest font-bold text-mf-text-secondary/50 text-center">
                  Powered by VoloNexus.AI Engine
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
