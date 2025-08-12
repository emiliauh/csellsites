# Canada Cell Sites (Vector Tiles Frontend)

- Next.js (App Router)
- Leaflet + VectorGrid
- Tailwind glass UI
- Real filters: carrier + technology

## Run
```
npm i
npm run dev
```
Create `.env.local`:
```
NEXT_PUBLIC_TILES_URL=https://cancellsites.yaemi.one/site_data/{z}/{x}/{y}.pbf
```

Deploy to Vercel: add the same env var in Project → Settings → Environment Variables.

## Live clustered points

This build clusters towers client‑side using `react-leaflet-cluster` and fetches only
the points in the current viewport via `/api/sites` which decodes your t-rex `.pbf` tiles
to GeoJSON on the server.

### Env
Set one of:
- `TILES_URL=https://cancellsites.yaemi.one/site_data/{z}/{x}/{y}.pbf`
- `NEXT_PUBLIC_TILES_URL=...` (fallback)

Optional:
- `TILES_LAYER=site_data` (name of the point layer inside the MVT).

### Deploy
Works on Vercel (Edge not supported; runs on Node). Add the env vars in Project → Settings.



## v8 — Client-only MVT
- Removed `/api/sites`.
- Map fetches MVT directly from `https://cancellsites.yaemi.one/site_data/{z}/{x}/{y}.pbf` (layer `site_data`).
- Decodes in-browser and clusters with Supercluster.
- Set env: `NEXT_PUBLIC_TILES_URL` and `NEXT_PUBLIC_TILES_LAYER` if you want to override.
