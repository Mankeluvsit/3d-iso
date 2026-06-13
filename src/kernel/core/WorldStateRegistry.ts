/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Grid, CityStats, NewsItem, BuildingType } from '../../../types';

export interface ISimulationSnapshot {
  tick: number;
  stats: CityStats;
  resources: Record<string, number>;
  grid: Grid;
  newsFeed: NewsItem[];
  vitals: {
    averageHappiness: number;
    congestionLevel: number;
    pollutionLevel: number;
  };
}

/**
 * Centrally manages read-only synchronized simulation states.
 * Connects to a Query API and maintains a strict CQRS divide where simulation engines
 * handle mutations, and UI/analyzers only receive snapshot read-models.
 */
export class WorldStateRegistry {
  private activeState: ISimulationSnapshot = {
    tick: 0,
    stats: { money: 1000, population: 0, day: 1 },
    resources: {},
    grid: [],
    newsFeed: [],
    vitals: { averageHappiness: 75, congestionLevel: 0, pollutionLevel: 0 }
  };

  /**
   * Commits a fresh runtime snapshot from the simulation cycle.
   * Completely clones structures to prevent mutation leakage back into core engines.
   */
  public updateState(state: ISimulationSnapshot): void {
    this.activeState = this.deepClone(state);
  }

  /**
   * Exposes read-only, fully frozen snapshot state.
   */
  public getState(): Readonly<ISimulationSnapshot> {
    return this.activeState;
  }

  /**
   * Core Query API: composable, strongly-typed querying utility
   * allowing analytical blocks to request properties asynchronously.
   */
  public query<T>(selector: (state: ISimulationSnapshot) => T): T {
    return selector(this.activeState);
  }

  /**
   * Helper utility to clone snapshots.
   */
  private deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Predicates built targeting specific building configurations.
   */
  public queryCountByBuildingType(type: BuildingType): number {
    let count = 0;
    const grid = this.activeState.grid;
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        if (grid[r][c].buildingType === type) {
          count++;
        }
      }
    }
    return count;
  }
}
