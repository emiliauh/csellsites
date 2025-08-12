"use client";
import dynamic from "next/dynamic";
import TopBar from "@/components/TopBar";
import SidePanel from "@/components/SidePanel";
import { useMapStore } from "@/lib/store";

const MapView = dynamic(()=>import("@/components/MapView"), { ssr: false });

export default function Page() {
  const { sidebarOpen } = useMapStore();
  return (
    <main>
      <TopBar />
      <section className="relative md:grid md:grid-cols-[360px_1fr] gap-2 px-2">
        <div className="hidden md:block"><SidePanel forceOpen /></div>
        <div className="md:hidden">
          <SidePanel />
          {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-30" />}
        </div>
        <div className="glass-strong overflow-hidden">
          <MapView />
        </div>
      </section>
    </main>
  );
}
