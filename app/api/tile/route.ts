export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
const ORIGIN = "https://www.ertyu.org/steven_nikkel";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const ds = p.get("ds") ?? "0";
  const pid = p.get("pid");
  const x = p.get("x"), y = p.get("y"), z = p.get("z");
  const url = `${ORIGIN}/tower-tile-server.png?x=${x}&y=${y}&z=${z}&ds=${ds}${pid ? `&pid=${pid}` : ""}&v=2`;
  if (!x || !y || !z) return NextResponse.json({ error: "Missing x/y/z" }, { status: 400 });

  const upstream = await fetch(url, {
    headers: {
      "User-Agent": UA,
      "Referer": "https://www.ertyu.org/steven_nikkel/cancellsites.html",
      "Accept": "image/avif,image/webp,image/apng,image/*;q=0.8,*/*;q=0.5",
      "Accept-Language": "en-US,en;q=0.9",
      "Cache-Control": "no-cache"
    },
    cache: "no-store"
  });

  const headers: Record<string,string> = {
    "Access-Control-Expose-Headers": "X-Upstream-Status, X-Upstream-Cache",
    "X-Upstream-Status": String(upstream.status),
    "X-Upstream-Cache": upstream.headers.get("x-cache") || ""
  };

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => "");
    return NextResponse.json({ error: "Upstream error", status: upstream.status, detail: text.slice(0, 300), url }, { status: 502, headers });
  }

  const buf = Buffer.from(await upstream.arrayBuffer());
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=60",
      **headers
    }
  });
}
