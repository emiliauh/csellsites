"use client";
import { MapPin, Github, Link2 } from "lucide-react";

export default function TopBar() {
  return (
    <header className="sticky top-0 z-50">
      <div className="glass">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-2xl bg-white/10 grid place-items-center"><MapPin size={16} /></div>
            <span className="font-semibold">Canada Cell Sites</span>
            <span className="text-xs opacity-60">OSM + Leaflet</span>
          </div>
          <nav className="flex items-center gap-2">
            <a className="btn" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
              <Link2 size={16} /> OSM Attribution
            </a>
            <a className="btn" href="https://github.com/" target="_blank" rel="noreferrer">
              <Github size={16} /> GitHub
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}
