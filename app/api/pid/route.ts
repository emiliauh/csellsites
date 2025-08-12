import { NextRequest, NextResponse } from "next/server";

const ORIGIN = "https://www.ertyu.org/steven_nikkel";

export async function GET(req: NextRequest) {
  const ds = req.nextUrl.searchParams.get("ds") ?? "0";
  const url = `${ORIGIN}/pid-map.php?ds=${encodeURIComponent(ds)}`;
  const r = await fetch(url, {
    headers: {
      "User-Agent": "CanadaCellMap/1.0",
      "Referer": "https://example.com"
    },
    // cache server-side for 6 hours
    next: { revalidate: 60 * 60 * 6 }
  });
  if (!r.ok) return NextResponse.json({ error: "Upstream error" }, { status: 502 });
  const text = await r.text();
  return new NextResponse(text, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
