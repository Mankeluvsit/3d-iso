/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { BuildingType, CityStats, AIGoal, NewsItem } from '../../types';
import { WeatherType, SeasonType, OverlayType } from '../../src/kernel/visual/VisualEngineState';

import { StatsPanel } from './StatsPanel';
import { VisualControlDeck } from './VisualControlDeck';
import { ToolBar } from './ToolBar';
import { NewsTicker } from './NewsTicker';
import { ScenarioAdviser } from './ScenarioAdviser';

interface UIOverlayProps {
  stats: CityStats;
  selectedTool: BuildingType;
  onSelectTool: (type: BuildingType) => void;
  currentGoal: AIGoal | null;
  newsFeed: NewsItem[];
  onClaimReward: () => void;
  isGeneratingGoal: boolean;
  aiEnabled: boolean;
  policies: Record<string, boolean>;
  congestionLevel: number;
  averageHappiness: number;
  onTogglePolicy: (policyId: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  telemetryReport?: {
    heapSizeAllocatedMb: number;
    activeEntityCount: number;
    pathfindingRequests: number;
    pathfindingCacheRatio: number;
    averages: Record<string, number>;
  };
  activeScenarioName?: string;
  activeScenarioGoalStatus?: string;
  onTriggerHeadlessAudit?: (ticks: number) => void;

  // Visual overhaul Control Deck mappings
  timeOfDay: number;
  setTimeOfDay: (t: number) => void;
  weather: WeatherType;
  setWeather: (w: WeatherType) => void;
  season: SeasonType;
  setSeason: (s: SeasonType) => void;
  activeOverlay: OverlayType;
  setActiveOverlay: (o: OverlayType) => void;
  isBlackout: boolean;
  setIsBlackout: (b: boolean) => void;
  isCinemaActive: boolean;
  setIsCinemaActive: (c: boolean) => void;
  photoFilter: string;
  setPhotoFilter: (f: string) => void;
  audioVolume: number;
  setAudioVolume: (v: number) => void;
  autoTime: boolean;
  setAutoTime: (b: boolean) => void;
  onTriggerDisaster: () => void;
  onClearDisasters: () => void;
  activeDisastersCount: number;

  // Sandbox Override Props
  sandboxOverridesActive: boolean;
  setSandboxOverridesActive: (b: boolean) => void;
  sandboxCongestion: number;
  setSandboxCongestion: (v: number) => void;
  sandboxHappiness: number;
  setSandboxHappiness: (v: number) => void;
}

const UIOverlay: React.FC<UIOverlayProps> = ({
  stats,
  selectedTool,
  onSelectTool,
  currentGoal,
  newsFeed,
  onClaimReward,
  isGeneratingGoal,
  aiEnabled,
  policies,
  congestionLevel,
  averageHappiness,
  onTogglePolicy,
  onUndo,
  onRedo,
  telemetryReport,
  activeScenarioName,
  activeScenarioGoalStatus,
  onTriggerHeadlessAudit,

  // visual mappings
  timeOfDay,
  setTimeOfDay,
  weather,
  setWeather,
  season,
  setSeason,
  activeOverlay,
  setActiveOverlay,
  isBlackout,
  setIsBlackout,
  isCinemaActive,
  setIsCinemaActive,
  photoFilter,
  setPhotoFilter,
  audioVolume,
  setAudioVolume,
  autoTime,
  setAutoTime,
  onTriggerDisaster,
  onClearDisasters,
  activeDisastersCount,

  // Sandbox Override Props
  sandboxOverridesActive,
  setSandboxOverridesActive,
  sandboxCongestion,
  setSandboxCongestion,
  sandboxHappiness,
  setSandboxHappiness,
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'visuals' | 'simulation' | 'policies' | 'diagnostics'>('visuals');
  
  // HUD UI Scaling Option
  const [uiScale, setUiScale] = useState<number>(() => {
    return parseFloat(localStorage.getItem('sky_metropolis_ui_scale') || '1.0');
  });

  // Persist HUD scaling to standard cache store
  useEffect(() => {
    localStorage.setItem('sky_metropolis_ui_scale', uiScale.toString());
  }, [uiScale]);

  return (
    <div 
      id="ui-container" 
      className="absolute inset-0 pointer-events-none flex flex-col justify-between p-2 md:p-4 font-sans z-10 text-white transition-transform duration-200"
      style={{
        transform: `scale(${uiScale})`,
        transformOrigin: 'top left',
        width: `${100 / uiScale}%`,
        height: `${100 / uiScale}%`
      }}
    >
      {/* Top Bar Section */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start pointer-events-auto gap-2 w-full">
        {/* Statistics Board */}
        <StatsPanel
          stats={stats}
          timeOfDay={timeOfDay}
          congestionLevel={congestionLevel}
          averageHappiness={averageHappiness}
          sandboxOverridesActive={sandboxOverridesActive}
          sandboxCongestion={sandboxCongestion}
          sandboxHappiness={sandboxHappiness}
          onUndo={onUndo}
          onRedo={onRedo}
          onToggleSettings={() => setIsSettingsOpen(!isSettingsOpen)}
          isSettingsOpen={isSettingsOpen}
        />

        {/* Right column: Scenario objectives and Control Drawer */}
        <div className="flex flex-col gap-3 w-full md:w-96 pointer-events-auto max-h-[85vh] overflow-y-auto no-scrollbar ml-auto">
          {/* Settings / Controls Drawer */}
          {isSettingsOpen && (
            <VisualControlDeck
              activeTab={activeTab}
              setActiveTab={setActiveTab}
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
              onTriggerDisaster={onTriggerDisaster}
              onClearDisasters={onClearDisasters}
              activeDisastersCount={activeDisastersCount}
              sandboxOverridesActive={sandboxOverridesActive}
              setSandboxOverridesActive={setSandboxOverridesActive}
              sandboxCongestion={sandboxCongestion}
              setSandboxCongestion={setSandboxCongestion}
              sandboxHappiness={sandboxHappiness}
              setSandboxHappiness={setSandboxHappiness}
              policies={policies}
              onTogglePolicy={onTogglePolicy}
              uiScale={uiScale}
              setUiScale={setUiScale}
              telemetryReport={telemetryReport}
              onTriggerHeadlessAudit={onTriggerHeadlessAudit}
              congestionLevel={congestionLevel}
              averageHappiness={averageHappiness}
            />
          )}

          {/* AI Advisor Mayor objectives */}
          <ScenarioAdviser
            activeScenarioName={activeScenarioName}
            activeScenarioGoalStatus={activeScenarioGoalStatus}
            aiEnabled={aiEnabled}
            isGeneratingGoal={isGeneratingGoal}
            currentGoal={currentGoal}
            onClaimReward={onClaimReward}
          />
        </div>
      </div>

      {/* Bottom Bar Section */}
      <div className="flex flex-col-reverse md:flex-row md:justify-between md:items-end pointer-events-auto mt-auto gap-2 w-full">
        {/* Brush Palette selection */}
        <ToolBar
          selectedTool={selectedTool}
          onSelectTool={onSelectTool}
          money={stats.money}
        />

        {/* News dispatch ticker feed */}
        <NewsTicker
          newsFeed={newsFeed}
          aiEnabled={aiEnabled}
        />
      </div>
    </div>
  );
};

export default UIOverlay;
