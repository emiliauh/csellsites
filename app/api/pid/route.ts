export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";

const ORIGIN = "https://www.ertyu.org/steven_nikkel";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36";

export async function GET(req: NextRequest) {
  const ds = req.nextUrl.searchParams.get("ds") ?? "0";
  const url = `${ORIGIN}/pid-map.php?ds=${encodeURIComponent(ds)}`;
  const r = await fetch(url, {
    headers: {
      "User-Agent": UA,
      "Referer": "https://www.ertyu.org/steven_nikkel/cancellsites.html",
      "Accept": "application/json,text/plain;q=0.9,*/*;q=0.8"
    },
    cache: "no-store"
  });
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    return NextResponse.json({ error: "Upstream error", status: r.status, detail: text.slice(0, 200) }, { status: 502 });
  }
  const text = await r.text();
  return new NextResponse(text, {
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=3600" }
  });
}
