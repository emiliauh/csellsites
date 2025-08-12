
"use client";
import { useEffect, useMemo, useState } from "react";
import Supercluster from "supercluster";
import { Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";

type Feature = {
  type: "Feature",
  geometry: { type: "Point", coordinates: [number, number] },
  properties: Record<string, any>
};

type Props = { features: Feature[] };

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

export default function ClusteredMarkers({ features }: Props){
  const map = useMap();
  const bbox = useBbox(map);
  const zoom = map.getZoom();

  const index = useMemo(()=>{
    const pts = features.map(f => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: f.geometry.coordinates },
      properties: { ...f.properties }
    })) as any[];
    const sc = new Supercluster({
      radius: 60, // px
      maxZoom: 18
    });
    sc.load(pts);
    return sc;
  }, [features]);

  const clusters = useMemo(()=>{
    if(!bbox) return [];
    // bbox as [west, south, east, north]
    return index.getClusters(bbox, Math.round(zoom));
  }, [index, bbox, zoom]);

  return (<>
    {clusters.map((c: any, i: number) => {
      const [lng, lat] = c.geometry.coordinates;
      if (c.properties.cluster) {
        const count = c.properties.point_count;
        const size = 30 + Math.min(20, Math.log(count+1)*5);
        const icon = L.divIcon({
          html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;display:flex;align-items:center;justify-content:center;background:rgba(59,130,246,0.9);color:#fff;font-weight:700;">${count}</div>`,
          className: ""
        });
        return (
          <Marker key={`cl-${i}`} position={[lat, lng]} icon={icon}
            eventHandlers={{ click: () => {
              const expansionZoom = Math.min(index.getClusterExpansionZoom(c.id), 18);
              map.setView([lat, lng], expansionZoom, { animate: true });
            }}} />
        );
      } else {
        // Single point
        return (
          <Marker key={`pt-${i}`} position={[lat, lng]}>
            <Popup>
              <div className="text-sm space-y-1">
                <div className="font-semibold">{c.properties.site_name || c.properties.name || "Cell Site"}</div>
                <div><b>Carrier:</b> {c.properties.carrier || c.properties.operator || "—"}</div>
                <div><b>Tech:</b> {c.properties.technology || c.properties.tech || "—"}</div>
                <div><b>Bands:</b> {c.properties.bands || c.properties.band || "—"}</div>
                {c.properties.enb && <div><b>eNB:</b> {c.properties.enb}</div>}
                {c.properties.gnb && <div><b>gNB:</b> {c.properties.gnb}</div>}
                {c.properties.address && <div><b>Address:</b> {c.properties.address}</div>}
                <details className="mt-1">
                  <summary>All fields</summary>
                  <pre className="text-xs overflow-auto max-h-48">{JSON.stringify(c.properties, null, 2)}</pre>
                </details>
              </div>
            </Popup>
          </Marker>
        );
      }
    })}
  </>);
}
