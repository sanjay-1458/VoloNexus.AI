import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatApiError(detail: any): string {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail
      .map((e: any) =>
        e && typeof e.msg === "string" ? e.msg : JSON.stringify(e),
      )
      .filter(Boolean)
      .join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  if (detail && typeof detail.message === "string") return detail.message;
  return String(detail);
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatTime(date: string | Date): string {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateTime(date: string | Date): string {
  return `${formatDate(date)} at ${formatTime(date)}`;
}

export function getEventTypeColor(type: string): string {
  const colors: Record<string, string> = {
    meeting: "#3B82F6",
    interview: "#8B5CF6",
    zoom_call: "#06B6D4",
    gym: "#10B981",
    travel: "#F59E0B",
    other: "#6B7280",
  };
  return colors[type] || colors.other;
}

export function getPriorityBadge(priority: string): {
  color: string;
  label: string;
} {
  const badges: Record<string, { color: string; label: string }> = {
    critical: { color: "bg-red-500/20 text-red-400", label: "Critical" },
    high: { color: "bg-orange-500/20 text-orange-400", label: "High" },
    medium: { color: "bg-blue-500/20 text-blue-400", label: "Medium" },
    low: { color: "bg-gray-500/20 text-gray-400", label: "Low" },
  };
  return badges[priority] || badges.medium;
}
