/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BuildingType } from '../../types';
import { BUILDINGS } from '../../constants';
import { Trash, Compass, Landmark, TreePine, Hammer, Home, ShoppingBag, Factory } from 'lucide-react';

interface ToolBarProps {
  selectedTool: BuildingType;
  onSelectTool: (type: BuildingType) => void;
  money: number;
}

const tools = [
  BuildingType.None, // Bulldoze
  BuildingType.Road,
  BuildingType.Residential,
  BuildingType.Commercial,
  BuildingType.Industrial,
  BuildingType.Park,
];

export const ToolBar: React.FC<ToolBarProps> = ({
  selectedTool,
  onSelectTool,
  money,
}) => {
  const getToolIcon = (type: BuildingType) => {
    switch (type) {
      case BuildingType.None:
        return <Trash className="w-5 h-5 text-rose-500" />;
      case BuildingType.Road:
        return (
          <div className="relative w-5 h-5 flex items-center justify-center">
            <div className="w-full h-1.5 bg-slate-800 rotate-45 border-y border-slate-600"></div>
          </div>
        );
      case BuildingType.Bridge:
        return <Hammer className="w-5 h-5 text-amber-500" />;
      case BuildingType.Residential:
        return <Home className="w-5 h-5 text-green-400" />;
      case BuildingType.Commercial:
        return <ShoppingBag className="w-5 h-5 text-blue-400" />;
      case BuildingType.Industrial:
        return <Factory className="w-5 h-5 text-yellow-500" />;
      case BuildingType.Park:
        return <TreePine className="w-5 h-5 text-emerald-400" />;
      default:
        return <Compass className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div id="toolbar-container" className="flex gap-2 bg-slate-900/95 p-2 rounded-2xl border border-slate-705 shadow-2xl w-full md:w-auto overflow-x-auto no-scrollbar justify-start items-center">
      <div className="flex gap-2 min-w-max px-1">
        {tools.map((type) => {
          const config = BUILDINGS[type];
          const canAfford = money >= config.cost;
          const isBulldoze = type === BuildingType.None;
          const isSelected = selectedTool === type;

          return (
            <button
              key={type}
              id={`btn-tool-${type}`}
              onClick={() => onSelectTool(type)}
              disabled={!isBulldoze && !canAfford}
              className={`
                relative flex flex-col items-center justify-center rounded-xl border transition-all shadow-lg flex-shrink-0
                w-14 h-14 md:w-16 md:h-16
                ${isSelected ? 'border-indigo-400 bg-indigo-950/60 scale-105 z-10' : 'border-slate-800 bg-slate-950/80 hover:bg-slate-900'}
                ${!isBulldoze && !canAfford ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
              `}
              title={`${config.name}: ${config.description}`}
            >
              <div className="flex items-center justify-center mb-0.5">
                {getToolIcon(type)}
              </div>
              <span className="text-[8px] md:text-[9px] font-bold text-slate-200 uppercase tracking-wide drop-shadow leading-none">
                {config.name}
              </span>
              {config.cost > 0 && (
                <span className={`text-[8px] md:text-[9px] font-mono leading-none ${canAfford ? 'text-green-400' : 'text-rose-400'}`}>
                  ${config.cost}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="text-[9px] text-slate-500 uppercase writing-mode-vertical flex items-center justify-center font-black tracking-widest border-l border-slate-800 pl-3 ml-1 select-none">
        Zone Palette
      </div>
    </div>
  );
};
