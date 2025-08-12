export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";

const ORIGIN = "https://www.ertyu.org/steven_nikkel/cancellsites_js.php";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36";

export async function GET(_: NextRequest) {
  const r = await fetch(ORIGIN, {
    headers: {
      "User-Agent": UA,
      "Referer": "https://www.ertyu.org/steven_nikkel/cancellsites.html",
      "Accept": "text/html,*/*"
    },
    cache: "no-store"
  });
  if (!r.ok) return NextResponse.json({ error: "Upstream error", status: r.status }, { status: 502 });
  const text = await r.text();
  const m = text.match(/var\s+db_map\s*=\s*(\[[^;]+\])/);
  let arr: any[] = [];
  if (m) { try { arr = JSON.parse(m[1]); } catch {} }
  return NextResponse.json(arr, { headers: { "Cache-Control": "public, max-age=3600" } });
}
