"use client";
import dynamic from "next/dynamic";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.vectorgrid";
import { useEffect } from "react";
import { useMapStore } from "@/lib/store";

const TILES_URL = process.env.NEXT_PUBLIC_TILES_URL || "https://cancellsites.yaemi.one/tiles/sites/{z}/{x}/{y}.pbf";

const colorByTech = (t?: string) => {
  if (!t) return "#9aa0a6";
  const u = t.toUpperCase();
  if (u.startsWith("5G")) return "#8a5cff";
  if (u.includes("LTE") || u === "4G") return "#22c55e";
  if (u.includes("HSPA") || u.includes("UMTS") || u === "3G") return "#2563eb";
  if (u.includes("GSM") || u === "2G") return "#e11d48";
  return "#9aa0a6";
};

function SitesLayer() {
  const map = useMap();
  const { carriers, techs, sidebarOpen } = useMapStore();

  useEffect(() => {
    const vg: any = (L as any).vectorGrid.protobuf(TILES_URL, {
      rendererFactory: L.canvas.tile,
      vectorTileLayerStyles: {
        sites: (p: any) => {
          const cOK = carriers.length ? carriers.includes(p.carrier) : true;
          const tOK = techs.length ? techs.includes(p.technology) : true;
          if (!(cOK && tOK)) return { radius: 0, fillOpacity: 0, opacity: 0 };
          return { radius: 3, weight: 0, fillOpacity: .85, fillColor: colorByTech(p.technology) };
        }
      },
      interactive: true,
      getFeatureId: (f: any) => f.id,
      maxNativeZoom: 14
    });

    vg.on("click", (e: any) => {
      const p = e.layer?.properties || {};
      L.popup().setLatLng(e.latlng).setContent(`
        <b>${p.carrier ?? p.licensee ?? "Unknown"}</b><br/>
        Tech: ${p.technology ?? "—"}<br/>
        TX: ${p.tx_mhz ?? "—"} MHz
      `).openOn(map);
    });

    vg.addTo(map);
    return () => vg.remove();
  }, [map, carriers, techs]);

  useEffect(() => { setTimeout(()=>map.invalidateSize(), 350); }, [sidebarOpen, map]);
  return null;
}

export default function MapView() {
  return (
    <MapContainer center={[56,-96]} zoom={4} className="h-[calc(100dvh-84px)] w-full" preferCanvas>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors' />
      <SitesLayer />
    </MapContainer>
  );
}
