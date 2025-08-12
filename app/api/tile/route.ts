import { NextRequest, NextResponse } from "next/server";
const ORIGIN = "https://www.ertyu.org/steven_nikkel";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const ds = p.get("ds") ?? "0";
  const pid = p.get("pid");
  const url = `${ORIGIN}/tower-tile-server.png?x=${p.get("x")}&y=${p.get("y")}&z=${p.get("z")}&ds=${ds}${pid ? `&pid=${pid}` : ""}&v=2`;
  const r = await fetch(url, {
    headers: {
      "User-Agent": "CanadaCellMap/1.0",
      "Referer": "https://example.com"
    },
    next: { revalidate: 60 } // 60s
  });
  if (!r.ok) return NextResponse.json({ error: "Upstream error" }, { status: 502 });
  const buf = Buffer.from(await r.arrayBuffer());
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=60"
    }
  });
}
