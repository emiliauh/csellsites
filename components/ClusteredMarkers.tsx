
"use client";
import { useMemo } from "react";
import Supercluster from "supercluster";
import { Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";

type Feature = {
  type: "Feature",
  geometry: { type: "Point", coordinates: [number, number] },
  properties: Record<string, any>
};

function bandChips(raw?: string) {
  if (!raw) return null;
  const parts = String(raw).replace(/[\[\]\(\)]/g, "").split(/[,\s\/]+/).filter(Boolean);
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {parts.slice(0, 12).map((b, i) => (
        <span key={i} className="px-1.5 py-0.5 rounded-md text-xs bg-white/10">{b}</span>
      ))}
    </div>
  );
}

function getProp(p: Record<string,any>, keys: string[]) {
  for (const k of keys) {
    if (p[k] !== undefined && p[k] !== null && String(p[k]).length) return p[k];
  }
  return undefined;
}

export default function ClusteredMarkers({ features, zoom, declusterAt=13 }: { features: Feature[], zoom: number, declusterAt?: number }){
  const map = useMap();

  // At high zoom show raw points (no clustering)
  if (zoom >= declusterAt) {
    return <>
      {features.map((f, i) => {
        const [lng, lat] = f.geometry.coordinates;
        const props = f.properties || {};
        const name = getProp(props, ["site_name","name","siteid","id"]) || "Cell Site";
        const carrier = getProp(props, ["carrier","operator","provider","company"]) || "—";
        const tech = getProp(props, ["technology","tech","network"]) || "—";
        const bands = getProp(props, ["bands","band","freq","frequencies"]) || undefined;
        const enb = getProp(props, ["enb","eNB","ENB"]);
        const gnb = getProp(props, ["gnb","gNB","GNB"]);
        const addr = getProp(props, ["address","addr","site_addr"]);
        return (
          <Marker key={`pt-${i}`} position={[lat, lng]}>
            <Popup>
              <div className="text-sm space-y-1">
                <div className="font-semibold">{String(name)}</div>
                <div><b>Carrier:</b> {String(carrier)}</div>
                <div><b>Tech:</b> {String(tech)}</div>
                {bands && <div><b>Bands:</b> {String(bands)} {bandChips(String(bands))}</div>}
                {enb && <div><b>eNB:</b> {String(enb)}</div>}
                {gnb && <div><b>gNB:</b> {String(gnb)}</div>}
                {addr && <div><b>Address:</b> {String(addr)}</div>}
                <details className="mt-1">
                  <summary>All fields</summary>
                  <pre className="text-xs overflow-auto max-h-48">{JSON.stringify(props, null, 2)}</pre>
                </details>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>;
  }

  // Otherwise cluster
  const index = useMemo(()=>{
    const pts = features.map(f => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: f.geometry.coordinates },
      properties: { ...f.properties }
    })) as any[];
    const sc = new Supercluster({ radius: 60, maxZoom: 18 });
    sc.load(pts);
    return sc;
  }, [features]);

  const bounds = map.getBounds();
  const bbox: [number, number, number, number] = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];
  const clusters = useMemo(()=> index.getClusters(bbox, Math.round(zoom)), [index, zoom, bbox.join(",")]);

  return (<>
    {clusters.map((c: any, i: number) => {
      const [lng, lat] = c.geometry.coordinates;
      if (c.properties.cluster) {
        const count = c.properties.point_count as number;
        const size = 28 + Math.min(24, Math.log(count+1)*6);
        const icon = L.divIcon({
          html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;display:flex;align-items:center;justify-content:center;background:rgba(59,130,246,0.92);color:#fff;font-weight:700;">${count}</div>`,
          className: ""
        });
        return (
          <Marker key={`cl-${i}`} position={[lat, lng]} {...({ icon } as any)}
            eventHandlers={{ click: () => {
              const expansionZoom = 18; // force zoom in deep; decluster handles points
              map.setView([lat, lng], Math.max(expansionZoom, declusterAt), { animate: true });
            }}} />
        );
      } else {
        const props = c.properties || {};
        const name = getProp(props, ["site_name","name","siteid","id"]) || "Cell Site";
        const carrier = getProp(props, ["carrier","operator","provider","company"]) || "—";
        const tech = getProp(props, ["technology","tech","network"]) || "—";
        const bands = getProp(props, ["bands","band","freq","frequencies"]) || undefined;
        const enb = getProp(props, ["enb","eNB","ENB"]);
        const gnb = getProp(props, ["gnb","gNB","GNB"]);
        const addr = getProp(props, ["address","addr","site_addr"]);
        return (
          <Marker key={`pt-${i}`} position={[lat, lng]}>
            <Popup>
              <div className="text-sm space-y-1">
                <div className="font-semibold">{String(name)}</div>
                <div><b>Carrier:</b> {String(carrier)}</div>
                <div><b>Tech:</b> {String(tech)}</div>
                {bands && <div><b>Bands:</b> {String(bands)} {bandChips(String(bands))}</div>}
                {enb && <div><b>eNB:</b> {String(enb)}</div>}
                {gnb && <div><b>gNB:</b> {String(gnb)}</div>}
                {addr && <div><b>Address:</b> {String(addr)}</div>}
                <details className="mt-1">
                  <summary>All fields</summary>
                  <pre className="text-xs overflow-auto max-h-48">{JSON.stringify(props, null, 2)}</pre>
                </details>
              </div>
            </Popup>
          </Marker>
        );
      }
    })}
  </>);
}
