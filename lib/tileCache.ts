type TileKey = string;
const tileCache = new Map<TileKey, Uint8Array>();
export function makeKey(z:number,x:number,y:number){ return `${z}/${x}/${y}`; }
export function getTile(z:number,x:number,y:number){ return tileCache.get(makeKey(z,x,y)) || null; }
export function setTile(z:number,x:number,y:number, buf: Uint8Array){ tileCache.set(makeKey(z,x,y), buf); }
export function clearTiles(){ tileCache.clear(); }