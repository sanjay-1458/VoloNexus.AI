"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { eventsApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import { formatDate, formatTime, getPriorityBadge } from "@/lib/utils";
import {
  Plus,
  Calendar,
  Clock,
  MapPin,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Zap,
  Video,
  AlignLeft,
  Repeat,
  Check,
  CheckSquare,
  Square,
  Layers,
  Info,
  Mail,
  Globe,
  Cpu,
  Search,
  Filter as FilterIcon,
} from "lucide-react";

const EVENT_TYPES = [
  "all",
  "meeting",
  "interview",
  "zoom_call",
  "gym",
  "travel",
  "other",
];

const springConfig = { type: "spring", stiffness: 120, damping: 20 } as const;

export default function EventsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);

  const [customDuration, setCustomDuration] = useState<number | "">("");
  const [customUnit, setCustomUnit] = useState<"m" | "h">("m");

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showDetails, setShowDetails] = useState<any>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "meeting",
    start_time: "",
    end_time: "",
    priority: "medium",
    location: "",
    meeting_link: "",
    recurrence_pattern: "weekly",
    recurrence_until: "",
  });

  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);
  const [minDateTime, setMinDateTime] = useState("");

  useEffect(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setMinDateTime(now.toISOString().slice(0, 16));
  }, [showCreate]);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const fetchEvents = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const params: any = {
        page,
        limit: 50,
        sort_by: "start_time",
        sort_order: "asc",
      };
      if (filter !== "all") params.type = filter;
      const { data } = await eventsApi.list(params);
      setEvents(Array.isArray(data) ? data : data.events || []);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      console.error("Failed to fetch events", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [user, filter, page]);

  const displayedEvents = useMemo(() => {
    const keywords = searchQuery
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    return events.filter((event) => {
      const matchesType = filter === "all" || event.type === filter;

      const matchesSearch = keywords.every((word) => {
        const inTitle = event.title?.toLowerCase().includes(word);
        const inDescription = event.description?.toLowerCase().includes(word);
        const inLink = event.meeting_link?.toLowerCase().includes(word);

        return inTitle || inDescription || inLink;
      });

      return matchesType && matchesSearch;
    });
  }, [events, searchQuery, filter]);


  const setQuickDuration = (minutes: number) => {
    if (!form.start_time) {
      const now = new Date();
      const offset = now.getTimezoneOffset() * 60000;
      const startIso = new Date(now.getTime() - offset)
        .toISOString()
        .slice(0, 16);
      const end = new Date(now.getTime() + minutes * 60000);
      const endIso = new Date(end.getTime() - offset)
        .toISOString()
        .slice(0, 16);
      setForm((prev) => ({ ...prev, start_time: startIso, end_time: endIso }));
    } else {
      const start = new Date(form.start_time);
      const end = new Date(start.getTime() + minutes * 60000);
      const offset = end.getTimezoneOffset() * 60000;
      const localEndIso = new Date(end.getTime() - offset)
        .toISOString()
        .slice(0, 16);
      setForm((prev) => ({ ...prev, end_time: localEndIso }));
    }
  };

  const applyCustomDuration = () => {
    if (!customDuration || customDuration <= 0) return;
    const totalMinutes =
      customUnit === "h" ? Number(customDuration) * 60 : Number(customDuration);
    setQuickDuration(totalMinutes);
    setCustomDuration("");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setCreating(true);
    let finalEndTime = form.end_time;
    if (!finalEndTime && form.start_time) {
      const start = new Date(form.start_time);
      const end = new Date(start.getTime() + 30 * 60000);
      const offset = end.getTimezoneOffset() * 60000;
      finalEndTime = new Date(end.getTime() - offset)
        .toISOString()
        .slice(0, 16);
    }

    try {
     
      const payload: any = {
        ...form,
        start_time: new Date(form.start_time).toISOString(),
        end_time: new Date(finalEndTime).toISOString(),
        is_recurring: isRecurring,
      };
      if (!isRecurring) {
        delete payload.recurrence_pattern;
        delete payload.recurrence_until;
      }
      await eventsApi.create(payload);
      setShowCreate(false);
      setIsRecurring(false);
      setShowAdvanced(false);
      setForm({
        title: "",
        description: "",
        type: "meeting",
        start_time: "",
        end_time: "",
        priority: "medium",
        location: "",
        meeting_link: "",
        recurrence_pattern: "weekly",
        recurrence_until: "",
      });
      fetchEvents();
    } catch (err: any) {
      setCreateError(err.response?.data?.message || "Failed to create event");
    } finally {
      setCreating(false);
    }
  };

  const toggleSelect = (id: string) => {
    if (!id || id === "undefined") return;
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (
      !confirm(`Are you sure you want to delete ${selectedIds.length} events?`)
    )
      return;
    try {
      await eventsApi.bulkDelete(selectedIds);
      setSelectedIds([]);
      fetchEvents();
    } catch (err) {
      console.error("Bulk delete failed", err);
    }
  };

  const handleDeletePattern = async (event: any) => {
    if (
      !confirm(
        `Delete all "${event.title}" events that occur at this specific time?`,
      )
    )
      return;
    try {
      await eventsApi.deletePattern(event.title, event.start_time);
      fetchEvents();
    } catch (err) {
      console.error("Pattern delete failed", err);
    }
  };

  const handleDeleteSingle = async (id: string) => {
    if (!id || id === "undefined") return;
    if (!confirm("Are you sure you want to delete this event?")) return;
    try {
      await eventsApi.delete(id);
      fetchEvents();
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const getSourceDisplay = (source: string) => {
    switch (source) {
      case "calendar_sync":
        return { icon: <Globe className="w-3 h-3" />, label: "Calendar" };
      case "email":
        return { icon: <Mail className="w-3 h-3" />, label: "Email" };
      case "ai":
        return { icon: <Cpu className="w-3 h-3" />, label: "AI Agent" };
      default:
        return { icon: <Zap className="w-3 h-3" />, label: "Direct" };
    }
  };

  if (authLoading || !user) return null;

  return (
    <div className="max-w-[1200px] mx-auto py-8 px-4" data-testid="events-page">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={springConfig}
        >
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-mf-accent" />
            <span className="text-[10px] uppercase tracking-widest font-bold text-mf-accent">
              VoloNexus.AI Scheduler Engine
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight flex items-center gap-4">
            Your Schedule
            {selectedIds.length > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={handleBulkDelete}
                className="ml-4 flex items-center gap-2 px-3 py-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-sm font-bold transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Delete {selectedIds.length}
              </motion.button>
            )}
          </h1>
        </motion.div>

        <motion.button
          onClick={() => setShowCreate(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold rounded-xl transition-all shadow-lg shadow-mf-accent/20"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
        >
          <Plus className="w-5 h-5" /> New Event
        </motion.button>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 flex-1">
          {EVENT_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => {
                setFilter(type);
                setPage(1);
              }}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold capitalize transition-all whitespace-nowrap border ${
                filter === type
                  ? "bg-mf-accent border-mf-accent text-white shadow-lg shadow-mf-accent/20"
                  : "bg-[#1e293b]/50 border-white/5 text-slate-400 hover:bg-[#1e293b] hover:text-white"
              }`}
            >
              {type.replace("_", " ")}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:max-w-md">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search by title, description or link..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-12 py-3.5 bg-[#0f172a] border border-white/10 rounded-2xl text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-mf-accent focus:ring-2 focus:ring-mf-accent/20 transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {(searchQuery || filter !== "all") && (
        <div className="flex items-center gap-2 mb-6 px-1">
          <FilterIcon className="w-3.5 h-3.5 text-mf-accent" />
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Filtering by:{" "}
            {filter !== "all" && (
              <span className="text-white ml-1">
                {filter.replace("_", " ")}
              </span>
            )}
            {searchQuery && (
              <span className="text-white ml-1"> + "{searchQuery}"</span>
            )}
          </span>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 w-full bg-mf-secondary/50 rounded-2xl animate-pulse border border-mf-border"
            />
          ))}
        </div>
      ) : displayedEvents.length === 0 ? (
        <motion.div
          className="text-center py-24 bg-mf-secondary/30 rounded-3xl border border-dashed border-mf-border"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-20 h-20 bg-mf-secondary rounded-full flex items-center justify-center mx-auto mb-6">
            {searchQuery ? (
              <Search className="w-10 h-10 text-mf-text-secondary opacity-20" />
            ) : (
              <Zap className="w-10 h-10 text-mf-text-secondary opacity-20" />
            )}
          </div>
          <p className="text-mf-text-secondary text-lg font-medium">
            {searchQuery
              ? `No events matching words in ${filter === "all" ? "Schedule" : filter}`
              : "No events matched your filter"}
          </p>
          <button
            onClick={() => {
              setFilter("all");
              setSearchQuery("");
            }}
            className="mt-4 text-mf-accent text-sm font-bold hover:underline"
          >
            Clear all filters
          </button>
        </motion.div>
      ) : (
        <motion.div
          className="space-y-4"
          initial="initial"
          animate="animate"
          variants={{ animate: { transition: { staggerChildren: 0.05 } } }}
        >
          {displayedEvents.map((event) => {
            const priority = getPriorityBadge(event.priority);
            const eventId = event._id || event.id;
            const isSelected = selectedIds.includes(eventId);
            const sourceInfo = getSourceDisplay(event.source);

            return (
              <motion.div
                key={eventId}
                variants={{
                  initial: { opacity: 0, y: 20 },
                  animate: { opacity: 1, y: 0 },
                }}
                transition={springConfig}
                className={`group p-5 rounded-2xl bg-[#111827] border transition-all ${
                  isSelected
                    ? "border-mf-accent bg-mf-accent/5 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                    : "border-[#1F2937] hover:border-[#3B82F6]/50"
                }`}
              >
                <div className="flex items-center gap-5">
                  <button
                    onClick={() => toggleSelect(eventId)}
                    className="flex-shrink-0 text-mf-text-secondary hover:text-mf-accent transition-colors"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-6 h-6 text-mf-accent" />
                    ) : (
                      <Square className="w-6 h-6 opacity-40 hover:opacity-100" />
                    )}
                  </button>

                  <div className="hidden md:flex flex-col items-center justify-center min-w-[60px] py-2 px-1 bg-mf-bg rounded-xl border border-white/5">
                    <span className="text-[10px] uppercase font-bold text-mf-text-secondary">
                      {new Date(event.start_time).toLocaleString("en-US", {
                        month: "short",
                      })}
                    </span>
                    <span className="text-xl font-bold text-white">
                      {new Date(event.start_time).getDate()}
                    </span>
                  </div>

                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => setShowDetails(event)}
                  >
                    <div className="flex items-center gap-3 mb-1.5">
                      <h3 className="text-lg font-bold text-white group-hover:text-mf-accent transition-colors">
                        {event.title}
                      </h3>
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[9px] font-bold text-mf-text-secondary uppercase">
                        {sourceInfo.icon} {sourceInfo.label}
                      </div>
                      {event.priority !== "medium" && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-tighter ${priority.color} border border-current/20`}
                        >
                          {priority.label}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-mf-text-secondary font-medium">
                      <span className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-mf-accent" />{" "}
                        {formatTime(event.start_time)} —{" "}
                        {formatTime(event.end_time)}
                      </span>
                      {event.location && (
                        <span className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" /> {event.location}
                        </span>
                      )}
                      {event.meeting_link && (
                        <span className="flex items-center gap-2 text-mf-accent-light">
                          <Video className="w-4 h-4" /> Link
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="hidden sm:inline-block text-[10px] px-3 py-1 rounded-lg bg-white/5 text-mf-text-secondary font-bold uppercase tracking-wider border border-white/5">
                      {event.type}
                    </span>
                    <button
                      title={`Delete pattern`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePattern(event);
                      }}
                      className="p-2.5 rounded-xl bg-mf-bg border border-white/5 text-mf-text-secondary hover:text-amber-400 hover:bg-amber-400/10 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Layers className="w-4 h-4" />
                    </button>
                    <button
                      title="Delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSingle(eventId);
                      }}
                      className="p-2.5 rounded-xl bg-mf-bg border border-white/5 text-mf-text-secondary hover:text-red-400 hover:bg-red-400/10 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {totalPages > 1 && !searchQuery && (
        <div className="flex items-center justify-center gap-6 mt-12">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="p-3 rounded-xl bg-mf-secondary border border-mf-border text-white disabled:opacity-20"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-bold text-mf-text-secondary tracking-widest uppercase">
            Page <span className="text-white">{page}</span> / {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="p-3 rounded-xl bg-mf-secondary border border-mf-border text-white disabled:opacity-20"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

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
                  <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-mf-text-secondary uppercase">
                    {showDetails.type}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-mf-accent font-medium">
                  <Calendar className="w-4 h-4" />
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

      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 overflow-y-auto pt-20 pb-10">
            <motion.div
              className="fixed inset-0 bg-[#0B0F1A]/80 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreate(false)}
            />
            <motion.div
              className="relative w-full max-w-[640px] bg-[#111827] border border-[#1F2937] rounded-[24px] shadow-2xl overflow-hidden my-auto"
              initial={{ scale: 0.9, y: 40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 40, opacity: 0 }}
              transition={springConfig}
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">
                    New Commitment
                  </h2>
                  <button
                    onClick={() => setShowCreate(false)}
                    className="p-2 hover:bg-white/5 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6 text-mf-text-secondary" />
                  </button>
                </div>
                <form onSubmit={handleCreate} className="space-y-5">
                  {createError && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
                      {createError}
                    </div>
                  )}
                  <div className="grid gap-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-mf-text-secondary px-1">
                      Event Title
                    </label>
                    <input
                      value={form.title}
                      onChange={(e) =>
                        setForm({ ...form, title: e.target.value })
                      }
                      className="w-full px-5 py-3.5 bg-mf-bg border border-mf-border rounded-2xl outline-none focus:border-mf-accent text-white"
                      placeholder="Team Sync..."
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2 relative">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-mf-text-secondary px-1">
                        Start Time
                      </label>
                      <input
                        type="datetime-local"
                        min={minDateTime}
                        value={form.start_time}
                        onChange={(e) =>
                          setForm({ ...form, start_time: e.target.value })
                        }
                        className="w-full px-5 py-3.5 bg-mf-bg border border-mf-border rounded-2xl text-white outline-none focus:border-mf-accent [color-scheme:dark]"
                        required
                      />
                    </div>
                    <div className="grid gap-2 relative">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-mf-text-secondary px-1">
                        End Time
                      </label>
                      <input
                        type="datetime-local"
                        min={form.start_time || minDateTime}
                        value={form.end_time}
                        onChange={(e) =>
                          setForm({ ...form, end_time: e.target.value })
                        }
                        className="w-full px-5 py-3.5 bg-mf-bg border border-mf-border rounded-2xl text-white outline-none focus:border-mf-accent [color-scheme:dark]"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 bg-white/5 p-2.5 rounded-xl border border-white/5">
                    <span className="text-[10px] uppercase font-bold text-mf-text-secondary px-2">
                      Duration:
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setQuickDuration(30)}
                        className="px-3 py-1.5 rounded-lg bg-mf-bg border border-mf-border text-xs text-mf-text-secondary hover:text-white transition-all"
                      >
                        30m
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickDuration(60)}
                        className="px-3 py-1.5 rounded-lg bg-mf-bg border border-mf-border text-xs text-mf-text-secondary hover:text-white transition-all"
                      >
                        1h
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={customDuration}
                        onChange={(e) =>
                          setCustomDuration(
                            e.target.value === "" ? "" : Number(e.target.value),
                          )
                        }
                        placeholder="00"
                        className="w-14 px-2 py-1.5 bg-mf-bg border border-mf-border rounded-lg text-xs text-white text-center outline-none focus:border-mf-accent"
                      />
                      <select
                        value={customUnit}
                        onChange={(e) =>
                          setCustomUnit(e.target.value as "m" | "h")
                        }
                        className="py-1.5 bg-transparent text-xs text-mf-text-secondary outline-none cursor-pointer"
                      >
                        <option value="m">min</option>
                        <option value="h">hr</option>
                      </select>
                      <button
                        type="button"
                        onClick={applyCustomDuration}
                        disabled={!customDuration}
                        className="p-1.5 rounded-lg bg-mf-accent text-white disabled:opacity-30 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-mf-text-secondary px-1">
                        Type
                      </label>
                      <select
                        value={form.type}
                        onChange={(e) =>
                          setForm({ ...form, type: e.target.value })
                        }
                        className="w-full px-5 py-3.5 bg-mf-bg border border-mf-border rounded-2xl text-white outline-none focus:border-mf-accent capitalize"
                      >
                        {EVENT_TYPES.filter((t) => t !== "all").map((type) => (
                          <option key={type} value={type}>
                            {type.replace("_", " ")}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid gap-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-mf-text-secondary px-1">
                        Priority
                      </label>
                      <select
                        value={form.priority}
                        onChange={(e) =>
                          setForm({ ...form, priority: e.target.value })
                        }
                        className="w-full px-5 py-3.5 bg-mf-bg border border-mf-border rounded-2xl text-white outline-none focus:border-mf-accent"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-mf-bg border border-mf-border">
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setIsRecurring(!isRecurring)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-xl transition-colors ${isRecurring ? "bg-mf-accent/20 text-mf-accent" : "bg-white/5 text-mf-text-secondary"}`}
                        >
                          <Repeat className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold text-white">
                          Repeat Event
                        </span>
                      </div>
                      <div
                        className={`w-10 h-5 rounded-full p-1 transition-colors ${isRecurring ? "bg-mf-accent" : "bg-white/10"}`}
                      >
                        <div
                          className={`w-3 h-3 rounded-full bg-white transition-transform ${isRecurring ? "translate-x-5" : "translate-x-0"}`}
                        />
                      </div>
                    </div>
                    <AnimatePresence>
                      {isRecurring && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="pt-4 grid grid-cols-2 gap-4 overflow-hidden"
                        >
                          <div className="grid gap-2">
                            <label className="text-[10px] uppercase font-bold text-mf-text-secondary">
                              Frequency
                            </label>
                            <select
                              value={form.recurrence_pattern}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  recurrence_pattern: e.target.value,
                                })
                              }
                              className="w-full px-4 py-2.5 bg-[#111827] border border-mf-border rounded-xl text-sm text-white"
                            >
                              <option value="daily">Daily</option>
                              <option value="weekly">Weekly</option>
                              <option value="monthly">Monthly</option>
                            </select>
                          </div>
                          <div className="grid gap-2">
                            <label className="text-[10px] uppercase font-bold text-mf-text-secondary">
                              Until Date
                            </label>
                            <input
                              type="date"
                              min={minDateTime.split("T")[0]}
                              required={isRecurring}
                              value={form.recurrence_until}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  recurrence_until: e.target.value,
                                })
                              }
                              className="w-full px-4 py-2.5 bg-[#111827] border border-mf-border rounded-xl text-sm text-white [color-scheme:dark]"
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="text-xs font-bold text-mf-text-secondary hover:text-white flex items-center gap-2 mb-3 transition-colors"
                    >
                      {showAdvanced
                        ? "Hide Advanced Details"
                        : "Show Advanced Details"}
                    </button>
                    <AnimatePresence>
                      {showAdvanced && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="space-y-4 overflow-hidden"
                        >
                          <div className="grid gap-2">
                            <label className="text-[10px] uppercase tracking-widest font-bold text-mf-text-secondary px-1 flex items-center gap-2">
                              <MapPin className="w-3 h-3" /> Location (Optional)
                            </label>
                            <input
                              value={form.location}
                              onChange={(e) =>
                                setForm({ ...form, location: e.target.value })
                              }
                              className="w-full px-5 py-3.5 bg-mf-bg border border-mf-border rounded-2xl outline-none focus:border-mf-accent text-white"
                              placeholder="Starbucks, 5th Ave"
                            />
                          </div>
                          <div className="grid gap-2">
                            <label className="text-[10px] uppercase tracking-widest font-bold text-mf-text-secondary px-1 flex items-center gap-2">
                              <Video className="w-3 h-3" /> Meeting Link
                              (Optional)
                            </label>
                            <input
                              type="url"
                              value={form.meeting_link}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  meeting_link: e.target.value,
                                })
                              }
                              className="w-full px-5 py-3.5 bg-mf-bg border border-mf-border rounded-2xl outline-none focus:border-mf-accent text-white"
                              placeholder="https://zoom.us/j/12345"
                            />
                          </div>
                          <div className="grid gap-2">
                            <label className="text-[10px] uppercase tracking-widest font-bold text-mf-text-secondary px-1 flex items-center gap-2">
                              <AlignLeft className="w-3 h-3" /> Description
                              (Optional)
                            </label>
                            <textarea
                              value={form.description}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  description: e.target.value,
                                })
                              }
                              className="w-full px-5 py-3.5 bg-mf-bg border border-mf-border rounded-2xl outline-none focus:border-mf-accent text-white resize-none h-24"
                              placeholder="Agenda for the meeting..."
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <motion.button
                    type="submit"
                    disabled={creating}
                    className="w-full py-4 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-black uppercase tracking-[0.1em] rounded-2xl transition-all shadow-xl shadow-mf-accent/10 mt-6"
                    whileTap={{ scale: 0.97 }}
                  >
                    {creating
                      ? "Saving..."
                      : isRecurring
                        ? "Save Series"
                        : "Save Event"}
                  </motion.button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
