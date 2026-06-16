/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DollarSign, Users, Clock, RotateCcw, RotateCw, Heart, Activity } from 'lucide-react';
import { CityStats } from '../../types';

interface StatsPanelProps {
  stats: CityStats;
  timeOfDay: number;
  congestionLevel: number;
  averageHappiness: number;
  sandboxOverridesActive: boolean;
  sandboxCongestion: number;
  sandboxHappiness: number;
  onUndo: () => void;
  onRedo: () => void;
  onToggleSettings: () => void;
  isSettingsOpen: boolean;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({
  stats,
  timeOfDay,
  congestionLevel,
  averageHappiness,
  sandboxOverridesActive,
  sandboxCongestion,
  sandboxHappiness,
  onUndo,
  onRedo,
  onToggleSettings,
  isSettingsOpen,
}) => {
  const formatHour = (t: number) => {
    const hr = Math.floor(t);
    const min = Math.floor((t % 1) * 60).toString().padStart(2, '0');
    const period = hr >= 12 ? 'PM' : 'AM';
    const displayHr = hr % 12 === 0 ? 12 : hr % 12;
    return `${displayHr}:${min} ${period}`;
  };

  const displayCongestion = sandboxOverridesActive ? sandboxCongestion : congestionLevel;
  const displayHappiness = sandboxOverridesActive ? sandboxHappiness : averageHappiness;

  return (
    <div id="stats-panel" className="flex flex-col gap-2 w-full md:w-auto">
      {/* Main Stats Block - Fully Opaque */}
      <div className="bg-slate-900/95 p-3 rounded-2xl border border-slate-700/80 shadow-2xl flex gap-4 items-center justify-between md:justify-start">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400">
            <DollarSign className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] md:text-[9px] text-slate-400 uppercase font-black tracking-widest leading-none">TREASURY</span>
            <span className="text-lg md:text-xl font-black text-emerald-400 font-mono drop-shadow-md mt-0.5">${stats.money.toLocaleString()}</span>
          </div>
        </div>

        <div className="w-px h-8 bg-slate-800"></div>

        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-cyan-500/10 rounded-lg text-cyan-300">
            <Users className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] md:text-[9px] text-slate-400 uppercase font-black tracking-widest leading-none">POPULATION</span>
            <span className="text-base md:text-lg font-black text-cyan-300 font-mono drop-shadow-md mt-0.5">{stats.population.toLocaleString()}</span>
          </div>
        </div>

        <div className="w-px h-8 bg-slate-800"></div>

        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-300">
            <Clock className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] md:text-[9px] text-slate-400 uppercase font-black tracking-widest leading-none">DAY {stats.day}</span>
            <span className="text-xs md:text-sm font-black text-indigo-300 font-mono drop-shadow-md mt-0.5">{formatHour(timeOfDay)}</span>
          </div>
        </div>
      </div>

      {/* Auxiliary Stats System Details */}
      <div className="flex gap-2 w-full md:w-auto">
        {/* Quality of Life HUD mini widgets */}
        <div className="flex-1 bg-slate-900/90 py-1.5 px-3 rounded-xl border border-slate-800 shadow flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Heart className={`w-3.5 h-3.5 ${displayHappiness > 60 ? 'text-cyan-400' : 'text-rose-400'}`} />
            <span className="text-[9px] text-slate-400 font-semibold uppercase">Approval:</span>
            <span className="text-[10px] font-mono font-bold text-white">{displayHappiness}%</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className={`w-3.5 h-3.5 ${displayCongestion < 40 ? 'text-green-400' : 'text-amber-400'}`} />
            <span className="text-[9px] text-slate-400 font-semibold uppercase">Traffic:</span>
            <span className="text-[10px] font-mono font-bold text-white">{displayCongestion}%</span>
          </div>
        </div>

        {/* Undo, Redo, and Settings Control Unit */}
        <div className="flex gap-1">
          <button
            id="btn-undo-stat"
            onClick={onUndo}
            className="p-2 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer active:scale-95"
            title="Undo Last Action"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            id="btn-redo-stat"
            onClick={onRedo}
            className="p-2 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer active:scale-95"
            title="Redo Last Action"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            id="btn-settings-toggle"
            onClick={onToggleSettings}
            className={`px-3 py-1.5 border text-[10px] font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow ${
              isSettingsOpen 
                ? 'bg-indigo-600 border-indigo-400 text-white' 
                : 'bg-slate-950 border-slate-850 hover:bg-slate-900 text-slate-300'
            }`}
          >
            🛠️ Operational Deck
          </button>
        </div>
      </div>
    </div>
  );
};
