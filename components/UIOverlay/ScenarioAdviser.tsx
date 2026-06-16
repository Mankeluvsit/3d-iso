/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Target, Trophy, Sparkles, ShieldAlert } from 'lucide-react';
import { AIGoal, BuildingType } from '../../types';
import { BUILDINGS } from '../../constants';

interface ScenarioAdviserProps {
  activeScenarioName?: string;
  activeScenarioGoalStatus?: string;
  aiEnabled: boolean;
  isGeneratingGoal: boolean;
  currentGoal: AIGoal | null;
  onClaimReward: () => void;
}

export const ScenarioAdviser: React.FC<ScenarioAdviserProps> = ({
  activeScenarioName,
  activeScenarioGoalStatus,
  aiEnabled,
  isGeneratingGoal,
  currentGoal,
  onClaimReward,
}) => {
  return (
    <div id="scenario-adviser-container" className="flex flex-col gap-2.5 w-full">
      {/* Active Scenario Goals Block */}
      {activeScenarioName && (
        <div className="bg-slate-900/95 rounded-2xl border border-emerald-500/30 shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-emerald-950/80 px-3 py-1.5 border-b border-emerald-900/50 flex justify-between items-center select-none">
            <span className="font-bold uppercase text-[9px] tracking-wider text-emerald-300 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-emerald-400" />
              Active Scenario: {activeScenarioName}
            </span>
          </div>
          <div className="p-2.5 text-[10px] text-slate-200 font-medium font-mono leading-normal">
            {activeScenarioGoalStatus || 'No active scenario goals.'}
          </div>
        </div>
      )}

      {/* AI Goal & Objectives Panel */}
      <div className={`w-full bg-slate-900/95 rounded-2xl border border-slate-700/60 shadow-xl overflow-hidden transition-all ${!aiEnabled ? 'opacity-80' : ''}`}>
        <div className="bg-indigo-950/80 px-3 py-2 flex justify-between items-center border-b border-indigo-900/50 select-none">
          <span className="font-bold uppercase text-[10px] tracking-widest flex items-center gap-2 text-indigo-300">
            <span className={`w-2 h-2 rounded-full ${isGeneratingGoal ? 'bg-yellow-400 animate-ping' : 'bg-cyan-400 animate-pulse'}`}></span>
            <Target className="w-3.5 h-3.5 text-indigo-400" />
            AI Mayor Advisor
          </span>
          {isGeneratingGoal && (
            <span className="text-[10px] animate-pulse text-yellow-300 font-mono">
              Formulating...
            </span>
          )}
        </div>
        
        <div className="p-3 md:p-4">
          {aiEnabled ? (
            currentGoal ? (
              <>
                <p className="text-xs md:text-sm font-medium text-slate-300 mb-2.5 leading-tight italic">
                  "{currentGoal.description}"
                </p>
                
                <div className="flex justify-between items-center bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                  <div className="text-[10px] md:text-xs text-slate-300 font-medium">
                    Objective:{' '}
                    <span className="font-mono font-bold text-white uppercase">
                      {currentGoal.targetType === 'building_count' 
                        ? BUILDINGS[currentGoal.buildingType!].name 
                        : currentGoal.targetType === 'money' ? '$' : 'Citizens'}{' '}
                      {currentGoal.targetValue}
                    </span>
                  </div>
                  <div className="text-[10px] md:text-xs text-yellow-400 font-bold font-mono bg-yellow-950/40 px-2.5 py-0.5 rounded border border-yellow-700/50 flex items-center gap-1 select-none">
                    <Sparkles className="w-3 h-3 text-yellow-400 animate-pulse" />
                    +{currentGoal.reward}
                  </div>
                </div>

                {currentGoal.completed && (
                  <button
                    id="btn-collect-reward"
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
  );
};
