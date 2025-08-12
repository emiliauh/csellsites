"use client";
import { useEffect, useState } from "react";
import { useMapStore } from "@/lib/store";
import { CARRIERS } from "@/lib/carriers";

export default function SidePanel() {
  const { ds, set, showBell, showRogers, showTelus, pidOther } = useMapStore();
  const [others, setOthers] = useState<{name:string; pid:number}[]>([]);

  useEffect(() => {
    fetch(`/api/pid?ds=${ds}`).then(r => r.json()).then(setOthers).catch(()=>{});
  }, [ds]);

  return (
    <aside className="md:sticky md:top-[64px] md:h-[calc(100dvh-64px)] p-4 glass rounded-none md:rounded-tr-3xl md:border-l md:border-t border-white/10">
      <h2 className="text-sm font-semibold mb-3">Filters</h2>
      <div className="space-y-2">
        <label className="flex items-center gap-3">
          <input type="checkbox" checked={showBell} onChange={e => set({showBell: e.target.checked})} />
          Bell
        </label>
        <label className="flex items-center gap-3">
          <input type="checkbox" checked={showRogers} onChange={e => set({showRogers: e.target.checked})} />
          Rogers
        </label>
        <label className="flex items-center gap-3">
          <input type="checkbox" checked={showTelus} onChange={e => set({showTelus: e.target.checked})} />
          Telus
        </label>
      </div>

      <div className="mt-4">
        <label className="block text-sm opacity-70 mb-1">Other provider</label>
        <select
          className="w-full bg-white/10 rounded-xl p-2 text-sm"
          value={pidOther ?? "0"}
          onChange={e => set({pidOther: e.target.value})}
        >
          <option value="0">All Others</option>
          {others.filter(o => !CARRIERS.find(c => c.id === String(o.pid))).map(o => (
            <option key={o.pid} value={o.pid}>{o.name}</option>
          ))}
        </select>
      </div>

      <div className="mt-4">
        <label className="block text-sm opacity-70 mb-1">Dataset</label>
        <select
          className="w-full bg-white/10 rounded-xl p-2 text-sm"
          value={ds}
          onChange={e => set({ds: e.target.value})}
        >
          <option value="0">Current</option>
          {/* You can scrape historical ds values into this list later */}
        </select>
      </div>

      <div className="mt-6 text-xs opacity-70 space-y-1">
        <p>Click the map to see tower details.</p>
        <p>Data: ISED via CanCellSites (Steven Nikkel).</p>
      </div>
    </aside>
  );
}
