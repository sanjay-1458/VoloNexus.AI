"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import {
  Menu,
  X,
  Calendar,
  LayoutDashboard,
  Users,
  Settings,
  Star,
  LogOut,
  Shield,
  ChevronDown,
  Cpu,
  Bot,
} from "lucide-react";

const springConfig = { type: "spring", stiffness: 120, damping: 20 } as const;

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const navLinks = user
    ? [
        { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { label: "Events", href: "/events", icon: Calendar },
        { label: "Accounts", href: "/accounts", icon: Users },
        { label: "Assistant", href: "/assistant", icon: Bot },
        { label: "Settings", href: "/settings", icon: Settings },
      ]
    : [
        { label: "Testimonials", href: "/testimonials", icon: Star },
        { label: "Privacy", href: "/privacy", icon: Shield },
      ];

  return (
    <nav
      className="sticky top-0 left-0 right-0 z-50 glass-morphism backdrop-blur-[10px] border-b border-white/5 bg-mf-bg/50"
      data-testid="navbar"
    >
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href={user ? "/dashboard" : "/"}
          className="flex items-center gap-2 group"
          data-testid="nav-logo"
        >
          <motion.div
            className="w-9 h-9 rounded-xl bg-mf-accent flex items-center justify-center shadow-lg shadow-mf-accent/20"
            whileHover={{ rotate: -10, scale: 1.1 }}
            transition={springConfig}
          >
            <Cpu className="w-5 h-5 text-white" />
          </motion.div>
          <span className="text-xl font-bold tracking-tight text-white group-hover:text-mf-accent transition-colors">
            Volo<span className="text-mf-accent">Nexus.AI</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link key={link.href} href={link.href}>
                <motion.button
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? "text-mf-accent bg-mf-accent/10 shadow-[inset_0_0_10px_rgba(59,130,246,0.1)]"
                      : "text-mf-text-secondary hover:text-white hover:bg-white/5"
                  }`}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  data-testid={`nav-${link.label.toLowerCase()}`}
                >
                  <link.icon
                    className={`w-4 h-4 ${isActive ? "text-mf-accent" : "text-inherit"}`}
                  />
                  {link.label}
                </motion.button>
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          {loading ? (
            <div className="w-24 h-8 rounded-lg bg-white/5 animate-pulse" />
          ) : user ? (
            <div className="relative">
              <motion.button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-2xl bg-mf-secondary border border-mf-border hover:border-mf-accent/30 transition-all"
                whileTap={{ scale: 0.97 }}
                data-testid="nav-profile-btn"
              >
                <div className="w-7 h-7 rounded-full bg-mf-accent/10 flex items-center justify-center border border-mf-accent/20">
                  <span className="text-xs font-black text-mf-accent">
                    {user.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-mf-text-secondary transition-transform duration-300 ${profileOpen ? "rotate-180" : ""}`}
                />
              </motion.button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    className="absolute right-0 top-14 w-56 bg-[#111827] border border-[#1F2937] rounded-2xl p-2 shadow-2xl backdrop-blur-xl"
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={springConfig}
                    data-testid="nav-profile-dropdown"
                  >
                    <div className="px-4 py-3 mb-2">
                      <p className="text-[10px] uppercase font-black tracking-widest text-mf-text-secondary mb-1">
                        Authenticated As
                      </p>
                      <p className="text-sm font-bold text-white truncate">
                        {user.email}
                      </p>
                    </div>

                    <div className="space-y-1">
                      {user.role === "admin" && (
                        <Link
                          href="/admin"
                          onClick={() => setProfileOpen(false)}
                        >
                          <DropdownItem
                            icon={<Shield />}
                            label="Admin Panel"
                            accent
                          />
                        </Link>
                      )}
                      <Link
                        href="/settings"
                        onClick={() => setProfileOpen(false)}
                      >
                        <DropdownItem icon={<Settings />} label="Preferences" />
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setProfileOpen(false);
                        }}
                        className="w-full group"
                        data-testid="nav-logout-btn"
                      >
                        <DropdownItem icon={<LogOut />} label="Logout" danger />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <button
                  className="px-5 py-2.5 text-xs font-bold text-mf-text-secondary hover:text-white transition-colors"
                  data-testid="nav-login-btn"
                >
                  Sign In
                </button>
              </Link>
              <Link href="/register">
                <motion.button
                  className="px-6 py-2.5 bg-mf-accent hover:bg-mf-accent-hover text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-mf-accent/20"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.96 }}
                  data-testid="nav-register-btn"
                >
                  Get Started
                </motion.button>
              </Link>
            </div>
          )}

          <button
            className="md:hidden p-2 text-mf-text-secondary hover:text-white"
            onClick={() => setMobileOpen(!mobileOpen)}
            data-testid="nav-mobile-toggle"
          >
            {mobileOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="md:hidden border-t border-white/5 bg-[#0B0F1A]/95 backdrop-blur-xl"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={springConfig}
          >
            <div className="px-6 py-6 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                >
                  <button className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl bg-white/5 text-sm font-bold text-white hover:bg-mf-accent/10 transition-all text-left">
                    <link.icon className="w-5 h-5 text-mf-accent" />
                    {link.label}
                  </button>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

function DropdownItem({
  icon,
  label,
  accent,
  danger,
}: {
  icon: any;
  label: string;
  accent?: boolean;
  danger?: boolean;
}) {
  return (
    <div
      className={`
      flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all
      ${danger ? "text-red-400 hover:bg-red-400/10" : "text-mf-text-secondary hover:text-white hover:bg-white/5"}
      ${accent ? "text-mf-accent-light" : ""}
    `}
    >
      <span className={accent ? "text-mf-accent" : "text-inherit"}>
        {React.cloneElement(icon as any, { size: 16 })}
      </span>
      {label}
    </div>
  );
}
