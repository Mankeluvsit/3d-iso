/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Coins } from 'lucide-react';

interface TreasuryPreviewProps {
  startingMoney: number;
  isAiModeActive: boolean;
  specialtyBonus: number;
}

export const TreasuryPreview: React.FC<TreasuryPreviewProps> = React.memo(({
  startingMoney,
  isAiModeActive,
  specialtyBonus,
}) => {
  return (
    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-900 shadow-xl select-none" id="treasury-preview-container">
      {/* Tiny ledger accent lines */}
      <div className="flex justify-between items-center text-[8.5px] text-slate-500 uppercase tracking-widest font-black pb-1.5 border-b border-slate-900">
        <span>Ledger Breakdown</span>
        <span>Balance Sheet Ledger v5</span>
      </div>

      <div className="space-y-1.5 mt-3">
        <div className="flex justify-between text-xs text-slate-400">
          <span>Simulation Base Grant:</span>
          <span className="font-mono font-medium">$1,000</span>
        </div>

        {isAiModeActive ? (
          <div className="flex justify-between text-xs text-emerald-400 font-medium">
            <span>Specialty Mayor Surplus:</span>
            <span className="font-mono font-bold">
              +${specialtyBonus.toLocaleString()}
            </span>
          </div>
        ) : (
          <div className="flex justify-between text-xs text-cyan-400 font-medium">
            <span>Creative Sandbox Capital:</span>
            <span className="font-mono font-bold">+$49,000</span>
          </div>
        )}

        <div className="h-[1.5px] bg-slate-900 w-full my-2"></div>

        <div className="flex justify-between items-center text-[12px] font-black text-white">
          <span className="flex items-center gap-1.5 uppercase tracking-wider text-slate-300">
            <Coins className="w-4 h-4 text-emerald-400 animate-pulse" />
            Starting Balance Sheet:
          </span>
          <span className="font-mono text-emerald-400 text-sm bg-emerald-950/60 border border-emerald-900/30 px-2 py-0.5 rounded-lg font-black shadow-inner">
            ${startingMoney.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
});

TreasuryPreview.displayName = 'TreasuryPreview';
