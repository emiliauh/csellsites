
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

type Props = { features: Feature[]; zoom: number };

function renderEquipList(props: Record<string, any>) {
  const entries: Array<{label: string, value: string}> = [];
  const keys = Object.keys(props);
  const paired = new Set<string>();

  for (const k of keys) {
    const m = k.match(/^(.*?)(_manufacturer)$/i);
    if (!m) continue;
    const base = m[1];
    const manuf = String(props[k] ?? "").trim();
    const model = String(props[`${base}_model_no`] ?? "").trim();
    if (manuf || model) {
      const prettyLabel = base
        .replace(/^rx_?/i, "")
        .replace(/^tx_?/i, "")
        .replace(/_ant_?/i, " Antenna ")
        .replace(/_/g, " ")
        .trim();
      entries.push({ label: prettyLabel, value: [manuf, model].filter(Boolean).join(" • ") });
    }
    paired.add(base);
  }
  for (const k of keys) {
    const m = k.match(/^(.*?)(_model_no)$/i);
    if (!m) continue;
    const base = m[1];
    if (paired.has(base)) continue;
    const model = String(props[k] ?? "").trim();
    if (model) {
      const prettyLabel = base
        .replace(/^rx_?/i, "")
        .replace(/^tx_?/i, "")
        .replace(/_ant_?/i, " Antenna ")
        .replace(/_/g, " ")
        .trim();
      entries.push({ label: prettyLabel, value: model });
    }
  }
  if (!entries.length) return null;

  return (
    <div className="mt-2">
      <div className="font-semibold mb-1">Equipment</div>
      <ul className="list-disc ml-5 space-y-1 text-xs">
        {entries.map((e, i) => (<li key={i}><b>{e.label}:</b> {e.value}</li>))}
      </ul>
    </div>
  );
}

export default function ClusteredMarkers({ features, zoom }: Props){
  const map = useMap();

  const declusterZoom = 13;
  const showSingles = zoom >= declusterZoom;

  const index = useMemo(() => {
    if (showSingles) return null;
    const pts = features.map(f => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: f.geometry.coordinates },
      properties: { ...f.properties }
    })) as any[];
    const sc = new Supercluster({ radius: 60, maxZoom: 18 });
    sc.load(pts);
    return sc;
  }, [features, showSingles]);

  const clusters = useMemo(() => {
    if (showSingles) {
      return features.map(f => ({
        geometry: { coordinates: f.geometry.coordinates },
        properties: { ...f.properties, cluster: false }
      })) as any[];
    }
    if (!index) return [];
    return index.getClusters([-180, -85, 180, 85], Math.round(zoom));
  }, [index, features, showSingles, zoom]);

  return (<>
    {clusters.map((c: any, i: number) => {
      const [lng, lat] = c.geometry.coordinates;

      if (c.properties.cluster) {
        const count = c.properties.point_count;
        const size = 30 + Math.min(20, Math.log(count + 1) * 5);
        const icon = L.divIcon({
          html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;display:flex;align-items:center;justify-content:center;background:rgba(59,130,246,0.92);color:#fff;font-weight:700;">${count}</div>`,
          className: ""
        });
        return (
          <Marker key={`cl-${i}`} position={[lat, lng]} {...({ icon } as any)}
            eventHandlers={{ click: () => {
              const expansionZoom = Math.min((index as any)!.getClusterExpansionZoom(c.id), 18);
              map.setView([lat, lng], expansionZoom, { animate: true });
            }}} />
        );
      }

      const props = c.properties || {};
      const name = props.site_name || props.name || "Cell Site";
      const area = props.area_name || props.area || props.community || props.city || "";
      const carrier = props.carrier || props.operator || props.provider || props.company || "—";
      const tech = props.technology || props.tech || props.network || "—";
      const bandsStr = props.bands || props.band || props.freq || props.frequencies || "";
      const bands = String(bandsStr || "").split(/[,\s/]+/).filter(Boolean);

      return (
        <Marker key={`pt-${i}`} position={[lat, lng]}>
          <Popup minWidth={300} maxWidth={420}>
            <div className="text-sm space-y-1">
              <div className="font-semibold text-base">{name}</div>
              {area && <div className="text-xs opacity-80 -mt-0.5">{area}</div>}
              <div><b>Carrier:</b> {carrier}</div>
              <div><b>Tech:</b> {tech}</div>
              {bands.length ? (
                <div className="flex flex-wrap gap-1 items-center">
                  <span className="font-semibold">Bands:</span>
                  {bands.map((b:string, idx:number)=>(
                    <span key={idx} className="px-1.5 py-0.5 rounded bg-gray-200 text-xs">{b}</span>
                  ))}
                </div>
              ) : null}
              {renderEquipList(props)}
              <details className="mt-1">
                <summary>All fields</summary>
                <pre className="text-xs overflow-auto max-h-56">{JSON.stringify(props, null, 2)}</pre>
              </details>
            </div>
          </Popup>
        </Marker>
      );
    })}
  </>);
}
