export function buildTileUrl(ds: string, pid?: string) {
  const base = `/api/tile?x={x}&y={y}&z={z}&ds=${encodeURIComponent(ds)}`;
  return pid ? `${base}&pid=${encodeURIComponent(pid)}` : base;
}
