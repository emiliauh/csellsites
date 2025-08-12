
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

// Fix default marker assets
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25,41], iconAnchor: [12,41]
});
(L.Marker as any).prototype.options.icon = DefaultIcon;

const TILES_URL = process.env.NEXT_PUBLIC_TILES_URL || "https://cancellsites.yaemi.one/site_data/{z}/{x}/{y}.pbf";
const LAYER_NAME = process.env.NEXT_PUBLIC_TILES_LAYER || "site_data";

type Feature = {
  type: "Feature",
  geometry: { type: "Point", coordinates: [number, number] },
  properties: Record<string, any>
};

function useBbox(map: any){
  const [bbox, setBbox] = useState<[number,number,number,number] | null>(null);
  const timer = useRef<any>(null);
  useEffect(()=>{
    if(!map) return;
    const schedule = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        const b = map.getBounds();
        setBbox([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
      }, 150);
    };
    schedule();
    map.on("moveend zoomend", schedule);
    return () => { map.off("moveend zoomend", schedule); if(timer.current) clearTimeout(timer.current); };
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
      const z = Math.max(5, Math.min(13, Math.round(zoom))); // cap to 13 to protect tile server
      const [west, south, east, north] = bbox;
      const poly: any = { type: "Polygon", coordinates: [[[west, south],[east, south],[east, north],[west, north],[west, south]]] };
      const tiles = cover.tiles(poly, { min_zoom: z, max_zoom: z }) as [number,number,number][];

      const carriersL = carriers.map(c=>c.toLowerCase());
      const techsL = techs.map(t=>t.toLowerCase());

      setFeatures([]);
      const results: Feature[] = [];

      const maxConcurrent = 6;
      let i = 0;
      async function worker(){
        while(i < tiles.length && !ac.signal.aborted){
          const [x,y,zz] = tiles[i++];
          try{
            const buf = await fetchTile(zz, x, y, ac.signal);
            if(!buf) continue;
            const feats = decodeFeatures(buf, x, y, zz).filter(f => {
              const [lng, lat] = f.geometry.coordinates;
              if (lng < west || lng > east || lat < south || lat > north) return false;
              const p = f.properties || {};
              const carrier = String(p.carrier || p.operator || p.provider || p.company || "").toLowerCase();
              const tech = String(p.technology || p.tech || p.network || "").toLowerCase();
              if (carriersL.length && !carriersL.some(c => carrier.includes(c))) return false;
              if (techsL.length && !techsL.some(t => tech.includes(t))) return false;
              return true;
            });
            if (feats.length){
              results.push(...feats);
              setFeatures(curr => curr.concat(feats));
            }
          } catch {}
        }
      }
      await Promise.all(new Array(Math.min(maxConcurrent, tiles.length)).fill(0).map(()=>worker()));
    })();

    return () => ac.abort();
  }, [bbox?.join(","), map, carriers.join(","), techs.join(",")]);

  return { bbox, features };
}

function SitesLayer(){
  const map = useMap();
  const { carriers, techs, sidebarOpen } = useMapStore();
  const { features } = useViewportFeatures(map, carriers, techs);
  const zoom = map.getZoom();

  useEffect(()=>{ setTimeout(()=>map.invalidateSize(), 250); }, [sidebarOpen, map]);

  return <ClusteredMarkers features={features} zoom={zoom} declusterAt={13} />;
}

export default function MapView(){
  return (
    <MapAny center={[56,-96]} zoom={4} className="h-[calc(100dvh-84px)] w-full" preferCanvas>
      <TileAny url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
      <SitesLayer />
    </MapAny>
  );
}
