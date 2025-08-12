export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
const ORIGIN = "https://www.ertyu.org/steven_nikkel";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const ds = p.get("ds") ?? "0";
  const lat = p.get("lat"); const lng = p.get("lng"); const zoom = p.get("zoom");
  if (!lat || !lng || !zoom) return NextResponse.json({ error: "Missing lat/lng/zoom" }, { status: 400 });
  const pids = p.getAll("pid[]");
  const pidParams = pids.map(v => `pid[]=${encodeURIComponent(v)}`).join("&");
  const url = `${ORIGIN}/tower-point-server.php?lat=${lat}&lng=${lng}&zoom=${zoom}&ds=${ds}&v=2${pidParams ? `&${pidParams}` : ""}`;

  const r = await fetch(url, {
    headers: {
      "User-Agent": UA,
      "Referer": "https://www.ertyu.org/steven_nikkel/cancellsites.html",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
    },
    cache: "no-store"
  });
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    return NextResponse.json({ error: "Upstream error", status: r.status, detail: text.slice(0, 200) }, { status: 502 });
  }
  const html = await r.text();
  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
