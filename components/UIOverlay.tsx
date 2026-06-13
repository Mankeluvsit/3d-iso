/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { BuildingType, CityStats, AIGoal, NewsItem } from '../types';
import { BUILDINGS } from '../constants';
import policiesConfig from '../src/config/policies.json';
import { WeatherType, SeasonType, OverlayType } from '../src/kernel/visual/VisualEngineState';

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

const tools = [
  BuildingType.None, // Bulldoze
  BuildingType.Road,
  BuildingType.Residential,
  BuildingType.Commercial,
  BuildingType.Industrial,
  BuildingType.Park,
];

const ToolButton: React.FC<{
  type: BuildingType;
  isSelected: boolean;
  onClick: () => void;
  money: number;
}> = ({ type, isSelected, onClick, money }) => {
  const config = BUILDINGS[type];
  const canAfford = money >= config.cost;
  const isBulldoze = type === BuildingType.None;
  
  const bgColor = config.color;

  return (
    <button
      id={`btn-tool-${type}`}
      onClick={onClick}
      disabled={!isBulldoze && !canAfford}
      className={`
        relative flex flex-col items-center justify-center rounded-xl border-2 transition-all shadow-lg flex-shrink-0
        w-14 h-14 md:w-16 md:h-16
        ${isSelected ? 'border-indigo-400 bg-indigo-950 scale-110 z-10' : 'border-slate-700 bg-slate-900 hover:bg-slate-800'}
        ${!isBulldoze && !canAfford ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
      `}
      title={config.description}
    >
      <div className="w-6 h-6 md:w-7 md:h-7 rounded mb-0.5 border border-black/30 shadow-inner flex items-center justify-center overflow-hidden animate-duration-1000" style={{ backgroundColor: isBulldoze ? '#ef4444' : bgColor }}>
        {isBulldoze && <div className="w-full h-full bg-rose-600 text-white flex justify-center items-center font-bold text-sm md:text-base">✕</div>}
        {type === BuildingType.Road && <div className="w-full h-2 bg-slate-800 transform -rotate-45"></div>}
      </div>
      <span className="text-[8px] md:text-[9px] font-bold text-slate-100 uppercase tracking-wide drop-shadow leading-none">{config.name}</span>
      {config.cost > 0 && (
        <span className={`text-[8px] md:text-[9px] font-mono leading-none ${canAfford ? 'text-green-400' : 'text-rose-400'}`}>${config.cost}</span>
      )}
    </button>
  );
};

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
  const newsRef = useRef<HTMLDivElement>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'visuals' | 'simulation' | 'policies' | 'diagnostics'>('visuals');
  
  // HUD UI Scaling Option
  const [uiScale, setUiScale] = useState<number>(() => {
    return parseFloat(localStorage.getItem('sky_metropolis_ui_scale') || '1.0');
  });

  // Track auto-scroll for news dispatch
  useEffect(() => {
    if (newsRef.current) {
      newsRef.current.scrollTop = newsRef.current.scrollHeight;
    }
  }, [newsFeed]);

  // Persist HUD scaling to standard cache store
  useEffect(() => {
    localStorage.setItem('sky_metropolis_ui_scale', uiScale.toString());
  }, [uiScale]);

  const formatHour = (t: number) => {
    const hr = Math.floor(t);
    const min = Math.floor((t % 1) * 60).toString().padStart(2, '0');
    const period = hr >= 12 ? 'PM' : 'AM';
    const displayHr = hr % 12 === 0 ? 12 : hr % 12;
    return `${displayHr}:${min} ${period}`;
  };

  // Determine current active congestion and happiness based on sandbox toggles
  const displayCongestion = sandboxOverridesActive ? sandboxCongestion : congestionLevel;
  const displayHappiness = sandboxOverridesActive ? sandboxHappiness : averageHappiness;

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
      
      {/* Top Bar: Live Stats, Objectives, and Deck toggles */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start pointer-events-auto gap-2 w-full">
        
        {/* Statistics Board & Undo actions */}
        <div className="flex flex-col gap-2 w-full md:w-auto">
          {/* Main Stats Block - Fully Opaque */}
          <div className="bg-slate-900 p-3 rounded-2xl border border-slate-700 shadow-2xl flex gap-4 items-center justify-between md:justify-start">
            <div className="flex flex-col">
              <span className="text-[8px] md:text-[9px] text-slate-400 uppercase font-black tracking-widest leading-none">TREASURY</span>
              <span className="text-xl md:text-2xl font-black text-emerald-400 font-mono drop-shadow-md mt-0.5">${stats.money.toLocaleString()}</span>
            </div>
            <div className="w-px h-8 bg-slate-700"></div>
            <div className="flex flex-col">
              <span className="text-[8px] md:text-[9px] text-slate-400 uppercase font-black tracking-widest leading-none">POPULATION</span>
              <span className="text-lg md:text-xl font-black text-cyan-300 font-mono drop-shadow-md mt-0.5">{stats.population.toLocaleString()}</span>
            </div>
            <div className="w-px h-8 bg-slate-700"></div>
            <div className="flex flex-col">
              <span className="text-[8px] md:text-[9px] text-slate-400 uppercase font-black tracking-widest leading-none">TIME</span>
              <span className="text-base md:text-lg font-bold text-indigo-200 mt-0.5">{formatHour(timeOfDay)}</span>
            </div>
            <div className="w-px h-8 bg-slate-700"></div>
            
            {/* Unified Control & Settings Switcher */}
            <button 
              id="btn-toggle-settings"
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center gap-1 cursor-pointer ${
                isSettingsOpen 
                  ? 'bg-rose-600 hover:bg-rose-500 text-white' 
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              ⚙️ {isSettingsOpen ? 'Close Settings' : 'Settings & Controls'}
            </button>
          </div>

          {/* Core Simulation Metrics (Congestion & Happiness) - Fully Opaque */}
          <div className="bg-slate-900 p-2.5 rounded-2xl border border-slate-700 shadow-lg flex gap-4 text-xs font-medium">
            <div className="flex-1 flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <span className="text-[8px] md:text-[9px] text-slate-400 font-black uppercase tracking-wider flex items-center gap-1">
                  Traffic Congestion {sandboxOverridesActive && <span className="text-[7.5px] bg-amber-950 text-amber-300 px-1 py-0.2 rounded border border-amber-800">Sandbox</span>}
                </span>
                <span className="font-mono text-amber-300 font-bold">{displayCongestion}%</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-500 h-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, displayCongestion)}%` }}
                ></div>
              </div>
            </div>
            <div className="w-px h-6 self-center bg-slate-700"></div>
            <div className="flex-1 flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <span className="text-[8px] md:text-[9px] text-slate-400 font-black uppercase tracking-wider flex items-center gap-1">
                  Public Approval {sandboxOverridesActive && <span className="text-[7.5px] bg-cyan-950 text-cyan-300 px-1 py-0.2 rounded border border-cyan-800">Sandbox</span>}
                </span>
                <span className="font-mono text-cyan-300 font-bold">{displayHappiness}%</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-cyan-500 h-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, displayHappiness)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Quick Undo / Redo controls */}
          <div className="flex gap-2">
            <button 
              id="btn-undo"
              onClick={onUndo}
              className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-755 active:scale-[0.98] transition-all border border-slate-700 rounded-xl text-[9px] font-bold uppercase tracking-wider text-center cursor-pointer"
            >
              ↶ Undo Build
            </button>
            <button 
              id="btn-redo"
              onClick={onRedo}
              className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-755 active:scale-[0.98] transition-all border border-slate-700 rounded-xl text-[9px] font-bold uppercase tracking-wider text-center cursor-pointer"
            >
              ↷ Redo Build
            </button>
          </div>
        </div>

        {/* Right side primary columns: Visual Control Deck & AI Objectives */}
        <div className="flex flex-col gap-3 w-full md:w-96 pointer-events-auto max-h-[85vh] overflow-y-auto no-scrollbar ml-auto">
          
          {/* Slide-out translucent control drawer when settings are active - Fully Opaque */}
          {isSettingsOpen && (
            <div id="settings-drawer-panel" className="bg-slate-950 rounded-3xl border-2 border-indigo-550 shadow-2xl overflow-hidden p-4 space-y-4 flex flex-col max-h-[80vh] w-full animate-in fade-in slide-in-from-right duration-300">
              
              {/* Drawer Title */}
              <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
                <div className="flex flex-col">
                  <span className="font-black text-sm uppercase tracking-widest text-indigo-300">
                    ⚙️ Island Control Center
                  </span>
                  <span className="text-[8px] uppercase tracking-wider text-slate-500 font-mono mt-0.5">Governor Controls Deck</span>
                </div>
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="text-xs font-bold text-slate-400 bg-slate-900 border border-slate-800 rounded px-2 py-1 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>

              {/* Category Tab Selector Buttons - Fully Opaque */}
              <div className="grid grid-cols-4 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setActiveTab('visuals')}
                  className={`py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wide transition-all cursor-pointer ${
                    activeTab === 'visuals' 
                      ? 'bg-indigo-600 text-white shadow' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  🏙️ Visual
                </button>
                <button
                  onClick={() => setActiveTab('simulation')}
                  className={`py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wide transition-all cursor-pointer ${
                    activeTab === 'simulation' 
                      ? 'bg-indigo-600 text-white shadow' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  🚦 Sim
                </button>
                <button
                  onClick={() => setActiveTab('policies')}
                  className={`py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wide transition-all cursor-pointer ${
                    activeTab === 'policies' 
                      ? 'bg-indigo-600 text-white shadow' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  📜 Policy
                </button>
                <button
                  onClick={() => setActiveTab('diagnostics')}
                  className={`py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wide transition-all cursor-pointer ${
                    activeTab === 'diagnostics' 
                      ? 'bg-indigo-600 text-white shadow' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  📊 Diag
                </button>
              </div>

              {/* Tab Workspace Contents */}
              <div className="flex-1 overflow-y-auto pr-0.5 space-y-4 max-h-[55vh] no-scrollbar">

                {/* --- 1. VISUAL PRESENTATION TAB --- */}
                {activeTab === 'visuals' && (
                  <div className="space-y-4">
                    {/* Time of Day Custom Slider */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] text-slate-300">
                        <span className="font-bold uppercase tracking-wider">Dynamic Sun Arc Cycle</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-cyan-400 font-bold">{formatHour(timeOfDay)}</span>
                          <label className="flex items-center gap-1 cursor-pointer select-none">
                            <input 
                              type="checkbox" 
                              checked={autoTime} 
                              onChange={(e) => setAutoTime(e.target.checked)}
                              className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0 w-3 h-3 cursor-pointer"
                            />
                            <span className="text-[9px] text-slate-400 uppercase font-bold">Auto</span>
                          </label>
                        </div>
                      </div>
                      <input 
                        type="range" 
                        min="0.0" 
                        max="23.9" 
                        step="0.1"
                        value={timeOfDay} 
                        onChange={(e) => setTimeOfDay(parseFloat(e.target.value))}
                        className="w-full accent-indigo-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Weather selector configuration */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Environmental Weather System</span>
                      <div className="grid grid-cols-4 gap-1.5">
                        {(['clear', 'overcast', 'rain', 'thunderstorm'] as WeatherType[]).map((w) => (
                          <button
                            key={w}
                            onClick={() => setWeather(w)}
                            className={`py-1 rounded text-[9px] font-bold capitalize border transition-all cursor-pointer ${
                              weather === w 
                                ? 'bg-indigo-600 border-indigo-400 text-white shadow-md' 
                                : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400'
                            }`}
                          >
                            {w === 'clear' ? '☀️ Sunny' : w === 'overcast' ? '☁️ Grey' : w === 'rain' ? '🌧️ Rain' : '⛈️ Storm'}
                          </button>
                        ))}
                        {(['snow', 'fog', 'heatwave'] as WeatherType[]).map((w) => (
                          <button
                            key={w}
                            onClick={() => setWeather(w)}
                            className={`py-1 rounded text-[9px] font-bold capitalize border transition-all cursor-pointer ${
                              weather === w 
                                ? 'bg-indigo-600 border-indigo-400 text-white shadow-md' 
                                : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400'
                            }`}
                          >
                            {w === 'snow' ? '❄️ Snowy' : w === 'fog' ? '🌫️ Smog' : '🔥 Heatwave'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Seasons progression configuration */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Seasonal Evolution Cycle</span>
                      <div className="grid grid-cols-4 gap-1.5">
                        {(['spring', 'summer', 'autumn', 'winter'] as SeasonType[]).map((s) => (
                          <button
                            key={s}
                            onClick={() => setSeason(s)}
                            className={`py-1 rounded text-[9px] font-bold capitalize border transition-all cursor-pointer ${
                              season === s 
                                ? 'bg-indigo-600 border-indigo-400 text-white' 
                                : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400'
                            }`}
                          >
                            {s === 'spring' ? '🌸 Spring' : s === 'summer' ? '🌻 Summer' : s === 'autumn' ? '🍁 Autumn' : '☃️ Winter'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Graphic Lens Filter selection */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Photography Filter Grading</span>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[
                          { id: 'default', label: 'Default' },
                          { id: 'vintage', label: '📜 Vintage' },
                          { id: 'blueprint', label: '📘 Bluept' },
                          { id: 'thermal', label: '🔥 Thermal' }
                        ].map((f) => (
                          <button
                            key={f.id}
                            onClick={() => setPhotoFilter(f.id)}
                            className={`py-1 rounded text-[9px] font-bold border transition-all cursor-pointer ${
                              photoFilter === f.id 
                                ? 'bg-cyan-600 border-cyan-400 text-white' 
                                : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400'
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Dynamic Interactive Overlays */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-indigo-300 uppercase font-bold tracking-wider">Visual Analytics Overlays</span>
                      <div className="grid grid-cols-5 gap-1">
                        {[
                          { id: 'none', label: 'Normal' },
                          { id: 'traffic', label: '🚦 Road' },
                          { id: 'pollution', label: '💨 Smog' },
                          { id: 'land_value', label: '💰 Wealth' },
                          { id: 'utilities', label: '⚡ Grid' }
                        ].map((o) => (
                          <button
                            key={o.id}
                            onClick={() => setActiveOverlay(o.id as OverlayType)}
                            className={`py-1 rounded text-[8px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                              activeOverlay === o.id 
                                ? 'bg-rose-600 border-rose-400 text-white' 
                                : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400'
                            }`}
                          >
                            {o.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Camera Control Utilities */}
                    <div className="space-y-1.5 border-t border-slate-800 pt-2.5">
                      <span className="text-[10px] text-rose-300 uppercase font-black tracking-wider block mb-1">Emergency Operations Desk</span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={onTriggerDisaster}
                          className="py-1 px-2.5 bg-rose-950 border border-rose-600 text-rose-200 text-[9px] font-bold rounded-lg transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                        >
                          🔥 Ignite Fire Outbreak
                        </button>
                        <button
                          onClick={onClearDisasters}
                          disabled={activeDisastersCount === 0}
                          className={`py-1 px-2.5 border text-[9px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                            activeDisastersCount > 0 
                              ? 'bg-emerald-950 border-emerald-600 text-emerald-200 hover:bg-emerald-900 active:scale-95' 
                              : 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                          }`}
                        >
                          🚒 Clear Incidents ({activeDisastersCount})
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-1.5">
                        <button
                          onClick={() => setIsBlackout(!isBlackout)}
                          className={`py-1 px-2.5 border text-[9px] font-bold rounded-lg transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer ${
                            isBlackout 
                              ? 'bg-yellow-950 border-yellow-400 text-yellow-200' 
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          ⚡ {isBlackout ? 'Restore Grid Power' : 'Trigger City Blackout'}
                        </button>
                        <button
                          onClick={() => setIsCinemaActive(!isCinemaActive)}
                          className={`py-1 px-2.5 border text-[9px] font-bold rounded-lg transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer ${
                            isCinemaActive 
                              ? 'bg-indigo-600 border-indigo-400 text-white' 
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          🎥 {isCinemaActive ? 'Disable Drone Cam' : 'Evolve Flyover Cam'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* --- 2. SIMULATION TWEAKER / OVERRIDES --- */}
                {activeTab === 'simulation' && (
                  <div className="space-y-4">
                    <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 space-y-3.5">
                      <span className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider block border-b border-slate-800 pb-1">
                        Live Simulation Diagnostics
                      </span>
                      
                      {/* Live displays */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-slate-400 font-medium">True Core Traffic Congestion</span>
                          <span className="font-mono text-amber-400 font-extrabold">{congestionLevel}%</span>
                        </div>
                        <div className="w-full bg-slate-950 h-1 rounded overflow-hidden">
                          <div className="bg-amber-500 h-full" style={{ width: `${congestionLevel}%` }}></div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-slate-400 font-medium">True Public Approval Rating</span>
                          <span className="font-mono text-cyan-400 font-extrabold">{averageHappiness}%</span>
                        </div>
                        <div className="w-full bg-slate-950 h-1 rounded overflow-hidden">
                          <div className="bg-cyan-500 h-full" style={{ width: `${averageHappiness}%` }}></div>
                        </div>
                      </div>
                    </div>

                    {/* Interactive Sandbox Overrides */}
                    <div className="bg-slate-900 p-3 rounded-2xl border border-dashed border-indigo-500 shadow-inner space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider leading-none">
                            Sandbox Manual Controls
                          </span>
                          <span className="text-[8px] text-slate-500 mt-1">Override simulation limits</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer select-none">
                          <input 
                            id="chk-sandbox-override"
                            type="checkbox" 
                            checked={sandboxOverridesActive}
                            onChange={(e) => setSandboxOverridesActive(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-850 rounded-full peer peer-focus:ring-0 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-indigo-200"></div>
                        </label>
                      </div>

                      {sandboxOverridesActive ? (
                        <div className="space-y-3.5 pt-2 border-t border-slate-800 animate-in fade-in duration-200">
                          
                          {/* Overrule Traffic congestion */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-300">
                              <span className="font-medium">Force Congestion Level</span>
                              <span className="font-mono font-black text-amber-300 bg-amber-950 px-1 rounded border border-amber-800">{sandboxCongestion}%</span>
                            </div>
                            <input 
                              id="slider-override-congestion"
                              type="range" 
                              min="0" 
                              max="100" 
                              step="1"
                              value={sandboxCongestion} 
                              onChange={(e) => setSandboxCongestion(parseInt(e.target.value))}
                              className="w-full accent-amber-500 h-1 bg-slate-950 rounded"
                            />
                            <p className="text-[7.5px] text-slate-500 italic">Adjusts pathfinding grid viscosity & visual car counts instantly.</p>
                          </div>

                          {/* Overrule Approval */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-300">
                              <span className="font-medium">Force Public Approval</span>
                              <span className="font-mono font-black text-cyan-300 bg-cyan-950 px-1 rounded border border-cyan-800">{sandboxHappiness}%</span>
                            </div>
                            <input 
                              id="slider-override-happiness"
                              type="range" 
                              min="0" 
                              max="100" 
                              step="1"
                              value={sandboxHappiness} 
                              onChange={(e) => setSandboxHappiness(parseInt(e.target.value))}
                              className="w-full accent-cyan-500 h-1 bg-slate-950 rounded"
                            />
                            <p className="text-[7.5px] text-slate-500 italic">Drives citizen animation behaviors & structural decaying materials.</p>
                          </div>

                        </div>
                      ) : (
                        <div className="text-center py-2 text-[9px] text-slate-500 italic border-t border-slate-800">
                          Toggles are locked. Activate sandbox override above to tweak.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* --- 3. POLICIES PANEL --- */}
                {activeTab === 'policies' && (
                  <div className="space-y-2.5">
                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest block mb-1">
                      Data-Driven City Policies
                    </span>
                    <div className="flex flex-col gap-2">
                      {policiesConfig.map(policy => {
                        const active = !!policies[policy.id];
                        return (
                          <div key={policy.id} className="flex flex-col p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-white leading-none">{policy.name}</span>
                              <button 
                                id={`btn-policy-settings-${policy.id}`}
                                onClick={() => onTogglePolicy(policy.id)}
                                className={`text-[8.5px] font-bold px-2.5 py-1 rounded transition-all select-none leading-none border cursor-pointer ${
                                  active 
                                    ? 'bg-cyan-950 border-cyan-400 text-cyan-200'
                                    : 'bg-slate-800 border-slate-600 text-slate-400'
                                }`}
                              >
                                {active ? 'ON' : 'OFF'}
                              </button>
                            </div>
                            <p className="text-[8px] text-slate-400 mt-1.5 leading-relaxed">{policy.description}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* --- 4. DIAGNOSTICS & AUDIO PANEL --- */}
                {activeTab === 'diagnostics' && (
                  <div className="space-y-4">
                    
                    {/* Audio feedback settings */}
                    <div className="space-y-2 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <div className="flex justify-between text-[10px] text-slate-300 uppercase font-bold">
                        <span>Island Soundscape Ambient Loop</span>
                        <span className="font-mono text-cyan-300 font-bold">{Math.round(audioVolume * 100)}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="1.0" 
                        step="0.05"
                        value={audioVolume} 
                        onChange={(e) => setAudioVolume(parseFloat(e.target.value))}
                        className="w-full accent-cyan-500 h-1 bg-slate-800 rounded-lg cursor-pointer animate-none"
                      />
                    </div>

                    {/* UI Scale slider control */}
                    <div className="space-y-2 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <div className="flex justify-between text-[10px] text-slate-300 uppercase font-bold items-center">
                        <span>Dashboard Scale Preset</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-indigo-300 font-bold">{Math.round(uiScale * 100)}%</span>
                          <button
                            id="btn-reset-ui-scale"
                            onClick={() => setUiScale(1.0)}
                            className="bg-indigo-950 text-indigo-400 hover:text-white border border-indigo-900 rounded px-1.5 py-0.2 text-[8px] cursor-pointer"
                          >
                            Reset
                          </button>
                        </div>
                      </div>
                      <input 
                        id="slider-ui-scale"
                        type="range" 
                        min="0.75" 
                        max="1.25" 
                        step="0.05"
                        value={uiScale} 
                        onChange={(e) => setUiScale(parseFloat(e.target.value))}
                        className="w-full accent-indigo-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                      />
                      <p className="text-[7px] text-slate-500 italic">Adjusts text layout size dynamically to balance multi-form devices.</p>
                    </div>

                    {/* Core Engine Telemetry HUD */}
                    {telemetryReport && (
                      <div className="bg-slate-900 rounded-xl border border-emerald-500/20 overflow-hidden">
                        <div className="bg-slate-950 px-2.5 py-1.5 flex justify-between items-center border-b border-slate-800 font-black text-slate-300 text-[8.5px] uppercase tracking-wider">
                          <span>Live Engine Telemetry Hub</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        </div>
                        <div className="p-2.5 text-[9px] font-mono space-y-2.5">
                          <div className="grid grid-cols-2 gap-1.5 text-slate-300">
                            <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                              <div className="text-slate-500 text-[7px] uppercase font-bold">HEAP SIZE</div>
                              <div className="text-xs font-bold text-white mt-0.5">
                                {telemetryReport.heapSizeAllocatedMb > 0 ? `${telemetryReport.heapSizeAllocatedMb} MB` : '32 MB'}
                              </div>
                            </div>
                            <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                              <div className="text-slate-500 text-[7px] uppercase font-bold">ECS ENTI</div>
                              <div className="text-xs font-bold text-white mt-0.5">{telemetryReport.activeEntityCount || '0'} entities</div>
                            </div>
                            <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                              <div className="text-slate-500 text-[7px] uppercase font-bold">ROUTINGS</div>
                              <div className="text-xs font-bold text-white mt-0.5">{telemetryReport.pathfindingRequests || '0'} reqs</div>
                            </div>
                            <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                              <div className="text-slate-500 text-[7px] uppercase font-bold">CACHE RATIO</div>
                              <div className="text-xs font-bold text-green-400 mt-0.5">
                                {Math.round(telemetryReport.pathfindingCacheRatio * 100)}% hit
                              </div>
                            </div>
                          </div>

                          {/* Headless audit controller */}
                          {onTriggerHeadlessAudit && (
                            <button
                              id="btn-trigger-headless-audit"
                              onClick={() => onTriggerHeadlessAudit(100)}
                              className="w-full bg-slate-950 hover:bg-emerald-950 hover:text-emerald-200 text-slate-300 border border-slate-800 hover:border-emerald-700/50 py-1 rounded text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-inner active:scale-95 flex items-center justify-center gap-1"
                            >
                              ⚡ Run 100-Tick Headless Balance Audit
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>

              {/* Drawer footer */}
              <div className="border-t border-slate-800 pt-2 text-[8px] text-slate-500 text-center font-mono">
                Sky Metropolis Engine v1.4 • CJS Bundle
              </div>

            </div>
          )}

          {/* Active Scenario Goals Block (Rendered if present) - Fully Opaque */}
          {activeScenarioName && (
            <div className="bg-slate-900 rounded-2xl border border-emerald-500/30 shadow-lg overflow-hidden">
              <div className="bg-emerald-950 px-3 py-1.5 border-b border-emerald-900 flex justify-between items-center">
                <span className="font-bold uppercase text-[9px] tracking-wider text-emerald-300 flex items-center gap-1.5">
                  🏆 Active Scenario: {activeScenarioName}
                </span>
              </div>
              <div className="p-2.5 text-[10px] text-slate-200 font-medium font-mono leading-normal">
                {activeScenarioGoalStatus || 'No active scenario goals.'}
              </div>
            </div>
          )}

          {/* AI Goal & Objectives Panel - Fully Opaque */}
          <div className={`w-full bg-slate-900 rounded-2xl border border-slate-700 shadow-xl overflow-hidden transition-all ${!aiEnabled ? 'opacity-80' : ''}`}>
            <div className="bg-indigo-950 px-3 py-2 flex justify-between items-center border-b border-indigo-900">
              <span className="font-bold uppercase text-[10px] tracking-widest flex items-center gap-2 text-indigo-300">
                <span className={`w-2 h-2 rounded-full ${isGeneratingGoal ? 'bg-yellow-400 animate-ping' : 'bg-cyan-400 animate-pulse'}`}></span>
                AI Mayor Advisor
              </span>
              {isGeneratingGoal && <span className="text-[10px] animate-pulse text-yellow-300 font-mono">Formulating...</span>}
            </div>
            
            <div className="p-3 md:p-4">
              {aiEnabled ? (
                currentGoal ? (
                  <>
                    <p className="text-xs md:text-sm font-medium text-slate-300 mb-2.5 leading-tight italic">"{currentGoal.description}"</p>
                    
                    <div className="flex justify-between items-center bg-slate-950 p-2 rounded-lg border border-slate-800">
                      <div className="text-[10px] md:text-xs text-slate-300 font-medium">
                        Objective: <span className="font-mono font-bold text-white uppercase">
                          {currentGoal.targetType === 'building_count' ? BUILDINGS[currentGoal.buildingType!].name : 
                           currentGoal.targetType === 'money' ? '$' : 'Citizens'} {currentGoal.targetValue}
                        </span>
                      </div>
                      <div className="text-[10px] md:text-xs text-yellow-400 font-bold font-mono bg-yellow-950/40 px-2.5 py-0.5 rounded border border-yellow-700/50">
                        +${currentGoal.reward}
                      </div>
                    </div>
    
                    {currentGoal.completed && (
                      <button
                        id="btn-claim-reward"
                        onClick={onClaimReward}
                        className="mt-2.5 w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold py-2 px-4 rounded shadow-lg transition-all animate-bounce text-xs uppercase tracking-wide border border-emerald-500/40 cursor-pointer"
                      >
                        Collect Reward
                      </button>
                    )}
                  </>
                ) : (
                  <div className="text-xs text-slate-400 py-2 italic flex items-center gap-2">
                    <span className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></span>
                    Advisor formulating recommendations...
                  </div>
                )
              ) : (
                <div className="text-xs text-slate-400 py-1 font-mono italic">
                   Free Sandbox Active
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar: Interactive Tools Brush & Live Feed */}
      <div className="flex flex-col-reverse md:flex-row md:justify-between md:items-end pointer-events-auto mt-auto gap-2 w-full">
        
        {/* Brush Selector toolbar - Fully Opaque */}
        <div className="flex gap-2 bg-slate-900 p-2 rounded-2xl border border-slate-700 shadow-2xl w-full md:w-auto overflow-x-auto no-scrollbar justify-start">
          <div className="flex gap-2 min-w-max px-1">
            {tools.map((type) => (
              <ToolButton
                key={type}
                type={type}
                isSelected={selectedTool === type}
                onClick={() => onSelectTool(type)}
                money={stats.money}
              />
            ))}
          </div>
          <div className="text-[9px] text-slate-500 uppercase writing-mode-vertical flex items-center justify-center font-black tracking-widest border-l border-slate-800 pl-2 ml-1 select-none">Zone</div>
        </div>

        {/* Live News Terminal Feed - Fully Opaque */}
        <div className="w-full md:w-80 h-32 md:h-40 bg-slate-950 text-white rounded-2xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden relative">
          <div className="bg-slate-900 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-300 border-b border-slate-800 flex justify-between items-center">
            <span>Terminal Dispatch</span>
            <span className={`w-1.5 h-1.5 rounded-full ${aiEnabled ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`}></span>
          </div>
          
          <div ref={newsRef} className="flex-1 overflow-y-auto p-2 md:p-3 space-y-1.5 text-[10px] font-mono scroll-smooth z-10">
            {newsFeed.length === 0 && <div className="text-slate-600 italic text-center mt-8">Establishing island telemetry stream...</div>}
            {newsFeed.map((news) => (
              <div key={news.id} className={`
                border-l-2 pl-2 py-0.5 transition-all text-[11px] leading-snug
                ${news.type === 'positive' ? 'border-green-500 text-green-300 bg-green-950' : ''}
                ${news.type === 'negative' ? 'border-red-500 text-red-300 bg-red-950' : ''}
                ${news.type === 'neutral' ? 'border-cyan-500 text-cyan-200 bg-slate-900' : ''}
              `}>
                {news.text}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default UIOverlay;
