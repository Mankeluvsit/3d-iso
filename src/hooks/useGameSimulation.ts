
import { useEffect, useRef, useState } from 'react';
import { BuildingType, Grid } from '../../types';
import { GameStateSnapshot } from '../kernel/Snapshot';
import { SimulationWorkerManager } from '../workers/SimulationWorkerManager';
import { useGameStore } from '../store/gameStore';
import { WeatherType, SeasonType } from '../kernel/visual/VisualEngineState';

export const useGameSimulation = () => {
  const workerManagerRef = useRef<SimulationWorkerManager | null>(null);
  const [activeDisasters, setActiveDisasters] = useState<{ x: number, y: number, type: string }[]>([]);
  const grid = useGameStore((state) => state.grid);

  useEffect(() => {
    return () => {
      workerManagerRef.current?.terminate();
    };
  }, []);

  const startGame = (
    enableAI: boolean, 
    customMoney: number, 
    startingSeason?: SeasonType, 
    startingWeather?: WeatherType, 
    startingTime?: number
  ) => {
    
    useGameStore.getState().setStats({ money: customMoney, population: 0, day: 1 });
    
    const syncWithSnapshot = useGameStore.getState().syncWithSnapshot;
    workerManagerRef.current = new SimulationWorkerManager((snapshot: GameStateSnapshot) => {
      syncWithSnapshot(snapshot);
    }, { startingMoney: customMoney, enableAI });

    return { startingSeason, startingWeather, startingTime };
  };

  const handleTileClick = (x: number, y: number, selectedTool: BuildingType) => {
    if (!workerManagerRef.current) return;

    if (selectedTool === BuildingType.None) {
      workerManagerRef.current.postMessage({
        type: 'EXEC_COMMAND',
        data: { cmdType: 'DemolishCommand', params: { x, y } }
      });
    } else {
      workerManagerRef.current.postMessage({
        type: 'EXEC_COMMAND',
        data: { cmdType: 'BuildCommand', params: { x, y, buildingType: selectedTool } }
      });
    }
  };

  const claimReward = () => {
    workerManagerRef.current?.postMessage({ type: 'CLAIM_AWARD' });
  };

  const togglePolicy = (policyId: string) => {
    workerManagerRef.current?.postMessage({
        type: 'EXEC_COMMAND',
        data: { cmdType: 'PolicyToggleCommand', params: { policyId } }
      });
  };

  const undo = () => workerManagerRef.current?.postMessage({ type: 'UNDO' });
  const redo = () => workerManagerRef.current?.postMessage({ type: 'REDO' });

  const triggerHeadlessAudit = (ticks: number = 100) => {
    workerManagerRef.current?.postMessage({
      type: 'RUN_HEADLESS_AUDIT',
      data: { ticks }
    });
  };

  const triggerDisaster = () => {
    const candidates: { x: number, y: number }[] = [];
    grid.forEach((row) => {
      row.forEach((tile) => {
        if (tile.buildingType !== BuildingType.None && tile.buildingType !== BuildingType.Road) {
          candidates.push({ x: tile.x, y: tile.y });
        }
      });
    });

    if (candidates.length === 0) return; 
    const chosen = candidates[Math.floor(Math.random() * candidates.length)];
    
    const exists = activeDisasters.some((d) => d.x === chosen.x && d.y === chosen.y);
    if (!exists) {
      setActiveDisasters((prev) => [...prev, { x: chosen.x, y: chosen.y, type: 'fire' }]);
      return true; // Disaster triggered
    }
    return false;
  };

  const clearDisasters = () => setActiveDisasters([]);

  return {
    startGame,
    handleTileClick,
    claimReward,
    togglePolicy,
    undo,
    redo,
    triggerHeadlessAudit,
    triggerDisaster,
    clearDisasters,
    activeDisasters
  };
};
