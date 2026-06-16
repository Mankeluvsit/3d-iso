/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Cpu, Palette, Trophy, ShieldCheck } from 'lucide-react';
import { GameMode } from './types';

interface ModeSelectorProps {
  selectedMode: GameMode;
  onModeChange: (mode: GameMode) => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = React.memo(({
  selectedMode,
  onModeChange,
}) => {
  return (
    <div className="flex flex-col gap-2.5 w-full select-none" id="mode-selector-section">
      <div className="flex justify-between items-center px-1">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
          <Trophy className="w-3.5 h-3.5 text-cyan-400" />
          1. Select Game Protocol Mode
        </span>
        <span className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-950/40 border border-indigo-900/40 px-1.5 rounded-sm">
          Sim Core
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* AI Mayor Quest */}
        <button
          onClick={() => onModeChange('ai_mayor')}
          className={`group flex flex-col text-left p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden focus:outline-none cursor-pointer ${
            selectedMode === 'ai_mayor'
              ? 'border-indigo-500 bg-indigo-950/20 shadow-[0_0_20px_rgba(99,102,241,0.25)]'
              : 'border-slate-800 bg-slate-900/30 hover:border-slate-700 hover:bg-slate-900/60'
          }`}
          id="btn-mode-ai-mayor"
        >
          {/* Decorative subtle background grid element */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-indigo-900/10 via-transparent to-transparent pointer-events-none"></div>

          <div className="flex justify-between items-center mb-2.5 relative z-10">
            <div className={`p-2 rounded-xl border transition-all ${
              selectedMode === 'ai_mayor' 
                ? 'bg-indigo-950 text-indigo-400 border-indigo-500/50' 
                : 'bg-slate-950 text-slate-500 border-slate-850'
            }`}>
              <Cpu className="w-4 h-4" />
            </div>
            <span className="text-[8px] font-black bg-indigo-950/80 border border-indigo-700/30 px-2 py-0.5 rounded-full text-indigo-300 uppercase tracking-widest">
              AI ADVISOR ACTIVE
            </span>
          </div>

          <h3 className="text-sm font-black text-white group-hover:text-indigo-400 transition-colors relative z-10 flex items-center gap-1.5">
            AI Mayor Quest
          </h3>
          <p className="text-slate-400 text-[10.5px] leading-relaxed mt-1.5 relative z-10">
            Deploy Gemini governor models to secure smart suggestions. Finish milestones to unlock budget rewards.
          </p>
        </button>

        {/* Grand Sandbox */}
        <button
          onClick={() => onModeChange('sandbox')}
          className={`group flex flex-col text-left p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden focus:outline-none cursor-pointer ${
            selectedMode === 'sandbox'
              ? 'border-cyan-500 bg-cyan-950/10 shadow-[0_0_20px_rgba(34,211,238,0.2)]'
              : 'border-slate-800 bg-slate-900/30 hover:border-slate-700 hover:bg-slate-900/60'
          }`}
          id="btn-mode-sandbox"
        >
          {/* Decorative subtle background grid element */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-cyan-900/10 via-transparent to-transparent pointer-events-none"></div>

          <div className="flex justify-between items-center mb-2.5 relative z-10">
            <div className={`p-2 rounded-xl border transition-all ${
              selectedMode === 'sandbox' 
                ? 'bg-cyan-950 text-cyan-400 border-cyan-800/50' 
                : 'bg-slate-950 text-slate-500 border-slate-850'
            }`}>
              <Palette className="w-4 h-4" />
            </div>
            <span className="text-[8px] font-black bg-cyan-950/80 border border-cyan-700/30 px-2 py-0.5 rounded-full text-cyan-300 uppercase tracking-widest">
              CREATIVE MODE
            </span>
          </div>

          <h3 className="text-sm font-black text-white group-hover:text-cyan-400 transition-colors relative z-10 flex items-center gap-1.5">
            Grand Sandbox
          </h3>
          <p className="text-slate-400 text-[10.5px] leading-relaxed mt-1.5 relative z-10">
            Uncapped local sandbox. Enjoy pure creative space building your megacity layout free from advice or metrics.
          </p>
        </button>
      </div>
    </div>
  );
});

ModeSelector.displayName = 'ModeSelector';
