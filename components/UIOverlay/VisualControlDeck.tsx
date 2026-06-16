/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Sun, Cloud, CloudRain, Wind, Compass, Sparkles, 
  Eye, ZapOff, Video, Flame, AlertCircle, PlusCircle, Activity
} from 'lucide-react';
import { WeatherType, SeasonType, OverlayType } from '../../src/kernel/visual/VisualEngineState';
import policiesConfig from '../../src/config/policies.json';

interface VisualControlDeckProps {
  // Tabs state
  activeTab: 'visuals' | 'simulation' | 'policies' | 'diagnostics';
  setActiveTab: (tab: 'visuals' | 'simulation' | 'policies' | 'diagnostics') => void;

  // Visual parameters
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

  // Sandbox parameters
  sandboxOverridesActive: boolean;
  setSandboxOverridesActive: (b: boolean) => void;
  sandboxCongestion: number;
  setSandboxCongestion: (v: number) => void;
  sandboxHappiness: number;
  setSandboxHappiness: (v: number) => void;

  // Policy parameters
  policies: Record<string, boolean>;
  onTogglePolicy: (id: string) => void;

  // Diagnostics
  uiScale: number;
  setUiScale: (s: number) => void;
  telemetryReport: any | null;
  onTriggerHeadlessAudit?: (ticks: number) => void;

  // Metrics (Live display)
  congestionLevel: number;
  averageHappiness: number;
}

export const VisualControlDeck: React.FC<VisualControlDeckProps> = ({
  activeTab,
  setActiveTab,
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
  sandboxOverridesActive,
  setSandboxOverridesActive,
  sandboxCongestion,
  setSandboxCongestion,
  sandboxHappiness,
  setSandboxHappiness,
  policies,
  onTogglePolicy,
  uiScale,
  setUiScale,
  telemetryReport,
  onTriggerHeadlessAudit,
  congestionLevel,
  averageHappiness,
}) => {
  const formatHour = (t: number) => {
    const hr = Math.floor(t);
    const min = Math.floor((t % 1) * 60).toString().padStart(2, '0');
    const period = hr >= 12 ? 'PM' : 'AM';
    const displayHr = hr % 12 === 0 ? 12 : hr % 12;
    return `${displayHr}:${min} ${period}`;
  };

  return (
    <div id="visual-control-deck" className="w-80 bg-slate-950/95 border border-slate-700/60 rounded-3xl p-4 shadow-2xl flex flex-col gap-4">
      {/* Category Tabs Header */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800">
        {[
          { id: 'visuals', label: '🎨 Art' },
          { id: 'simulation', label: '⚙️ Sim' },
          { id: 'policies', label: '⚖️ Law' },
          { id: 'diagnostics', label: '📊 Dev' },
        ].map((tab) => (
          <button
            key={tab.id}
            id={`tab-deck-${tab.id}`}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-1 rounded-lg text-[9px] font-bold text-center transition-all cursor-pointer ${
              activeTab === tab.id 
                ? 'bg-slate-800 border border-slate-700 text-white shadow' 
                : 'text-slate-400 hover:text-white border border-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tabs Body Container */}
      <div className="flex-1 overflow-y-auto max-h-[350px] pr-1 scrollbar-thin">
        
        {/* TAB 1: VISUALS ENVIRONMENT */}
        {activeTab === 'visuals' && (
          <div className="space-y-4">
            
            {/* Time of day controller */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-400 uppercase font-bold tracking-wider">Dynamic Solar Engine</span>
                <button
                  id="btn-toggle-autotime"
                  onClick={() => setAutoTime(!autoTime)}
                  className={`text-[8.5px] font-bold px-2 py-0.5 rounded leading-none transition-all cursor-pointer ${
                    autoTime 
                      ? 'bg-cyan-950 border border-cyan-500 text-cyan-200' 
                      : 'bg-slate-900 border border-slate-800 text-slate-500'
                  }`}
                >
                  {autoTime ? '🛰️ Auto Engine: Active' : '⏸️ Time Locked'}
                </button>
              </div>
              <input 
                id="slider-time-of-day"
                type="range" 
                min="0.0" 
                max="23.9" 
                step="0.1"
                value={timeOfDay} 
                onChange={(e) => setTimeOfDay(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Weather selector */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Environmental Weather System</span>
              <div className="grid grid-cols-4 gap-1">
                {(['clear', 'overcast', 'rain', 'thunderstorm'] as WeatherType[]).map((w) => (
                  <button
                    key={w}
                    onClick={() => setWeather(w)}
                    className={`py-1 rounded text-[9px] font-bold capitalize border transition-all cursor-pointer ${
                      weather === w 
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-md' 
                        : 'bg-slate-900 border-slate-850 hover:border-slate-800 text-slate-400'
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
                        : 'bg-slate-900 border-slate-850 hover:border-slate-800 text-slate-400'
                    }`}
                  >
                    {w === 'snow' ? '❄️ Snowy' : w === 'fog' ? '🌫️ Smog' : '🔥 Heatwave'}
                  </button>
                ))}
              </div>
            </div>

            {/* Seasons progression */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Seasonal Evolution Cycle</span>
              <div className="grid grid-cols-4 gap-1">
                {(['spring', 'summer', 'autumn', 'winter'] as SeasonType[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSeason(s)}
                    className={`py-1 rounded text-[9px] font-bold capitalize border transition-all cursor-pointer ${
                      season === s 
                        ? 'bg-indigo-600 border-indigo-400 text-white' 
                        : 'bg-slate-900 border-slate-850 hover:border-slate-800 text-slate-400'
                    }`}
                  >
                    {s === 'spring' ? '🌸 Spring' : s === 'summer' ? '🌻 Summer' : s === 'autumn' ? '🍁 Autumn' : '☃️ Winter'}
                  </button>
                ))}
              </div>
            </div>

            {/* Graphic Lens Filter */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Photography Filter Grading</span>
              <div className="grid grid-cols-4 gap-1">
                {[
                  { id: 'default', label: 'Default' },
                  { id: 'vintage', label: '📜 Vintage' },
                  { id: 'blueprint', label: 'Blueprint' },
                  { id: 'thermal', label: '🔥 Thermal' }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setPhotoFilter(f.id)}
                    className={`py-1 rounded text-[9px] font-bold border transition-all cursor-pointer ${
                      photoFilter === f.id 
                        ? 'bg-cyan-600 border-cyan-400 text-white' 
                        : 'bg-slate-900 border-slate-850 hover:border-slate-850 text-slate-400'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Analytics Overlays */}
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
                        : 'bg-slate-900 border-slate-850 hover:border-slate-800 text-slate-400'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Emergency Operations Desk */}
            <div className="space-y-1.5 border-t border-slate-800 pt-3">
              <span className="text-[10px] text-rose-300 uppercase font-black tracking-wider block mb-1">Emergency Operations Desk</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={onTriggerDisaster}
                  className="py-1 px-2 bg-rose-950 border border-rose-600 text-rose-200 text-[9px] font-bold rounded-lg transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                >
                  🔥 Ignite Fire Outbreak
                </button>
                <button
                  onClick={onClearDisasters}
                  disabled={activeDisastersCount === 0}
                  className={`py-1 px-2 border text-[9px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    activeDisastersCount > 0 
                      ? 'bg-emerald-950 border-emerald-600 text-emerald-200 hover:bg-emerald-900 active:scale-95' 
                      : 'bg-slate-900 border-slate-850 text-slate-650 cursor-not-allowed'
                  }`}
                >
                  🚒 Clear Incidents ({activeDisastersCount})
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-1.5">
                <button
                  onClick={() => setIsBlackout(!isBlackout)}
                  className={`py-1 px-2 border text-[9px] font-bold rounded-lg transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer ${
                    isBlackout 
                      ? 'bg-yellow-950 border-yellow-400 text-yellow-200' 
                      : 'bg-slate-900 border-slate-850 text-slate-300 hover:border-slate-800'
                  }`}
                >
                  ⚡ {isBlackout ? 'Restore Grid Power' : 'Trigger City Blackout'}
                </button>
                <button
                  onClick={() => setIsCinemaActive(!isCinemaActive)}
                  className={`py-1 px-2 border text-[9px] font-bold rounded-lg transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer ${
                    isCinemaActive 
                      ? 'bg-indigo-600 border-indigo-400 text-white' 
                      : 'bg-slate-900 border-slate-850 text-slate-300 hover:border-slate-800'
                  }`}
                >
                  🎥 {isCinemaActive ? 'Disable Drone Cam' : 'Evolve Flyover Cam'}
                </button>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: SIMULATION CONTROLS */}
        {activeTab === 'simulation' && (
          <div className="space-y-4">
            <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 space-y-3.5">
              <span className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider block border-b border-slate-800 pb-1">
                Live Simulation Diagnostics
              </span>
              
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
            <div className="bg-slate-900 p-3 rounded-2xl border border-dashed border-indigo-500/80 shadow-inner space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider leading-none">
                    Sandbox Manual Controls
                  </span>
                  <span className="text-[8px] text-slate-500 mt-1">Override simulation limits</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input 
                    id="chk-sandbox"
                    type="checkbox" 
                    checked={sandboxOverridesActive}
                    onChange={(e) => setSandboxOverridesActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-focus:ring-0 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-indigo-200"></div>
                </label>
              </div>

              {sandboxOverridesActive ? (
                <div className="space-y-3.5 pt-2 border-t border-slate-800 animate-in fade-in duration-200">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-300">
                      <span className="font-medium">Force Congestion Level</span>
                      <span className="font-mono font-black text-amber-300 bg-amber-950 px-1 rounded border border-amber-800">{sandboxCongestion}%</span>
                    </div>
                    <input 
                      id="override-congestion"
                      type="range" 
                      min="0" 
                      max="100" 
                      step="1"
                      value={sandboxCongestion} 
                      onChange={(e) => setSandboxCongestion(parseInt(e.target.value))}
                      className="w-full accent-amber-500 h-1 bg-slate-950 rounded"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-300">
                      <span className="font-medium">Force Public Approval</span>
                      <span className="font-mono font-black text-cyan-300 bg-cyan-950 px-1 rounded border border-cyan-800">{sandboxHappiness}%</span>
                    </div>
                    <input 
                      id="override-happiness"
                      type="range" 
                      min="0" 
                      max="100" 
                      step="1"
                      value={sandboxHappiness} 
                      onChange={(e) => setSandboxHappiness(parseInt(e.target.value))}
                      className="w-full accent-cyan-500 h-1 bg-slate-950 rounded"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-2 text-[9px] text-slate-500 italic border-t border-slate-800">
                  Toggles are locked. Activate sandbox override above.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: POLICIES */}
        {activeTab === 'policies' && (
          <div className="space-y-2.5">
            <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest block mb-1">
              Data-Driven City Policies
            </span>
            <div className="flex flex-col gap-2">
              {policiesConfig.map(policy => {
                const active = !!policies[policy.id];
                return (
                  <div key={policy.id} className="flex flex-col p-2.5 rounded-xl bg-slate-900 border border-slate-850 hover:border-slate-800 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-white leading-none">{policy.name}</span>
                      <button 
                        id={`btn-policy-${policy.id}`}
                        onClick={() => onTogglePolicy(policy.id)}
                        className={`text-[8.5px] font-bold px-2.5 py-1 rounded transition-all select-none leading-none border cursor-pointer ${
                          active 
                            ? 'bg-cyan-950 border-cyan-400 text-cyan-200'
                            : 'bg-slate-800 border-slate-700 text-slate-400'
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

        {/* TAB 4: DIAGNOSTICS */}
        {activeTab === 'diagnostics' && (
          <div className="space-y-4">
            
            {/* Audio volume */}
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
                className="w-full accent-cyan-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Scale UI */}
            <div className="space-y-2 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
              <div className="flex justify-between text-[10px] text-slate-300 uppercase font-bold items-center">
                <span>Dashboard Scale</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-indigo-300 font-bold">{Math.round(uiScale * 100)}%</span>
                  <button
                    onClick={() => setUiScale(1.0)}
                    className="bg-indigo-950 text-indigo-400 hover:text-white border border-indigo-900 rounded px-1.5 py-0.2 text-[8px] cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              </div>
              <input 
                type="range" 
                min="0.75" 
                max="1.25" 
                step="0.05"
                value={uiScale} 
                onChange={(e) => setUiScale(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Core Engine Telemetry HUD */}
            {telemetryReport && (
              <div className="bg-slate-900 rounded-xl border border-emerald-500/20 overflow-hidden">
                <div className="bg-slate-950 px-2.5 py-1.5 flex justify-between items-center border-b border-slate-800 font-black text-slate-300 text-[8.5px] uppercase tracking-wider">
                  <span>Live Engine Telemetry</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                </div>
                <div className="p-2.5 text-[9px] font-mono space-y-2.5">
                  <div className="grid grid-cols-2 gap-1.5 text-slate-300">
                    <div className="bg-slate-950 p-1.5 rounded border border-slate-850">
                      <div className="text-slate-500 text-[7px] uppercase font-bold">HEAP SIZE</div>
                      <div className="text-xs font-bold text-white mt-0.5">
                        {telemetryReport.heapSizeAllocatedMb > 0 ? `${telemetryReport.heapSizeAllocatedMb} MB` : '32 MB'}
                      </div>
                    </div>
                    <div className="bg-slate-950 p-1.5 rounded border border-slate-850">
                      <div className="text-slate-500 text-[7px] uppercase font-bold">ECS ENTI</div>
                      <div className="text-xs font-bold text-white mt-0.5">{telemetryReport.activeEntityCount || '0'}</div>
                    </div>
                    <div className="bg-slate-950 p-1.5 rounded border border-slate-850">
                      <div className="text-slate-500 text-[7px] uppercase font-bold">ROUTINGS</div>
                      <div className="text-xs font-bold text-white mt-0.5">{telemetryReport.pathfindingRequests || '0'}</div>
                    </div>
                    <div className="bg-slate-950 p-1.5 rounded border border-slate-850">
                      <div className="text-slate-500 text-[7px] uppercase font-bold">CACHE RATIO</div>
                      <div className="text-xs font-bold text-green-400 mt-0.5">
                        {Math.round(telemetryReport.pathfindingCacheRatio * 100)}%
                      </div>
                    </div>
                  </div>

                  {onTriggerHeadlessAudit && (
                    <button
                      onClick={() => onTriggerHeadlessAudit(100)}
                      className="w-full bg-slate-950 hover:bg-emerald-950 hover:text-emerald-200 text-slate-300 border border-slate-850 hover:border-emerald-700/50 py-1 rounded text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-inner active:scale-95 flex items-center justify-center gap-1"
                    >
                      ⚡ 100-Tick Headless Balance Audit
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Drawer footer */}
      <div className="border-t border-slate-800 pt-2 text-[8px] text-slate-550 text-center font-mono select-none">
        Sky Metropolis Builder v1.5 • CJS Bundle
      </div>
    </div>
  );
};
