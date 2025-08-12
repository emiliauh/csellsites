# Canada Cell Sites (Leaflet + Next.js)

A sleek, mobile-friendly viewer for Canadian cellular tower sites. Uses OpenStreetMap base tiles and (for MVP) proxies the CanCellSites overlays and click popups through Next.js API routes to avoid CORS and to add caching.

> **Attribution**: Data originates from ISED via CanCellSites by Steven Nikkel. Keep OpenStreetMap attribution visible.

## Stack
- Next.js (App Router) + TypeScript
- TailwindCSS for "liquid glass" UI
- Leaflet / react-leaflet
- API routes: `/api/tile`, `/api/point`, `/api/pid`

## Run locally
```bash
pnpm i   # or npm i / yarn
pnpm dev # http://localhost:3000
```

## Deploy (Vercel)
- Push this folder to a Git repo and "Import Project" in Vercel.
- Build command: `next build`
- Output: `.vercel/output` (handled automatically by Next.js)

## Notes
- Be respectful of the upstream site; the API routes cache responses.
- For production, replace the upstream with your own ISED pipeline (PostGIS + vector tiles).
