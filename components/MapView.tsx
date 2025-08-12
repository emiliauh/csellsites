
"use client";
import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
const MapAny: any = MapContainer;
const TileAny: any = TileLayer;
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useMapStore } from "@/lib/store";
import { VectorTile } from "@mapbox/vector-tile";
import Protobuf from "pbf";
import * as cover from "@mapbox/tile-cover";
import ClusteredMarkers from "./ClusteredMarkers";
import { getTile, setTile } from "@/lib/tileCache";

const TILES_URL = process.env.NEXT_PUBLIC_TILES_URL || "https://cancellsites.yaemi.one/site_data/{z}/{x}/{y}.pbf";
const LAYER_NAME = process.env.NEXT_PUBLIC_TILES_LAYER || "site_data";
const MAX_CONCURRENCY = 6;
const MAX_TILE_Z = 15;
const MIN_TILE_Z = 8;

const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25,41], iconAnchor: [12,41]
});
(L.Marker.prototype as any).options.icon = DefaultIcon;

type Feature = {
  type: "Feature",
  geometry: { type: "Point", coordinates: [number, number] },
  properties: Record<string, any>
};

function useDebounced<T>(value: T, delay = 150){
  const [v, setV] = useState(value);
  useEffect(()=>{ const t = setTimeout(()=>setV(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return v;
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
  const res = await fetch(replaceTemplate(z,x,y), { cache: "force-cache", signal });
  if(!res.ok) return null;
  const buf = new Uint8Array(await res.arrayBuffer());
  setTile(z,x,y, buf);
  return buf;
}

function decodeFeatures(buf: Uint8Array, x:number, y:number, z:number): Feature[]{
  const vt = new VectorTile(new Protobuf(buf));
  const layer = (vt.layers as any)[LAYER_NAME];
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

function pLimit(concurrency: number){
  const queue: Array<() => Promise<void>> = [];
  let active = 0;
  const run = async () => {
    if (active >= concurrency || queue.length === 0) return;
    active++;
    const job = queue.shift()!;
    try { await job(); } finally { active--; run(); }
  };
  return function add<T>(fn: () => Promise<T>): Promise<T>{
    return new Promise<T>((resolve, reject)=>{
      queue.push(async () => {
        try { const v = await fn(); resolve(v); } catch(e){ reject(e as any); }
      });
      run();
    });
  }
}

function useViewportFeatures(map: any, carriers: string[], techs: string[]){
  const bbox = useBbox(map);
  const zoom = map.getZoom();
  const key = useDebounced(`${bbox?.join(",")}|${Math.round(zoom)}|${carriers.join(",")}|${techs.join(",")}`, 150);
  const [features, setFeatures] = useState<Feature[]>([]);
  const ctrl = useRef<AbortController | null>(null);

  useEffect(()=>{
    if(!bbox) return;
    ctrl.current?.abort();
    const ac = new AbortController();
    ctrl.current = ac;

    (async () => {
      const zView = map.getZoom();
      const z = Math.min(MAX_TILE_Z, Math.max(MIN_TILE_Z, Math.round(zView)));
      const [west, south, east, north] = bbox!;
      const gj: any = { type: "Polygon", coordinates: [[[west, south],[east, south],[east, north],[west, north],[west, south]]] };
      const tiles = (cover.tiles as any)(gj, { min_zoom: z, max_zoom: z }) as [number,number,number][];

      const throttled = pLimit(MAX_CONCURRENCY);
      const results: Feature[] = [];

      const carriersL = carriers.map(c=>c.toLowerCase());
      const techsL = techs.map(t=>t.toLowerCase());

      const pushAndRender = (newFeats: Feature[]) => {
        results.push(...newFeats);
        const partial = results.filter(f => {
          const [lng, lat] = f.geometry.coordinates;
          if (lng < west || lng > east || lat < south || lat > north) return false;
          const props = f.properties || {};
          const carrier = String(props.carrier || props.operator || props.provider || props.company || "").toLowerCase();
          const tech = String(props.technology || props.tech || props.network || "").toLowerCase();
          if (carriersL.length && !carriersL.some(c => carrier.includes(c))) return false;
          if (techsL.length && !techsL.some(t => tech.includes(t))) return false;
          return true;
        });
        setFeatures(partial);
      };

      await Promise.all(tiles.map(([x,y]) => throttled(async () => {
        if (ac.signal.aborted) return;
        try {
          const buf = await fetchTile(z, x, y, ac.signal);
          if (!buf) return;
          const feats = decodeFeatures(buf, x, y, z);
          pushAndRender(feats);
        } catch {}
      })));
    })();

    return () => ac.abort();
  }, [key]);

  return { features, zoom };
}

function SitesLayer(){
  const map = useMap();
  const { carriers, techs, sidebarOpen } = useMapStore();
  const { features, zoom } = useViewportFeatures(map, carriers, techs);
  useEffect(()=>{ setTimeout(()=>map.invalidateSize(), 200); }, [sidebarOpen, map]);
  return <ClusteredMarkers features={features} zoom={zoom} />;
}

export default function MapView(){
  return (
    <MapAny center={[56,-96]} zoom={4} className="h-[calc(100dvh-84px)] w-full" preferCanvas>
      <TileAny url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
      <SitesLayer />
    </MapAny>
  );
}
