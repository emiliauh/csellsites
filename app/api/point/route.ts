import { NextRequest, NextResponse } from "next/server";
const ORIGIN = "https://www.ertyu.org/steven_nikkel";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const ds = p.get("ds") ?? "0";
  const lat = p.get("lat"); const lng = p.get("lng"); const zoom = p.get("zoom");
  const pids = p.getAll("pid[]");
  const pidParams = pids.map(v => `pid[]=${encodeURIComponent(v)}`).join("&");
  const url = `${ORIGIN}/tower-point-server.php?lat=${lat}&lng=${lng}&zoom=${zoom}&ds=${ds}&v=2${pidParams ? `&${pidParams}` : ""}`;
  const r = await fetch(url, {
    headers: {
      "User-Agent": "CanadaCellMap/1.0",
      "Referer": "https://example.com"
    }
  });
  if (!r.ok) return NextResponse.json({ error: "Upstream error" }, { status: 502 });
  const html = await r.text();
  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
