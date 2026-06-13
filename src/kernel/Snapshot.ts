/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BuildingType } from '../../types';

export interface TileSnapshot {
  x: number;
  y: number;
  buildingType: BuildingType;
  variant?: number;
}

export interface GoalSnapshot {
  description: string;
  targetType: 'population' | 'money' | 'building_count';
  targetValue: number;
  buildingType?: BuildingType;
  reward: number;
  completed: boolean;
}

export interface NewsSnapshot {
  id: string;
  text: string;
  type: 'positive' | 'negative' | 'neutral';
}

export interface GameStateSnapshot {
  stats: {
    money: number;
    population: number;
    day: number;
  };
  grid: TileSnapshot[][];
  currentGoal: GoalSnapshot | null;
  newsFeed: NewsSnapshot[];
  policies: Record<string, boolean>;
  ecsState: any; // ECS Manager serialization
  tickCount: number;
  // engine state metadata
  congestionLevel: number;
  averageHappiness: number;
  recentEventName: string | null;
  telemetryReport?: {
    heapSizeAllocatedMb: number;
    activeEntityCount: number;
    pathfindingRequests: number;
    pathfindingCacheRatio: number;
    averages: Record<string, number>;
  };
  activeScenarioName?: string;
  activeScenarioGoalStatus?: string;
}
