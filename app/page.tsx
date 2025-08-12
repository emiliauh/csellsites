"use client";
import dynamic from "next/dynamic";
import TopBar from "@/components/TopBar";
import SidePanel from "@/components/SidePanel";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

export default function Page() {
  return (
    <main className="min-h-dvh">
      <TopBar />
      <section className="grid md:grid-cols-[360px_1fr]">
        <div className="order-2 md:order-1">
          <SidePanel />
        </div>
        <div className="order-1 md:order-2">
          <MapView />
        </div>
      </section>
    </main>
  );
}
