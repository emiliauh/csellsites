import { NextRequest, NextResponse } from "next/server";

const ORIGIN = "https://www.ertyu.org/steven_nikkel/cancellsites_js.php";

export async function GET(_: NextRequest) {
  const r = await fetch(ORIGIN, {
    headers: { "User-Agent": "CanadaCellMap/1.0", "Referer": "https://example.com" },
    next: { revalidate: 60 * 60 } // 1h
  });
  if (!r.ok) return NextResponse.json({ error: "Upstream error" }, { status: 502 });
  const text = await r.text();
  // find 'var db_map=[...]' JSON
  const m = text.match(/var\s+db_map\s*=\s*(\[[^;]+\])/);
  if (!m) return NextResponse.json([], { status: 200 });
  try {
    const arr = JSON.parse(m[1]);
    return NextResponse.json(arr, { headers: { "Cache-Control": "public, max-age=3600" } });
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
