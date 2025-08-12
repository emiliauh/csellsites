declare module "@mapbox/tile-cover" {
  export function tiles(geom: any, options: { min_zoom: number; max_zoom: number }): [number, number, number][];
}
