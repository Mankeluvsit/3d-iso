/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { BuildingType, CityStats, AIGoal, NewsItem, Grid } from '../../types';
import { TileSnapshot, GameStateSnapshot, GoalSnapshot, NewsSnapshot } from '../kernel/Snapshot';

interface GameState {
  gameStarted: boolean;
  aiEnabled: boolean;
  stats: CityStats;
  grid: Grid;
  currentGoal: AIGoal | null;
  newsFeed: NewsItem[];
  policies: Record<string, boolean>;
  congestionLevel: number;
  averageHappiness: number;
  isGeneratingGoal: boolean;
  telemetryReport: any | null;
  activeScenarioName: string | undefined;
  activeScenarioGoalStatus: string | undefined;

  setGameStarted: (started: boolean) => void;
  setAiEnabled: (enabled: boolean) => void;
  syncWithSnapshot: (snapshot: GameStateSnapshot) => void;
  syncWithDelta: (delta: any) => void;
  setStats: (stats: CityStats) => void;
  setGrid: (grid: Grid) => void;
  setCurrentGoal: (goal: AIGoal | null) => void;
  setNewsFeed: (news: NewsItem[]) => void;
  setPolicies: (policies: Record<string, boolean>) => void;
  setCongestionLevel: (congestion: number) => void;
  setAverageHappiness: (happiness: number) => void;
  setIsGeneratingGoal: (isGen: boolean) => void;
  setTelemetryReport: (report: any) => void;
}

export const useGameStore = create<GameState>((set) => ({
  gameStarted: false,
  aiEnabled: true,
  stats: { money: 1000, population: 0, day: 1 },
  grid: Array.from({ length: 15 }, (_, y) =>
    Array.from({ length: 15 }, (_, x) => ({
      x,
      y,
      buildingType: BuildingType.None,
    }))
  ),
  currentGoal: null,
  newsFeed: [],
  policies: {},
  congestionLevel: 0,
  averageHappiness: 75,
  isGeneratingGoal: false,
  telemetryReport: null,
  activeScenarioName: undefined,
  activeScenarioGoalStatus: undefined,

  setGameStarted: (gameStarted) => set({ gameStarted }),
  setAiEnabled: (aiEnabled) => set({ aiEnabled }),
  setStats: (stats) => set({ stats }),
  setGrid: (grid) => set({ grid }),
  setCurrentGoal: (currentGoal) => set({ currentGoal }),
  setNewsFeed: (newsFeed) => set({ newsFeed }),
  setPolicies: (policies) => set({ policies }),
  setCongestionLevel: (congestionLevel) => set({ congestionLevel }),
  setAverageHappiness: (averageHappiness) => set({ averageHappiness }),
  setIsGeneratingGoal: (isGeneratingGoal) => set({ isGeneratingGoal }),
  setTelemetryReport: (telemetryReport) => set({ telemetryReport }),

  syncWithSnapshot: (snapshot) => set((state) => {
    return {
      stats: snapshot.stats,
      grid: snapshot.grid,
      currentGoal: snapshot.currentGoal,
      newsFeed: snapshot.newsFeed,
      policies: snapshot.policies,
      congestionLevel: snapshot.congestionLevel,
      averageHappiness: snapshot.averageHappiness,
      isGeneratingGoal: !snapshot.currentGoal && state.aiEnabled,
      telemetryReport: snapshot.telemetryReport,
      activeScenarioName: snapshot.activeScenarioName,
      activeScenarioGoalStatus: snapshot.activeScenarioGoalStatus,
    };
  }),

  syncWithDelta: (delta) => set((state) => {
    const newStats = delta.stats ? { ...state.stats, ...delta.stats } : state.stats;
    let newGrid = state.grid;

    if (delta.changedTiles && Array.isArray(delta.changedTiles)) {
      newGrid = state.grid.map((row) => row.map((tile) => {
        const matchingTile = delta.changedTiles.find((t: any) => t.x === tile.x && t.y === tile.y);
        return matchingTile ? { ...tile, ...matchingTile } : tile;
      }));
    }

    return {
      stats: newStats,
      grid: newGrid,
      ...(delta.currentGoal !== undefined && { currentGoal: delta.currentGoal }),
      ...(delta.newsFeed !== undefined && { newsFeed: delta.newsFeed }),
      ...(delta.policies !== undefined && { policies: delta.policies }),
      ...(delta.congestionLevel !== undefined && { congestionLevel: delta.congestionLevel }),
      ...(delta.averageHappiness !== undefined && { averageHappiness: delta.averageHappiness }),
      ...(delta.telemetryReport !== undefined && { telemetryReport: delta.telemetryReport }),
      ...(delta.activeScenarioName !== undefined && { activeScenarioName: delta.activeScenarioName }),
      ...(delta.activeScenarioGoalStatus !== undefined && { activeScenarioGoalStatus: delta.activeScenarioGoalStatus }),
      isGeneratingGoal: delta.currentGoal !== undefined ? (!delta.currentGoal && state.aiEnabled) : state.isGeneratingGoal,
    };
  }),
}));
