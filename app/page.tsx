"use client";
import dynamic from "next/dynamic";
import TopBar from "@/components/TopBar";
import SidePanel from "@/components/SidePanel";
import { useMapStore } from "@/lib/store";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

export default function Page() {
  const { sidebarOpen } = useMapStore();
  return (
    <main className="min-h-dvh">
      <TopBar />
      <section className="relative">
        <div className="md:grid md:grid-cols-[360px_1fr]">
          {/* overlay backdrop on mobile when sidebar open */}
          <div className="md:hidden">
            <SidePanel />
            {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-30" />}
          </div>
          <div className="hidden md:block">
            <SidePanel />
          </div>
          <div>
            <MapView />
          </div>
        </div>
      </section>
    </main>
  );
}
