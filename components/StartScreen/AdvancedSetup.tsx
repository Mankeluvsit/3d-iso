/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sliders, Map, CloudSun, UserCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { MayorSpecialty, MapArchetype, ClimatePreset } from './types';

interface AdvancedSetupProps {
  isOpen: boolean;
  onToggleOpen: () => void;
  // Specialties
  mayorSpecialties: MayorSpecialty[];
  selectedMayor: string;
  onMayorSelect: (id: string) => void;
  isAiModeActive: boolean;
  // Maps
  mapArchetypes: MapArchetype[];
  selectedMapStyle: string;
  onMapStyleSelect: (id: string) => void;
  // Climates
  climatePresets: ClimatePreset[];
  selectedPreset: string;
  onPresetSelect: (id: string) => void;
}

export const AdvancedSetup: React.FC<AdvancedSetupProps> = React.memo(({
  isOpen,
  onToggleOpen,
  mayorSpecialties,
  selectedMayor,
  onMayorSelect,
  isAiModeActive,
  mapArchetypes,
  selectedMapStyle,
  onMapStyleSelect,
  climatePresets,
  selectedPreset,
  onPresetSelect,
}) => {
  return (
    <div className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden select-none" id="advanced-setup-container">
      {/* Header Lever */}
      <button
        onClick={onToggleOpen}
        className="w-full px-4 py-3 flex justify-between items-center bg-slate-900 hover:bg-slate-850/80 transition-colors text-left text-slate-300 hover:text-white cursor-pointer font-bold text-xs uppercase tracking-wider focus:outline-none"
        id="btn-advanced-toggle"
      >
        <span className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          Advanced Simulator Configuration
        </span>
        <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
          {isOpen ? (
            <>Collapse Options <ChevronUp className="w-3.5 h-3.5 text-cyan-400" /></>
          ) : (
            <>Expand Customizations <ChevronDown className="w-3.5 h-3.5 text-slate-500" /></>
          )}
        </span>
      </button>

      {/* Interactive Accordion Layout */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-slate-850/60 bg-slate-950/45"
          >
            <div className="p-4 md:p-5 space-y-5">
              {/* SPECIALTY CHOICES */}
              <div className={`space-y-2.5 transition-all duration-300 ${!isAiModeActive ? 'opacity-25 pointer-events-none' : ''}`}>
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Specialty Executive Perks & Grants
                  </span>
                  {!isAiModeActive && (
                    <span className="text-[8px] font-mono text-slate-500 uppercase">
                      Requires AI Mayor Mode
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {mayorSpecialties.map((mayor) => {
                    const isSelected = selectedMayor === mayor.id;
                    return (
                      <button
                        key={mayor.id}
                        onClick={() => onMayorSelect(mayor.id)}
                        disabled={!isAiModeActive}
                        className={`flex flex-col text-left p-3 rounded-xl border transition-all duration-200 cursor-pointer outline-none ${
                          isSelected
                            ? `bg-slate-900 border-2 ${mayor.highlightClass} shadow-lg shadow-black/40`
                            : 'bg-slate-900/20 border-slate-900 text-slate-400 hover:border-slate-800'
                        }`}
                        id={`btn-mayor-specialty-${mayor.id}`}
                      >
                        <div className="flex justify-between items-center w-full gap-2 mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm flex-shrink-0">{mayor.icon}</span>
                            <span className="text-xs font-black text-white">{mayor.name}</span>
                          </div>
                          <span className="text-[8px] font-mono text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-900/30 px-1.5 py-0.5 rounded">
                            +${mayor.bonusCash.toLocaleString()}
                          </span>
                        </div>
                        <div className="text-[9px] font-black text-indigo-400 uppercase tracking-wider mb-1">
                          {mayor.badge}
                        </div>
                        <p className="text-[9.5px] text-slate-400 leading-relaxed font-medium">
                          {mayor.perkDesc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SPACE GRID SPLITTER */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1.5">
                {/* GEOGRAPHY MAPS */}
                <div className="space-y-2.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 px-1">
                    <Map className="w-3.5 h-3.5 text-yellow-400" />
                    Topographical Land Profiles
                  </span>
                  <div className="flex flex-col gap-2">
                    {mapArchetypes.map((mStyle) => {
                      const isSelected = selectedMapStyle === mStyle.id;
                      return (
                        <button
                          key={mStyle.id}
                          onClick={() => onMapStyleSelect(mStyle.id)}
                          className={`flex items-center justify-between p-3 rounded-xl text-left border transition-all duration-150 cursor-pointer outline-none ${
                            isSelected
                              ? 'bg-slate-900 border-indigo-550 text-white shadow-md'
                              : 'bg-slate-900/10 border-slate-900 text-slate-400 hover:border-slate-800'
                          }`}
                          id={`btn-map-archetype-${mStyle.id}`}
                        >
                          <div className="pr-2">
                            <div className="text-xs font-black text-white leading-none">
                              {mStyle.name}
                            </div>
                            <div className="text-[9px] text-slate-500 font-normal leading-normal mt-1 max-w-xs">
                              {mStyle.description}
                            </div>
                          </div>
                          <span className="text-[7.5px] font-black uppercase tracking-wider bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-400 flex-shrink-0 ml-1">
                            {mStyle.badge}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* CLIMATE/ATMOSPHERE */}
                <div className="space-y-2.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 px-1">
                    <CloudSun className="w-3.5 h-3.5 text-sky-450" />
                    Initial Climate & Atmospheric Preset
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {climatePresets.map((preset) => {
                      const isSelected = selectedPreset === preset.id;
                      return (
                        <button
                          key={preset.id}
                          onClick={() => onPresetSelect(preset.id)}
                          className={`flex items-center gap-2 p-2.5 rounded-xl text-[10px] font-medium border transition-all duration-150 text-left cursor-pointer outline-none ${
                            isSelected
                              ? 'bg-slate-900 border-indigo-550 text-white shadow-md'
                              : 'bg-slate-900/15 border-slate-900 text-slate-400 hover:border-slate-800'
                          }`}
                          title={preset.description}
                          id={`btn-climate-${preset.id}`}
                        >
                          <span className="text-sm flex-shrink-0">{preset.icon}</span>
                          <div className="truncate">
                            <div className="font-extrabold text-[10px] text-white leading-none truncate">
                              {preset.name}
                            </div>
                            <div className="text-[8px] text-slate-500 truncate capitalize mt-1">
                              {preset.season} • {preset.weather}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

AdvancedSetup.displayName = 'AdvancedSetup';
