
"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { useMapStore } from "@/lib/store";

// Small default marker fix for Leaflet in Next.js
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
}

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
    return () => { map.off("moveend zoomend", update); }
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

  return (
    <MarkerClusterGroup chunkedLoading>
      {features.map((f, i) => {
        const [lng, lat] = f.geometry.coordinates;
        return (
          <Marker key={i} position={[lat, lng]}>
            <Popup>
              <div className="text-sm space-y-1">
                <div className="font-semibold">{f.properties.site_name || f.properties.name || "Cell Site"}</div>
                <div><b>Carrier:</b> {f.properties.carrier || f.properties.operator || "—"}</div>
                <div><b>Tech:</b> {f.properties.technology || f.properties.tech || "—"}</div>
                <div><b>Bands:</b> {f.properties.bands || f.properties.band || "—"}</div>
                {f.properties.enb && <div><b>eNB:</b> {f.properties.enb}</div>}
                {f.properties.gnb && <div><b>gNB:</b> {f.properties.gnb}</div>}
                {f.properties.address && <div><b>Address:</b> {f.properties.address}</div>}
                {/* fallback: render all props */}
                <details className="mt-1">
                  <summary>All fields</summary>
                  <pre className="text-xs overflow-auto max-h-48">{JSON.stringify(f.properties, null, 2)}</pre>
                </details>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MarkerClusterGroup>
  );
}

export default function MapView(){
  return (
    <MapContainer center={[56,-96]} zoom={4} className="h-[calc(100dvh-84px)] w-full" preferCanvas>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
      <SitesLayer />
    </MapContainer>
  );
}
