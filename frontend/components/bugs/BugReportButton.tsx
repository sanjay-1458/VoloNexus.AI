"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { bugsApi } from "@/lib/api";
import {
  Bug,
  X,
  Camera,
  Upload,
  Send,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

const springConfig = { type: "spring", stiffness: 120, damping: 20 } as const;

export default function BugReportButton() {
  const [open, setOpen] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("medium");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setScreenshot(event.target?.result as string);
    reader.readAsDataURL(file);
  };

  const initCaptureMode = () => {
    setOpen(false);
    setIsCapturing(true);
  };

  const executeScreenCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "browser" },
      });

      const video = document.createElement("video");
      video.srcObject = stream;
      await video.play();

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

      const base64Image = canvas.toDataURL("image/jpeg", 0.8);
      stream.getTracks().forEach((track) => track.stop());

      setScreenshot(base64Image);
    } catch (err) {
      console.error("Screen capture failed or was cancelled", err);
    } finally {
      setIsCapturing(false);
      setOpen(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await bugsApi.submit({
        description,
        severity,
        screenshots: screenshot ? [screenshot] : [],
        page_url: typeof window !== "undefined" ? window.location.pathname : "",
        browser_info:
          typeof navigator !== "undefined" ? navigator.userAgent : "",
      });
      setSubmitted(true);
      setTimeout(() => {
        setOpen(false);
        setTimeout(() => {
          setSubmitted(false);
          setDescription("");
          setScreenshot(null);
        }, 500);
      }, 2500);
    } catch (err) {
      console.error("Bug submission failed", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {!open && (
        <motion.button
          onClick={isCapturing ? executeScreenCapture : () => setOpen(true)}
          className={`fixed bottom-6 left-6 z-40 w-14 h-14 rounded-full text-white flex items-center justify-center shadow-xl border-2 transition-all ${
            isCapturing
              ? "bg-red-500 animate-pulse shadow-red-500/40 border-red-400"
              : "bg-red-500 hover:bg-red-600 shadow-red-500/20 border-white/10"
          }`}
          whileHover={{ scale: 1.1, rotate: isCapturing ? 0 : 5 }}
          whileTap={{ scale: 0.9 }}
          data-testid="bug-report-btn"
        >
          {isCapturing ? (
            <Camera className="w-6 h-6" />
          ) : (
            <Bug className="w-6 h-6" />
          )}
        </motion.button>
      )}

      <AnimatePresence>
        {isCapturing && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-0 inset-x-0 h-14 bg-red-500/90 backdrop-blur-md z-50 flex items-center justify-center text-white font-bold text-sm shadow-xl border-b border-red-400"
          >
            Navigate to the error, then click the pulsing Camera icon in the
            bottom left!
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0">
            <motion.div
              className="absolute inset-0 bg-[#0B0F1A]/80 backdrop-blur-[10px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />

            <motion.div
              className="relative w-full max-w-lg bg-[#111827] border border-[#1F2937] rounded-[28px] shadow-2xl overflow-hidden"
              initial={{ y: 100, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 100, opacity: 0, scale: 0.9 }}
              transition={springConfig}
              data-testid="bug-report-modal"
            >
              <div className="p-8">
                {submitted ? (
                  <motion.div
                    className="text-center py-12"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={springConfig}
                  >
                    <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                      Report Transmitted
                    </h2>
                    <p className="text-mf-text-secondary text-sm leading-relaxed">
                      Our core developers have been notified. <br />
                      Thanks for hardening VoloNexus.AI.
                    </p>
                  </motion.div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-red-500/10 rounded-xl border border-red-500/20">
                          <Bug className="w-5 h-5 text-red-400" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-white">
                            System Anomaly
                          </h2>
                          <p className="text-[10px] uppercase font-black tracking-widest text-mf-text-secondary">
                            Incident Report v1.0
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setOpen(false)}
                        className="p-2 hover:bg-white/5 rounded-full transition-colors text-mf-text-secondary"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid gap-2">
                        <label className="text-[10px] uppercase font-black text-mf-text-secondary tracking-widest px-1">
                          Description
                        </label>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="w-full px-5 py-4 bg-mf-bg border border-mf-border rounded-2xl outline-none focus:border-red-400/50 text-white transition-all text-sm placeholder:text-white/10"
                          rows={4}
                          placeholder="What sequence led to this behavior?"
                          required
                        />
                      </div>

                      <div className="grid gap-2">
                        <label className="text-[10px] uppercase font-black text-mf-text-secondary tracking-widest px-1">
                          Severity Level
                        </label>
                        <select
                          value={severity}
                          onChange={(e) => setSeverity(e.target.value)}
                          className="w-full px-5 py-3.5 bg-mf-bg border border-mf-border rounded-2xl text-white outline-none focus:border-red-400/50 text-sm"
                        >
                          <option value="low">Low - Minor Visual Issue</option>
                          <option value="medium">
                            Medium - Functional Hiccup
                          </option>
                          <option value="high">High - Feature Blocked</option>
                          <option value="critical">
                            Critical - System Crash
                          </option>
                        </select>
                      </div>

                      {screenshot ? (
                        <div className="relative group rounded-xl overflow-hidden border border-mf-border">
                          <img
                            src={screenshot}
                            alt="Captured Bug"
                            className="w-full h-32 object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setScreenshot(null)}
                            className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-lg text-white hover:bg-red-500 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-4">
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            accept="image/*"
                            className="hidden"
                          />

                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center justify-center gap-3 py-3 border border-mf-border rounded-2xl text-[10px] font-black uppercase tracking-widest text-mf-text-secondary hover:text-white hover:bg-white/5 transition-all group"
                          >
                            <Upload className="w-4 h-4 group-hover:scale-110 transition-transform" />{" "}
                            Upload
                          </button>

                          <button
                            type="button"
                            onClick={initCaptureMode}
                            className="flex items-center justify-center gap-3 py-3 border border-mf-border rounded-2xl text-[10px] font-black uppercase tracking-widest text-mf-text-secondary hover:text-white hover:bg-white/5 transition-all group"
                          >
                            <Camera className="w-4 h-4 group-hover:scale-110 transition-transform" />{" "}
                            Capture
                          </button>
                        </div>
                      )}

                      <motion.button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-[0.1em] text-xs rounded-2xl shadow-xl shadow-red-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        whileTap={{ scale: 0.97 }}
                      >
                        {submitting ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            Log Incident <Send className="w-4 h-4" />
                          </>
                        )}
                      </motion.button>
                    </form>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
