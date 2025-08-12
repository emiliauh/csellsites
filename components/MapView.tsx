
"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
const MapAny: any = MapContainer;
const TileAny: any = TileLayer;
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useMapStore } from "@/lib/store";
import Supercluster from "supercluster";
import { VectorTile } from "@mapbox/vector-tile";
import Protobuf from "pbf";
import tilebelt from "@mapbox/tilebelt";
import ClusteredMarkers from "./ClusteredMarkers";
import { getTile, setTile } from "@/lib/tileCache";

const TILES_URL = process.env.NEXT_PUBLIC_TILES_URL || "https://cancellsites.yaemi.one/site_data/{z}/{x}/{y}.pbf";
const LAYER_NAME = process.env.NEXT_PUBLIC_TILES_LAYER || "site_data";

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

function replaceTemplate(z:number,x:number,y:number){
  return TILES_URL.replace("{z}", String(z)).replace("{x}", String(x)).replace("{y}", String(y));
}

async function fetchTile(z:number,x:number,y:number, signal: AbortSignal): Promise<Uint8Array | null>{
  const cached = getTile(z,x,y);
  if(cached) return cached;
  const res = await fetch(replaceTemplate(z,x,y), { cache: "no-store", signal });
  if(!res.ok) return null;
  const buf = new Uint8Array(await res.arrayBuffer());
  setTile(z,x,y, buf);
  return buf;
}

function decodeFeatures(buf: Uint8Array, x:number, y:number, z:number): Feature[]{
  const vt = new VectorTile(new Protobuf(buf));
  const layer = vt.layers[LAYER_NAME];
  if(!layer) return [];
  const out: Feature[] = [];
  for(let i=0;i<layer.length;i++){
    const f = layer.feature(i).toGeoJSON(x,y,z);
    if(f && f.geometry && f.geometry.coordinates){
      out.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: f.geometry.coordinates as [number,number] },
        properties: f.properties || {}
      });
    }
  }
  return out;
}

function useViewportFeatures(map: any, carriers: string[], techs: string[]){
  const bbox = useBbox(map);
  const [features, setFeatures] = useState<Feature[]>([]);
  const ctrl = useRef<AbortController | null>(null);

  useEffect(()=>{
    if(!bbox) return;
    ctrl.current?.abort();
    const ac = new AbortController();
    ctrl.current = ac;

    (async () => {
      const zoom = map.getZoom();
      const z = Math.max(5, Math.min(14, Math.round(zoom)));
      // tiles covering bbox
      const tiles = tilebelt.tiles(bbox as any, z) as [number,number,number][];
      const results: Feature[] = [];
      for(const t of tiles){
        const [x,y] = t;
        try {
          const buf = await fetchTile(z,x,y, ac.signal);
          if(!buf) continue;
          const feats = decodeFeatures(buf, x, y, z);
          results.push(...feats);
        } catch {}
      }

      // filter by bbox again (tile decode can include edges) + by carrier/tech
      const [west,south,east,north] = bbox!;
      const carriersL = carriers.map(c=>c.toLowerCase());
      const techsL = techs.map(t=>t.toLowerCase());
      const filtered = results.filter(f => {
        const [lng, lat] = f.geometry.coordinates;
        if(lng < west || lng > east || lat < south || lat > north) return false;
        const props = f.properties || {};
        const carrier = String(props.carrier || props.operator || "").toLowerCase();
        const tech = String(props.technology || props.tech || "").toLowerCase();
        if(carriersL.length && !carriersL.some(c => carrier.includes(c))) return false;
        if(techsL.length && !techsL.some(t => tech.includes(t))) return false;
        return true;
      });

      setFeatures(filtered);
    })();

    return () => ac.abort();
  }, [bbox?.join(","), map, carriers.join(","), techs.join(",")]);

  return { bbox, features };
}

function SitesLayer(){
  const map = useMap();
  const { carriers, techs, sidebarOpen } = useMapStore();
  const { features } = useViewportFeatures(map, carriers, techs);

  // Resize after panel toggle
  useEffect(()=>{ setTimeout(()=>map.invalidateSize(), 250); }, [sidebarOpen, map]);

  return <ClusteredMarkers features={features} />;
}

export default function MapView(){
  return (
    <MapAny center={[56,-96]} zoom={4} className="h-[calc(100dvh-84px)] w-full" preferCanvas>
      <TileAny url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
      <SitesLayer />
    </MapAny>
  );
}
