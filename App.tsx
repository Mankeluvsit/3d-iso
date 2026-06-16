/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { BuildingType, Grid } from './types';
import StartScreen from './components/StartScreen';
import IsoMap from './components/IsoMap/IsoMap';
import UIOverlay from './components/UIOverlay/UIOverlay';
import { AdaptiveSoundscapeEngine } from './src/kernel/visual/VisualEngineState';
import { useGameStore } from './src/store/gameStore';
import { useGameSimulation } from './src/hooks/useGameSimulation';
import { WeatherType, SeasonType } from './src/kernel/visual/VisualEngineState';

export default function App() {
  const gameStarted = useGameStore((state) => state.gameStarted);
  const setGameStarted = useGameStore((state) => state.setGameStarted);
  const aiEnabled = useGameStore((state) => state.aiEnabled);
  const stats = useGameStore((state) => state.stats);
  const grid = useGameStore((state) => state.grid);
  const currentGoal = useGameStore((state) => state.currentGoal);
  const newsFeed = useGameStore((state) => state.newsFeed);
  const policies = useGameStore((state) => state.policies);
  const congestionLevel = useGameStore((state) => state.congestionLevel);
  const averageHappiness = useGameStore((state) => state.averageHappiness);
  const isGeneratingGoal = useGameStore((state) => state.isGeneratingGoal);
  const telemetryReport = useGameStore((state) => state.telemetryReport);
  const activeScenarioName = useGameStore((state) => state.activeScenarioName);
  const activeScenarioGoalStatus = useGameStore((state) => state.activeScenarioGoalStatus);

  const [selectedTool, setSelectedTool] = useState<BuildingType>(BuildingType.None);
  
  const { 
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
  } = useGameSimulation();

  // --- Visual presentation overhaul control deck states ---
  const [timeOfDay, setTimeOfDay] = useState<number>(10.0);
  const [weather, setWeather] = useState<WeatherType>('clear');
  const [season, setSeason] = useState<SeasonType>('summer');
  const [activeOverlay, setActiveOverlay] = useState<any>('none');
  const [isBlackout, setIsBlackout] = useState<boolean>(false);
  const [isCinemaActive, setIsCinemaActive] = useState<boolean>(false);
  const [photoFilter, setPhotoFilter] = useState<string>('default');
  const [audioVolume, setAudioVolume] = useState<number>(0.25);
  const [autoTime, setAutoTime] = useState<boolean>(true);
  
  // Sandbox Override Controls
  const [sandboxOverridesActive, setSandboxOverridesActive] = useState<boolean>(false);
  const [sandboxCongestion, setSandboxCongestion] = useState<number>(50);
  const [sandboxHappiness, setSandboxHappiness] = useState<number>(80);

  const soundEngineRef = useRef<AdaptiveSoundscapeEngine | null>(null);

  useEffect(() => {
    soundEngineRef.current = new AdaptiveSoundscapeEngine();
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

  useEffect(() => {
    let frameId: number;
    const tickTimeCycle = () => {
      if (autoTime) {
        setTimeOfDay((prev) => (prev + 0.015) % 24);
      }
      if (soundEngineRef.current) {
        soundEngineRef.current.updateSoundscape(
          audioVolume,
          weather,
          stats.population,
          activeDisasters.length > 0,
          0.4
        );
      }
      frameId = requestAnimationFrame(tickTimeCycle);
    };
    frameId = requestAnimationFrame(tickTimeCycle);
    return () => cancelAnimationFrame(frameId);
  }, [autoTime, audioVolume, weather, stats.population, activeDisasters.length]);

  const handleStartGame = (enableAI: boolean, customMoney: number, startingSeason?: SeasonType, startingWeather?: WeatherType, startingTime?: number) => {
    const config = startGame(enableAI, customMoney, startingSeason, startingWeather, startingTime);
    if(config.startingSeason) setSeason(config.startingSeason);
    if(config.startingWeather) setWeather(config.startingWeather);
    if(config.startingTime !== undefined) setTimeOfDay(config.startingTime);
    setGameStarted(true);
    soundEngineRef.current?.start();
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 select-none">
      {!gameStarted && <StartScreen onStart={handleStartGame} />}
      
      <IsoMap 
        grid={grid} 
        onTileClick={(x, y) => handleTileClick(x, y, selectedTool)} 
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

      {gameStarted && (
        <UIOverlay 
          stats={stats}
          selectedTool={selectedTool}
          onSelectTool={setSelectedTool}
          currentGoal={currentGoal}
          newsFeed={newsFeed}
          onClaimReward={claimReward}
          isGeneratingGoal={isGeneratingGoal}
          aiEnabled={aiEnabled}
          policies={policies}
          congestionLevel={congestionLevel}
          averageHappiness={averageHappiness}
          onTogglePolicy={togglePolicy}
          onUndo={undo}
          onRedo={redo}
          telemetryReport={telemetryReport}
          activeScenarioName={activeScenarioName}
          activeScenarioGoalStatus={activeScenarioGoalStatus}
          onTriggerHeadlessAudit={triggerHeadlessAudit}
          
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
          onTriggerDisaster={triggerDisaster}
          onClearDisasters={clearDisasters}
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
