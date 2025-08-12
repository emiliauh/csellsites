declare module "@mapbox/tilebelt" {
  export function tiles(bbox: [number, number, number, number], zoom: number): [number, number, number][];
  export function bbox(tile: [number, number, number]): [number, number, number, number];
  export function center(tile: [number, number, number]): [number, number];
}
