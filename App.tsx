/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { BuildingType, CityStats, AIGoal, NewsItem, Grid } from './types';
import StartScreen from './components/StartScreen';
import IsoMap from './components/IsoMap';
import UIOverlay from './components/UIOverlay';
import { SimulationWorkerManager } from './src/workers/SimulationWorkerManager';
import { GameStateSnapshot } from './src/kernel/Snapshot';
import { WeatherType, SeasonType, OverlayType, AdaptiveSoundscapeEngine } from './src/kernel/visual/VisualEngineState';

export default function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);

  // States synchronized from Worker Thread snapshots
  const [stats, setStats] = useState<CityStats>({ money: 1000, population: 0, day: 1 });
  const [grid, setGrid] = useState<Grid>(() => {
    const g: Grid = [];
    for (let y = 0; y < 15; y++) {
      const r = [];
      for (let x = 0; x < 15; x++) {
        r.push({ x, y, buildingType: BuildingType.None });
      }
      g.push(r);
    }
    return g;
  });
  const [currentGoal, setCurrentGoal] = useState<AIGoal | null>(null);
  const [newsFeed, setNewsFeed] = useState<NewsItem[]>([]);
  const [policies, setPolicies] = useState<Record<string, boolean>>({});
  const [congestionLevel, setCongestionLevel] = useState<number>(0);
  const [averageHappiness, setAverageHappiness] = useState<number>(75);
  const [isGeneratingGoal, setIsGeneratingGoal] = useState<boolean>(false);
  const [telemetryReport, setTelemetryReport] = useState<any>(null);
  const [activeScenarioName, setActiveScenarioName] = useState<string | undefined>(undefined);
  const [activeScenarioGoalStatus, setActiveScenarioGoalStatus] = useState<string | undefined>(undefined);

  // Brush controls
  const [selectedTool, setSelectedTool] = useState<BuildingType>(BuildingType.None);

  // Thread manager reference
  const workerManagerRef = useRef<SimulationWorkerManager | null>(null);

  // --- Visual presentation overhaul control deck states ---
  const [timeOfDay, setTimeOfDay] = useState<number>(10.0); // starts at 10 AM (beautiful sunny mornings)
  const [weather, setWeather] = useState<WeatherType>('clear');
  const [season, setSeason] = useState<SeasonType>('summer');
  const [activeOverlay, setActiveOverlay] = useState<OverlayType>('none');
  const [isBlackout, setIsBlackout] = useState<boolean>(false);
  const [isCinemaActive, setIsCinemaActive] = useState<boolean>(false);
  const [photoFilter, setPhotoFilter] = useState<string>('default');
  const [audioVolume, setAudioVolume] = useState<number>(0.25);
  const [autoTime, setAutoTime] = useState<boolean>(true);
  const [activeDisasters, setActiveDisasters] = useState<{ x: number, y: number, type: string }[]>([]);

  // Sandbox Override Controls
  const [sandboxOverridesActive, setSandboxOverridesActive] = useState<boolean>(false);
  const [sandboxCongestion, setSandboxCongestion] = useState<number>(50);
  const [sandboxHappiness, setSandboxHappiness] = useState<number>(80);

  // Soundscape engine reference
  const soundEngineRef = useRef<AdaptiveSoundscapeEngine | null>(null);

  // Initialize sound engine
  useEffect(() => {
    soundEngineRef.current = new AdaptiveSoundscapeEngine();
    
    // Resume audio context upon user interactions to support standard security policy constraints
    const gestureTrigger = () => {
      soundEngineRef.current?.start();
    };
    window.addEventListener('click', gestureTrigger);
    window.addEventListener('touchstart', gestureTrigger);
    return () => {
      window.removeEventListener('click', gestureTrigger);
      window.removeEventListener('touchstart', gestureTrigger);
    };
  }, []);

  // Continuous client-side timer for flowing visual sun arc and acoustic loops updating
  useEffect(() => {
    let frameId: number;
    const tickTimeCycle = () => {
      if (autoTime) {
        setTimeOfDay((prev) => (prev + 0.015) % 24);
      }

      // Live spatial soundscape matching state variables
      if (soundEngineRef.current) {
        soundEngineRef.current.updateSoundscape(
          audioVolume,
          weather,
          stats.population,
          activeDisasters.length > 0,
          0.4 // camera zoom factor representation
        );
      }

      frameId = requestAnimationFrame(tickTimeCycle);
    };

    frameId = requestAnimationFrame(tickTimeCycle);
    return () => cancelAnimationFrame(frameId);
  }, [autoTime, audioVolume, weather, stats.population, activeDisasters.length]);

  // Start game callback with custom config capabilities
  const handleStartGame = (
    enableAI: boolean, 
    customMoney: number, 
    startingSeason?: SeasonType, 
    startingWeather?: WeatherType, 
    startingTime?: number
  ) => {
    setAiEnabled(enableAI);
    if (startingSeason) setSeason(startingSeason);
    if (startingWeather) setWeather(startingWeather);
    if (startingTime !== undefined) setTimeOfDay(startingTime);
    setStats((prev) => ({ ...prev, money: customMoney }));
    setGameStarted(true);

    // Warm sound context
    soundEngineRef.current?.start();

    // Instantiate worker coordination thread with start config params
    workerManagerRef.current = new SimulationWorkerManager((snapshot: GameStateSnapshot) => {
      // Receive full state snapshot updates
      setStats(snapshot.stats);
      setGrid(snapshot.grid);
      setCurrentGoal(snapshot.currentGoal);
      setNewsFeed(snapshot.newsFeed);
      setPolicies(snapshot.policies);
      setCongestionLevel(snapshot.congestionLevel);
      setAverageHappiness(snapshot.averageHappiness);
      setIsGeneratingGoal(!snapshot.currentGoal && enableAI);
      setTelemetryReport(snapshot.telemetryReport);
      setActiveScenarioName(snapshot.activeScenarioName);
      setActiveScenarioGoalStatus(snapshot.activeScenarioGoalStatus);
    }, { startingMoney: customMoney, enableAI });
  };

  // Clean thread up on unmount
  useEffect(() => {
    return () => {
      workerManagerRef.current?.terminate();
    };
  }, []);

  const handleTileClick = (x: number, y: number) => {
    if (!workerManagerRef.current) return;

    soundEngineRef.current?.playUpgradeDing();

    if (selectedTool === BuildingType.None) {
      // Demolish Command
      workerManagerRef.current.postMessage({
        type: 'EXEC_COMMAND',
        data: { cmdType: 'DemolishCommand', params: { x, y } }
      });
    } else {
      // Build Command
      workerManagerRef.current.postMessage({
        type: 'EXEC_COMMAND',
        data: { cmdType: 'BuildCommand', params: { x, y, buildingType: selectedTool } }
      });
    }
  };

  const handleClaimReward = () => {
    soundEngineRef.current?.playUpgradeDing();
    workerManagerRef.current?.postMessage({ type: 'CLAIM_AWARD' });
  };

  const handleTogglePolicy = (policyId: string) => {
    soundEngineRef.current?.playUpgradeDing();
    workerManagerRef.current?.postMessage({
      type: 'EXEC_COMMAND',
      data: { cmdType: 'PolicyToggleCommand', params: { policyId } }
    });
  };

  const handleUndo = () => {
    soundEngineRef.current?.playUpgradeDing();
    workerManagerRef.current?.postMessage({ type: 'UNDO' });
  };

  const handleRedo = () => {
    soundEngineRef.current?.playUpgradeDing();
    workerManagerRef.current?.postMessage({ type: 'REDO' });
  };

  const handleTriggerHeadlessAudit = (ticks: number = 100) => {
    workerManagerRef.current?.postMessage({
      type: 'RUN_HEADLESS_AUDIT',
      data: { ticks }
    });
  };

  // Simulate an emergency fire incident breakout
  const handleTriggerDisaster = () => {
    // Find a grid location with a visual structure placed on it
    const candidates: { x: number, y: number }[] = [];
    grid.forEach((row) => {
      row.forEach((tile) => {
        if (tile.buildingType !== BuildingType.None && tile.buildingType !== BuildingType.Road) {
          candidates.push({ x: tile.x, y: tile.y });
        }
      });
    });

    if (candidates.length === 0) return; // No targets yet
    const chosen = candidates[Math.floor(Math.random() * candidates.length)];
    
    // Check if fire isn't already active
    const exists = activeDisasters.some((d) => d.x === chosen.x && d.y === chosen.y);
    if (!exists) {
      soundEngineRef.current?.playDisasterStrike();
      setActiveDisasters((prev) => [...prev, { x: chosen.x, y: chosen.y, type: 'fire' }]);
    }
  };

  const handleClearDisasters = () => {
    soundEngineRef.current?.playUpgradeDing();
    setActiveDisasters([]);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 select-none">
      {!gameStarted && <StartScreen onStart={handleStartGame} />}
      
      {/* 3D Maps Render */}
      <IsoMap 
        grid={grid} 
        onTileClick={handleTileClick} 
        hoveredTool={selectedTool} 
        population={stats.population}
        timeOfDay={timeOfDay}
        weather={weather}
        season={season}
        activeOverlay={activeOverlay}
        isBlackout={isBlackout}
        isCinemaActive={isCinemaActive}
        activeDisasters={activeDisasters}
        photoFilter={photoFilter}
        averageHappiness={sandboxOverridesActive ? sandboxHappiness : averageHappiness}
        congestionLevel={sandboxOverridesActive ? sandboxCongestion : congestionLevel}
      />

      {/* Modern HUD Overlay */}
      {gameStarted && (
        <UIOverlay 
          stats={stats}
          selectedTool={selectedTool}
          onSelectTool={setSelectedTool}
          currentGoal={currentGoal}
          newsFeed={newsFeed}
          onClaimReward={handleClaimReward}
          isGeneratingGoal={isGeneratingGoal}
          aiEnabled={aiEnabled}
          policies={policies}
          congestionLevel={congestionLevel}
          averageHappiness={averageHappiness}
          onTogglePolicy={handleTogglePolicy}
          onUndo={handleUndo}
          onRedo={handleRedo}
          telemetryReport={telemetryReport}
          activeScenarioName={activeScenarioName}
          activeScenarioGoalStatus={activeScenarioGoalStatus}
          onTriggerHeadlessAudit={handleTriggerHeadlessAudit}

          // Visual overrides binders
          timeOfDay={timeOfDay}
          setTimeOfDay={setTimeOfDay}
          weather={weather}
          setWeather={setWeather}
          season={season}
          setSeason={setSeason}
          activeOverlay={activeOverlay}
          setActiveOverlay={setActiveOverlay}
          isBlackout={isBlackout}
          setIsBlackout={setIsBlackout}
          isCinemaActive={isCinemaActive}
          setIsCinemaActive={setIsCinemaActive}
          photoFilter={photoFilter}
          setPhotoFilter={setPhotoFilter}
          audioVolume={audioVolume}
          setAudioVolume={setAudioVolume}
          autoTime={autoTime}
          setAutoTime={setAutoTime}
          onTriggerDisaster={handleTriggerDisaster}
          onClearDisasters={handleClearDisasters}
          activeDisastersCount={activeDisasters.length}
          sandboxOverridesActive={sandboxOverridesActive}
          setSandboxOverridesActive={setSandboxOverridesActive}
          sandboxCongestion={sandboxCongestion}
          setSandboxCongestion={setSandboxCongestion}
          sandboxHappiness={sandboxHappiness}
          setSandboxHappiness={setSandboxHappiness}
        />
      )}
    </div>
  );
}
