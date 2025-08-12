"use client";
import { ALL_TECHS, DEFAULT_CARRIERS, useMapStore } from "@/lib/store";

const ALL_CARRIERS = [
  "Bell","Rogers","Telus","Videotron","Freedom Mobile","SaskTel","Eastlink","Cogeco",
  "Ice Wireless","TbayTel","Sogetel","Ecotel","Execulink","Xplore Inc."
];

export default function SidePanel() {
  const { sidebarOpen, carriers, techs, set } = useMapStore();
  const toggle = (arr: string[], v: string) => {
    const s = new Set(arr); s.has(v) ? s.delete(v) : s.add(v); return Array.from(s);
  };
  return (
    <aside className={`offcanvas fixed md:static left-0 top-[64px] md:top-[64px] h-[calc(100dvh-72px)] w-[85vw] max-w-[360px] md:w-auto z-40 p-4 glass-strong ${sidebarOpen ? "open" : "closed"}`}>
      <h2 className="text-sm font-semibold mb-3">Filters</h2>
      <div className="mb-4">
        <div className="text-xs opacity-60 mb-1">Carriers</div>
        <div className="grid grid-cols-1 gap-2 max-h-52 overflow-y-auto pr-1">
          {ALL_CARRIERS.map(c => (
            <label key={c} className="flex items-center gap-3">
              <input type="checkbox" checked={carriers.includes(c)} onChange={()=>set({carriers: toggle(carriers, c)})} />
              {c}
            </label>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <button className="px-3 py-1 rounded-lg bg-white/10" onClick={()=>set({carriers: DEFAULT_CARRIERS})}>Big 3</button>
          <button className="px-3 py-1 rounded-lg bg-white/10" onClick={()=>set({carriers: []})}>Clear</button>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-xs opacity-60 mb-1">Technology</div>
        <div className="flex flex-wrap gap-2">
          {ALL_TECHS.map(t => (
            <label key={t} className="flex items-center gap-2 px-2 py-1 rounded-lg bg-white/10">
              <input type="checkbox" checked={techs.includes(t)} onChange={()=>set({techs: toggle(techs, t)})} />
              {t}
            </label>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <button className="px-3 py-1 rounded-lg bg-white/10" onClick={()=>set({techs: ALL_TECHS})}>All</button>
          <button className="px-3 py-1 rounded-lg bg-white/10" onClick={()=>set({techs: ["5GNR","5GDSS","LTE"]})}>4G/5G</button>
          <button className="px-3 py-1 rounded-lg bg-white/10" onClick={()=>set({techs: []})}>Clear</button>
        </div>
      </div>

      <div className="text-xs opacity-70">Data: ISED. Tiles from your domain.</div>
    </aside>
  );
}
