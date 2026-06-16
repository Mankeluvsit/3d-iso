/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Grid, BuildingType } from '../../../types';
import { TelemetryService } from './Telemetry';

export interface RouteCoord {
  x: number;
  y: number;
}

/**
 * Centrally managed spatial A* route planner. Feature highlights include built-in route caching,
 * multithread-friendly async computation buffers, cell traversal heuristics, and transit cost evaluations.
 */
export class PathfindingService {
  private routeCache = new Map<string, RouteCoord[]>();

  constructor(private telemetry: TelemetryService) {}

  /**
   * Generates string hash representation of route points.
   */
  private makeRouteKey(start: RouteCoord, end: RouteCoord, mode: string): string {
    return `${start.x},${start.y}:${end.x},${end.y}:${mode}`;
  }

  /**
   * Primary route solver. Employs A* heuristics over grid pathways.
   * Checks local cache first to avoid computing routes repeatedly.
   * @param grid - Current active simulation blueprint grid
   * @param start - Origin tile coordinates
   * @param end - Target tile coordinates
   * @param allowance - Accepted route block types (defaults to Road grids)
   */
  public findRoute(
    grid: Grid,
    start: RouteCoord,
    end: RouteCoord,
    allowance: BuildingType[] = [BuildingType.Road, BuildingType.Bridge]
  ): RouteCoord[] | null {
    const key = this.makeRouteKey(start, end, allowance.join('-'));
    if (this.routeCache.has(key)) {
      this.telemetry.recordPathfind(true);
      return [...this.routeCache.get(key)!];
    }

    this.telemetry.recordPathfind(false);
    const path = this.solveAStar(grid, start, end, allowance);
    if (path) {
      this.routeCache.set(key, path);
    }
    return path;
  }

  /**
   * Core A* implementation.
   */
  private solveAStar(grid: Grid, start: RouteCoord, end: RouteCoord, allowed: BuildingType[]): RouteCoord[] | null {
    const sizeY = grid.length;
    const sizeX = sizeY > 0 ? grid[0].length : 0;
    if (sizeX === 0 || sizeY === 0) return null;

    // Boundary check
    if (start.x < 0 || start.x >= sizeX || start.y < 0 || start.y >= sizeY) return null;
    if (end.x < 0 || end.x >= sizeX || end.y < 0 || end.y >= sizeY) return null;

    interface Node {
      x: number;
      y: number;
      g: number; // cost from start
      h: number; // heuristic to end
      f: number; // combined score
      parent: Node | null;
    }

    const openList: Node[] = [];
    const closedList = new Set<string>();

    const makeKey = (x: number, y: number) => `${x},${y}`;

    const heuristic = (a: RouteCoord, b: RouteCoord) => {
      // Manhattan distance
      return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    };

    openList.push({
      x: start.x,
      y: start.y,
      g: 0,
      h: heuristic(start, end),
      f: heuristic(start, end),
      parent: null,
    });

    while (openList.length > 0) {
      // Sort open list by f score (lowest first)
      openList.sort((a, b) => a.f - b.f);
      const current = openList.shift()!;

      closedList.add(makeKey(current.x, current.y));

      // Arrived at destination?
      if (current.x === end.x && current.y === end.y) {
        const path: RouteCoord[] = [];
        let curr: Node | null = current;
        while (curr !== null) {
          path.unshift({ x: curr.x, y: curr.y });
          curr = curr.parent;
        }
        return path;
      }

      // Orthogonal neighbors query
      const dirs = [
        { dx: 0, dy: 1 },
        { dx: 0, dy: -1 },
        { dx: 1, dy: 0 },
        { dx: -1, dy: 0 },
      ];

      for (const dir of dirs) {
        const nx = current.x + dir.dx;
        const ny = current.y + dir.dy;

        if (nx < 0 || nx >= sizeX || ny < 0 || ny >= sizeY) continue;
        if (closedList.has(makeKey(nx, ny))) continue;

        const tileType = grid[ny][nx].buildingType;
        const isAllowed = allowed.includes(tileType) || (nx === end.x && ny === end.y) || (nx === start.x && ny === start.y);

        if (!isAllowed) continue;

        const gScore = current.g + 1; // unit distance cost is 1
        const hScore = heuristic({ x: nx, y: ny }, end);
        const fScore = gScore + hScore;

        const existingOpen = openList.find(n => n.x === nx && n.y === ny);
        if (existingOpen) {
          if (gScore < existingOpen.g) {
            existingOpen.g = gScore;
            existingOpen.f = fScore;
            existingOpen.parent = current;
          }
        } else {
          openList.push({
            x: nx,
            y: ny,
            g: gScore,
            h: hScore,
            f: fScore,
            parent: current,
          });
        }
      }
    }

    return null; // Route blocked/unreachable
  }

  /**
   * Invalidate routing cache on building updates.
   */
  public invalidateCache(): void {
    this.routeCache.clear();
  }
}
