"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  Video,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  MoreVertical,
} from "lucide-react";
import { aiApi, eventsApi } from "@/lib/api";

interface EventCardProps {
  event: {
    _id: string;
    title: string;
    start_time: string;
    end_time: string;
    type: "meeting" | "task" | "travel" | "gym";
    location?: string;
    description?: string;
    is_conflict?: boolean;
    conflicting_event_id?: string;
  };
  onRefresh: () => void;
}

export default function EventCard({ event, onRefresh }: EventCardProps) {
  const [loading, setLoading] = useState(false);

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleResolve = async (choice: "reschedule" | "ignore") => {
    if (!event.conflicting_event_id) return;
    setLoading(true);
    try {
      await aiApi.resolveConflict(
        event._id,
        event.conflicting_event_id,
        choice,
      );
      onRefresh();
    } catch (error) {
      console.error("Resolution failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{
        y: -4,
        rotateX: 2,
        rotateY: -2,
        scale: 1.02,
      }}
      whileTap={{ scale: 0.96 }}
      className={`relative group p-5 rounded-3xl border transition-all ${
        event.is_conflict
          ? "bg-red-500/5 border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.1)]"
          : "bg-mf-card border-mf-border hover:border-mf-accent/50"
      }`}
    >
      {event.is_conflict && (
        <div className="absolute -top-3 left-6 px-3 py-1 bg-red-500 text-[10px] font-bold text-white rounded-full flex items-center gap-1.5 animate-pulse shadow-lg">
          <AlertTriangle className="w-3 h-3" />
          AI DETECTED CONFLICT
        </div>
      )}

      <div className="flex justify-between items-start mb-4">
        <div>
          <h3
            className={`font-bold text-lg ${event.is_conflict ? "text-red-200" : "text-white"}`}
          >
            {event.title}
          </h3>
          <div className="flex items-center gap-4 mt-2 text-mf-text-secondary text-sm">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-mf-accent" />
              {formatTime(event.start_time)} - {formatTime(event.end_time)}
            </span>
            {event.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                {event.location}
              </span>
            )}
          </div>
        </div>
        <button className="p-2 text-mf-text-secondary hover:text-white transition-colors">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      {event.is_conflict ? (
        <div className="mt-6 p-4 bg-mf-bg/50 rounded-2xl border border-red-500/20">
          <p className="text-xs text-red-200/70 mb-3">
            VoloNexus.AI suggests rescheduling this to avoid overlap with your
            previous commitment.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handleResolve("reschedule")}
              disabled={loading}
              className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
            >
              {loading ? "Processing..." : "Auto-Reschedule"}
            </button>
            <button
              onClick={() => handleResolve("ignore")}
              disabled={loading}
              className="px-4 py-2 border border-mf-border hover:bg-mf-card text-mf-text-secondary text-xs font-bold rounded-xl transition-all"
            >
              Ignore
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex items-center justify-between">
          <div
            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              event.type === "gym"
                ? "bg-green-500/10 text-green-400"
                : "bg-mf-accent/10 text-mf-accent"
            }`}
          >
            {event.type}
          </div>
          <CheckCircle2 className="w-5 h-5 text-mf-text-secondary/30 group-hover:text-mf-accent transition-colors" />
        </div>
      )}
    </motion.div>
  );
}
