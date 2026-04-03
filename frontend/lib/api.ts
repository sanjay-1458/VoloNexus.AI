import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 120000,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      originalRequest.url?.includes("/auth/refresh") ||
      originalRequest.url?.includes("/auth/logout")
    ) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("auth:unauthorized"));
      }
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (
        typeof window !== "undefined" &&
        window.location.pathname === "/login"
      ) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await api.post("/auth/refresh");

        processQueue(null, "refreshed");
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);

        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("auth:unauthorized"));
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post("/auth/register", data),
  verifyEmail: (email: string, otp: string) =>
    api.post("/auth/verify-email", { email, otp }),
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me"),
  refresh: () => api.post("/auth/refresh"),
  forgotPassword: (email: string) =>
    api.post("/auth/forgot-password", { email }),
  resetPassword: (token: string, password: string) =>
    api.post("/auth/reset-password", { token, password }),
};

export const eventsApi = {
  list: (params?: any) => api.get("/events", { params }),
  getById: (id: string) => api.get(`/events/${id}`),
  create: (data: any) => api.post("/events", data),
  update: (id: string, data: any) => api.patch(`/events/${id}`, data),
  cancel: (id: string) => api.patch(`/events/${id}/cancel`),
  delete: (id: string) => api.delete(`/events/${id}`),
  bulkDelete: (ids: string[]) => api.delete("/events/bulk", { data: { ids } }),
  deletePattern: (title: string, start_time: string) =>
    api.delete("/events/pattern", { data: { title, start_time } }),
  upcoming: (limit?: number) =>
    api.get("/events/upcoming", { params: { limit } }),
  stats: () => api.get("/events/stats"),
  freeSlots: (date: string, duration?: number) =>
    api.get("/events/free-slots", { params: { date, duration } }),
  simulate: (data: any) => api.post("/events/simulate", data),
};

export const accountsApi = {
  list: () => api.get("/accounts"),
  add: (email: string, type: string = "google") =>
    api.post("/accounts", { email, type }),
  remove: (id: string) => api.delete(`/accounts/${id}`),
  setPrimary: (id: string) => api.patch(`/accounts/${id}/primary`),
  getOAuthUrl: () => api.get("/accounts/google/auth-url"),
  syncCalendar: (id: string) => api.post(`/accounts/${id}/sync`),
};

export const settingsApi = {
  getProfile: () => api.get("/settings/profile"),
  updateProfile: (data: any) => api.patch("/settings/profile", data),
  updatePreferences: (data: any) => api.patch("/settings/preferences", data),
  updateRules: (rules: any[]) =>
    api.patch("/settings/automation-rules", { rules }),
  deleteAccount: () => api.delete("/users/me"),
};

export const testimonialsApi = {
  getPublic: (limit?: number) =>
    api.get("/testimonials", { params: { limit } }),
  submit: (rating: number, review: string) =>
    api.post("/testimonials", { rating, review }),
};

export const aiApi = {
  chat: (message: string, history?: any[]) =>
    api.post("/ai/chat", {
      message,
      history,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }),
  getHistory: () => api.get("/ai/history"),
  schedule: (input: string) => api.post("/ai/schedule", { input }),
  resolveConflict: (
    eventId: string,
    conflictingEventId: string,
    choice?: string,
  ) =>
    api.post("/ai/resolve-conflict", {
      event_id: eventId,
      conflicting_event_id: conflictingEventId,
      choice,
    }),
  getContext: () => api.get("/ai/context"),
};

export const bugsApi = {
  submit: (data: any) => api.post("/bugs", data),
};

export const adminApi = {
  analytics: () => api.get("/admin/analytics"),
  users: (plan?: string) => api.get("/admin/users", { params: { plan } }),
  revenue: () => api.get("/admin/revenue"),
  eventsAnalytics: () => api.get("/admin/events/analytics"),
  syncActive: () => api.get("/admin/sync-active"),
  agentStatus: () => api.get("/admin/agents/status"),
  agentLogs: (agent?: string) =>
    api.get("/admin/agents/logs", { params: { agent } }),
  apiHealth: () => api.get("/admin/api-health"),
  llmMetrics: () => api.get("/admin/llm-metrics"),
  subscriptions: () => api.get("/admin/subscriptions"),
  reviews: () => api.get("/admin/reviews"),
  bugs: (params?: any) => api.get("/bugs", { params }),
  updateBugStatus: (id: string, status: string, notes?: string) =>
    api.patch(`/bugs/${id}/status`, { status, admin_notes: notes }),
  deleteBug: (id: string) => api.delete(`/admin/bugs/${id}`),
};

export default api;
