
"use client";
import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
const MapAny: any = MapContainer;
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useMapStore } from "@/lib/store";
import ClusteredMarkers from "./ClusteredMarkers";

// Default Leaflet marker asset fix (for any non-cluster singles)
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25,41], iconAnchor: [12,41]
});
L.Marker.prototype.options.icon = DefaultIcon;

type Feature = {
  type: "Feature",
  geometry: { type: "Point", coordinates: [number, number] },
  properties: Record<string, any>
};

function useBbox(map: any){
  const [bbox, setBbox] = useState<[number,number,number,number] | null>(null);
  useEffect(()=>{
    if(!map) return;
    const update = () => {
      const b = map.getBounds();
      setBbox([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
    };
    update();
    map.on("moveend zoomend", update);
    return () => { map.off("moveend zoomend", update); };
  }, [map]);
  return bbox;
}

function SitesLayer(){
  const map = useMap();
  const bbox = useBbox(map);
  const zoom = map.getZoom();
  const { carriers, techs, sidebarOpen } = useMapStore();
  const [features, setFeatures] = useState<Feature[]>([]);
  const ctrl = useRef<AbortController | null>(null);

  useEffect(()=>{
    if(!bbox) return;
    ctrl.current?.abort();
    const ac = new AbortController();
    ctrl.current = ac;

    const qs = new URLSearchParams({
      bbox: bbox.join(","),
      z: String(zoom),
      carriers: carriers.join(","),
      techs: techs.join(",")
    });
    fetch(`/api/sites?${qs.toString()}`, { signal: ac.signal })
      .then(r => r.json())
      .then(fc => setFeatures(fc.features || []))
      .catch(()=>{});
    return () => ac.abort();
  }, [bbox?.join(","), zoom, carriers.join(","), techs.join(",")]);

  // Resize after panel toggle
  useEffect(()=>{ setTimeout(()=>map.invalidateSize(), 250); }, [sidebarOpen, map]);

  return <ClusteredMarkers features={features} />;
}

export default function MapView(){
  return (
    <MapAny center={[56,-96]} zoom={4} className="h-[calc(100dvh-84px)] w-full" preferCanvas>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
      <SitesLayer />
    </MapAny>
  );
}
