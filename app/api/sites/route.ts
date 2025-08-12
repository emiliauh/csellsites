
import { NextRequest, NextResponse } from "next/server";

// MVT decoding
import { VectorTile } from "@mapbox/vector-tile";
import Protobuf from "pbf";
import tilebelt from "@mapbox/tilebelt";

const TILES_TMPL = process.env.TILES_URL || process.env.NEXT_PUBLIC_TILES_URL || "https://cancellsites.yaemi.one/site_data/{z}/{x}/{y}.pbf";
const LAYER_NAME = process.env.TILES_LAYER || "site_data";

type Bbox = [number, number, number, number];

function parseBbox(bboxStr: string): Bbox {
  const [w,s,e,n] = bboxStr.split(",").map(Number);
  return [w,s,e,n];
}

function replaceTmpl(z:number,x:number,y:number){
  return TILES_TMPL.replace("{z}", String(z)).replace("{x}", String(x)).replace("{y}", String(y));
}

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const bboxParam = searchParams.get("bbox");
  const zoomParam = searchParams.get("z") || searchParams.get("zoom");
  const carriers = (searchParams.get("carriers") || "").split(",").filter(Boolean).map(s=>s.toLowerCase());
  const techs = (searchParams.get("techs") || "").split(",").filter(Boolean).map(s=>s.toLowerCase());

  if(!bboxParam){
    return NextResponse.json({ error: "Missing bbox" }, { status: 400 });
  }
  const bbox = parseBbox(bboxParam);
  const z = Math.max(5, Math.min(14, Number(zoomParam || 10))); // clamp

  // find tiles covering bbox at z
  const tiles: [number,number,number][] = tilebelt.tiles(bbox, z).map(t => [t[0], t[1], z]);

  const features: any[] = [];
  for(const [x,y,zz] of tiles){
    const url = replaceTmpl(zz,x,y);
    const res = await fetch(url, { cache: "no-store" });
    if(!res.ok) continue;
    const buf = new Uint8Array(await res.arrayBuffer());
    const vt = new VectorTile(new Protobuf(buf));
    const layer = vt.layers[LAYER_NAME];
    if(!layer) continue;
    for(let i=0;i<layer.length;i++){
      const feat = layer.feature(i).toGeoJSON(x,y,zz);
      const [lng, lat] = feat.geometry.coordinates;
      // filter to bbox
      if(lng < bbox[0] || lng > bbox[2] || lat < bbox[1] || lat > bbox[3]) continue;
      const props = feat.properties || {};
      const carrier = String(props.carrier || props.operator || "").toLowerCase();
      const tech = String(props.technology || props.tech || "").toLowerCase();

      if(carriers.length && !carriers.some(c => carrier.includes(c))) continue;
      if(techs.length && !techs.some(t => tech.includes(t))) continue;

      features.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: [lng, lat] },
        properties: props
      });
    }
  }

  return NextResponse.json({ type: "FeatureCollection", features });
}
