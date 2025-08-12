"use client";
import { MapPin, Menu } from "lucide-react";
import { useMapStore } from "@/lib/store";

export default function TopBar() {
  const { sidebarOpen, set } = useMapStore();
  return (
    <header className="sticky top-0 z-50">
      <div className="glass-strong">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <button
            className="btn rounded-xl md:hidden"
            onClick={() => set({sidebarOpen: !sidebarOpen})}
            aria-label="Toggle filters"
            title="Toggle filters"
          >
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-2xl bg-white/10 grid place-items-center"><MapPin size={16} /></div>
            <span className="font-semibold">Canada Cell Sites</span>
            <span className="text-xs opacity-60">Liquid Glass UI</span>
          </div>
          <div className="w-10" />
        </div>
      </div>
    </header>
  );
}
