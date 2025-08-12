"use client";
import { useMapStore } from "@/lib/store";

export default function TopBar() {
  const { sidebarOpen, set } = useMapStore();
  return (
    <header className="sticky top-0 z-50">
      <div className="glass-strong mx-2 my-2">
        <div className="px-4 py-3 flex items-center justify-between">
          <button className="md:hidden" onClick={()=>set({sidebarOpen: !sidebarOpen})} aria-label="Toggle filters">
            ☰
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-2xl bg-white/10 grid place-items-center">📍</div>
            <span className="font-semibold">Canada Cell Sites</span>
          </div>
          <div className="w-10" />
        </div>
      </div>
    </header>
  );
}
