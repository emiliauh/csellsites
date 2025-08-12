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
