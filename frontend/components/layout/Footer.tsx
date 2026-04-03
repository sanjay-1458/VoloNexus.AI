"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full border-t border-mf-border bg-mf-bg py-12 px-6 mt-auto">
      <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex flex-col items-center md:items-start">
          <span className="text-xl font-black tracking-tighter text-white">
            VOLO<span className="text-mf-accent">NEXUS.AI</span>
          </span>
          <p className="text-[10px] uppercase tracking-widest font-bold text-mf-text-secondary mt-2">
            © 2026 VoloNexus.AI. Orchestrating your time.
          </p>
        </div>

        <nav className="flex items-center gap-8">
          <Link
            href="/privacy"
            className="text-[10px] font-black uppercase tracking-widest text-mf-text-secondary hover:text-mf-accent transition-colors"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="text-[10px] font-black uppercase tracking-widest text-mf-text-secondary hover:text-mf-accent transition-colors"
          >
            Terms
          </Link>
          <Link
            href="mailto:support@volonexus.ai"
            className="text-[10px] font-black uppercase tracking-widest text-mf-text-secondary hover:text-mf-accent transition-colors"
          >
            Support
          </Link>
        </nav>
      </div>
    </footer>
  );
}
