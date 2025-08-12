"use client";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";
import { useMapStore } from "@/lib/store";
import { buildTileUrl } from "@/lib/buildTileUrl";

function Overlays() {
  const map = useMap();
  const { ds, showBell, showRogers, showTelus, otherPids } = useMapStore();

  useEffect(() => {
    const layers: L.TileLayer[] = [];
    const add = (pid?: string) => {
      const url = buildTileUrl(ds, pid);
      const layer = L.tileLayer(url, { tileSize: 512 as any, noWrap: true, maxZoom: 99, opacity: 1, keepBuffer: 2 });
      layer.addTo(map);
      layers.push(layer);
    };
    if (showBell) add("1");
    if (showRogers) add("3");
    if (showTelus) add("4");
    otherPids.forEach(pid => add(pid));

    return () => { layers.forEach(l => map.removeLayer(l)); };
  }, [map, ds, showBell, showRogers, showTelus, otherPids]);

  return null;
}

function ClickHandler() {
  const map = useMap();
  const { ds, showBell, showRogers, showTelus, otherPids } = useMapStore();

  useMapEvents({
    click: async (e) => {
      const params = new URLSearchParams({
        lat: String(e.latlng.lat),
        lng: String(e.latlng.lng),
        zoom: String(map.getZoom()),
        ds
      });
      if (showBell) params.append("pid[]", "1");
      if (showRogers) params.append("pid[]", "3");
      if (showTelus) params.append("pid[]", "4");
      otherPids.forEach(pid => params.append("pid[]", pid));

      const r = await fetch(`/api/point?${params.toString()}`);
      const html = await r.text();
      L.popup().setLatLng(e.latlng).setContent(html).openOn(map);
    }
  });
  return null;
}

function ResizeOnReadyAndSidebar() {
  const map = useMap();
  const { sidebarOpen } = useMapStore();
  useEffect(() => {
    map.whenReady(() => {
      setTimeout(() => map.invalidateSize(), 0);
    });
    const onResize = () => map.invalidateSize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [map]);
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 350);
  }, [sidebarOpen, map]);
  return null;
}

export default function MapView() {
  return (
    <MapContainer
      center={[45.4, -75.7]}
      zoom={5}
      className="h-[calc(100dvh-64px)] w-full"
      zoomControl={true}
      preferCanvas={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Overlays />
      <ClickHandler />
      <ResizeOnReadyAndSidebar />
    </MapContainer>
  );
}
