
import { Grid, BuildingType } from '../../types';
import { GRID_SIZE } from '../../constants';
import { getBridgeOrientationAndValidity } from '../../src/kernel/Command';

export const WORLD_OFFSET = GRID_SIZE / 2 - 0.5;
export const gridToWorld = (x: number, y: number) => [x - WORLD_OFFSET, 0, y - WORLD_OFFSET] as [number, number, number];

export const isRiverCell = (x: number, y: number) => {
  const pathCenter = 7 + Math.sin(y * 0.4) * 2;
  return Math.abs(x - pathCenter) < 1.1;
};

export const getTileHeight = (x: number, y: number) => {
  if (isRiverCell(x, y)) {
    return -0.42; 
  }
  
  const freq1 = 0.25;
  const freq2 = 0.55;
  const h1 = Math.sin(x * freq1) * Math.cos(y * freq1) * 0.55; 
  const h2 = Math.sin(x * freq2 + 2.0) * Math.cos(y * freq2 + 1.0) * 0.18; 
  
  return h1 + h2;
};

export const getBridgeDeckAbsoluteHeight = (x: number, y: number, grid: Grid) => {
  let orientation = grid[y]?.[x]?.orientation;
  if (!orientation && grid[y]?.[x]) {
    const result = getBridgeOrientationAndValidity(x, y, grid);
    orientation = result.orientation;
  }
  const negX = orientation === 'E-W' ? x - 1 : x;
  const negY = orientation === 'E-W' ? y : y - 1;
  const posX = orientation === 'E-W' ? x + 1 : x;
  const posY = orientation === 'E-W' ? y : y + 1;

  const hNeg = (negX >= 0 && negX < GRID_SIZE && negY >= 0 && negY < GRID_SIZE) ? getTileHeight(negX, negY) : 0;
  const hPos = (posX >= 0 && posX < GRID_SIZE && posY >= 0 && posY < GRID_SIZE) ? getTileHeight(posX, posY) : 0;

  return Math.max(hNeg, hPos) + 0.45;
};

export const getRoadSurfaceHeightAt = (gx: number, gy: number, grid: Grid) => {
  const tx = Math.floor(gx + 0.5);
  const ty = Math.floor(gy + 0.5);
  
  if (tx < 0 || tx >= GRID_SIZE || ty < 0 || ty >= GRID_SIZE) {
    return getTileHeight(gx, gy);
  }
  
  const tile = grid[ty]?.[tx];
  if (!tile) return getTileHeight(gx, gy);
  
  if (tile.buildingType !== BuildingType.Bridge) {
    return getTileHeight(tx, ty); 
  }
  
  let orientation = tile.orientation;
  if (!orientation) {
    const result = getBridgeOrientationAndValidity(tx, ty, grid);
    orientation = result.orientation;
  }
  
  const localOffset = orientation === 'E-W' ? (gx - tx) : (gy - ty);
  const hDeck = getBridgeDeckAbsoluteHeight(tx, ty, grid);
  
  const negX = orientation === 'E-W' ? tx - 1 : tx;
  const negY = orientation === 'E-W' ? ty : ty - 1;
  const posX = orientation === 'E-W' ? tx + 1 : tx;
  const posY = orientation === 'E-W' ? ty : ty + 1;
  
  const isNegBridge = negX >= 0 && negX < GRID_SIZE && negY >= 0 && negY < GRID_SIZE && grid[negY]?.[negX]?.buildingType === BuildingType.Bridge;
  const isPosBridge = posX >= 0 && posX < GRID_SIZE && posY >= 0 && posY < GRID_SIZE && grid[posY]?.[posX]?.buildingType === BuildingType.Bridge;
  
  const getNeighborDeckHeight = (nx: number, ny: number) => {
    if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE) return 0;
    const nTile = grid[ny]?.[nx];
    if (nTile && nTile.buildingType === BuildingType.Bridge) {
      return getBridgeDeckAbsoluteHeight(nx, ny, grid);
    }
    return getTileHeight(nx, ny);
  };
  
  const hNeg = getNeighborDeckHeight(negX, negY);
  const hPos = getNeighborDeckHeight(posX, posY);

  if (localOffset < 0) {
    if (isNegBridge) {
      return hDeck;
    }
    if (localOffset < -0.15) {
      const t = Math.max(0, Math.min(1, (localOffset - (-0.5)) / 0.35));
      return hNeg + (hDeck - hNeg) * t;
    }
    return hDeck;
  } else {
    if (isPosBridge) {
      return hDeck;
    }
    if (localOffset > 0.15) {
      const t = Math.max(0, Math.min(1, (localOffset - 0.15) / 0.35));
      return hDeck + (hPos - hDeck) * t;
    }
    return hDeck;
  }
};


export const getRandomRange = (min: number, max: number) => Math.random() * (max - min) + min;

export const getRandomClothesColor = () => {
    const colors = ['#ef4444', '#f97316', '#22c55e', '#3b82f6', '#8b5cf6', '#d946ef'];
    return colors[Math.floor(Math.random() * colors.length)];
};

export const getHash = (x: number, y: number) => Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
