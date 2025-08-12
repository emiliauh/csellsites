"use client";
import { useEffect } from "react";
import { useMapStore } from "@/lib/store";

export default function SidePanel() {
  const { ds, set, showBell, showRogers, showTelus, otherPids, providers, sidebarOpen } = useMapStore();

  // fetch datasets + providers on mount / ds change
  useEffect(() => {
    // providers list
    fetch(`/api/pid?ds=${ds}`).then(r => r.json()).then((rows) => {
      // normalize pids to strings
      const prov = rows.map((r: any) => ({ pid: String(r.pid), name: String(r.name) }));
      set({ providers: prov });
    }).catch(()=>{});
  }, [ds, set]);

  useEffect(() => {
    // populate dataset options
    fetch(`/api/dataset`).then(r => r.json()).then((rows) => {
      const sel = document.getElementById("dataset-select") as HTMLSelectElement | null;
      if (!sel) return;
      sel.innerHTML = "";
      const mk = (v: string, t: string) => {
        const o = document.createElement("option");
        o.value = v; o.textContent = t;
        if (v === ds) o.selected = true;
        sel.appendChild(o);
      };
      // Ensure 'Current' first (ds=0)
      mk("0", "Current");
      rows.forEach((row: any, idx: number) => {
        mk(String(row.value), String(row.name));
      });
    }).catch(()=>{});
  }, [ds]);

  const bigThree = new Set(["1","3","4"]);
  const others = providers.filter(p => !bigThree.has(p.pid));

  return (
    <aside
      className={`offcanvas fixed md:static left-0 top-[64px] md:top-[64px] h-[calc(100dvh-64px)] w-[85vw] max-w-[360px] md:w-auto z-40 p-4 glass-strong md:rounded-tr-3xl border-white/10 md:border-l md:border-t ${sidebarOpen ? "open" : "closed"}`}
      style={{borderTopWidth: 1, borderLeftWidth: 1}}
    >
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
        <label className="block text-sm opacity-70 mb-1">Other providers</label>
        <div className="max-h-48 overflow-y-auto pr-1 space-y-2">
          {others.map(o => (
            <label key={o.pid} className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={otherPids.includes(o.pid)}
                onChange={(e) => {
                  const next = new Set(otherPids);
                  if (e.target.checked) next.add(o.pid); else next.delete(o.pid);
                  set({ otherPids: Array.from(next) });
                }}
              />
              {o.name}
            </label>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-sm opacity-70 mb-1">Dataset</label>
        <select
          id="dataset-select"
          className="w-full bg-white/10 rounded-xl p-2 text-sm"
          value={ds}
          onChange={e => set({ds: e.target.value})}
        >
          <option value="0">Current</option>
        </select>
      </div>

      <div className="mt-6 text-xs opacity-70 space-y-1">
        <p>Click the map to see tower details.</p>
        <p>Data: ISED via CanCellSites (Steven Nikkel).</p>
      </div>
    </aside>
  );
}
