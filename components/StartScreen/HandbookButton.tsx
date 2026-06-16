/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BookOpen, X, Sparkles, AlertTriangle, ShieldCheck, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const HandbookButton: React.FC = React.memo(() => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div id="handbook-button-root">
      {/* Floating trigger in bottom-right corner */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-1.5 px-3 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl shadow-2xl transition-all cursor-pointer text-[10px] uppercase font-black tracking-widest hover:scale-105 active:scale-95"
        title="Open Simulator Handbook"
        id="btn-handbook-trigger"
      >
        <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
        <span>Handbook Manual</span>
      </button>

      {/* Cyberpunk Cinematic Handbook Modal overlay */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="handbook-modal-portal">
            {/* Backdrop with elegant blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md cursor-pointer"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl shadow-indigo-950/20 overflow-hidden text-white select-none max-h-[85vh] overflow-y-auto no-scrollbar"
            >
              {/* Top ambient color ring */}
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500"></div>

              {/* Close button */}
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 p-1.5 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700/80 rounded-full transition-all cursor-pointer hover:scale-110 active:scale-90"
                id="btn-handbook-close"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Title Section */}
              <div className="mb-6">
                <span className="inline-flex items-center gap-1 text-[8px] font-black tracking-widest text-indigo-400 uppercase bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-900/40 mb-2">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  Operator Guidebook
                </span>
                <h2 className="text-xl md:text-2xl font-black bg-gradient-to-r from-white via-slate-100 to-indigo-100 bg-clip-text text-transparent">
                  Interactive Simulator Handbook
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Welcome to SkyMetropolis. Review the following core directive channels to run a high-density orbit.
                </p>
              </div>

              {/* Accordion/Grid Items */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-4 text-xs">
                {/* 1. Zone Constructing */}
                <div className="flex flex-col bg-slate-950/40 p-4 rounded-2xl border border-slate-850 hover:border-emerald-500/10 transition-colors relative">
                  <div className="flex items-center gap-2 mb-2 text-emerald-400 font-extrabold uppercase tracking-wide text-[11px]">
                    <span className="p-1 rounded bg-emerald-950/40 border border-emerald-900/30 text-emerald-400">🏗️</span>
                    <span>1. Land Zoning</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed text-[10.5px]">
                    Select Roads to lay pathways. Construct 
                    <span className="text-red-400 font-bold"> Residential</span> (green/red), 
                    <span className="text-blue-400 font-bold"> Commercial</span> (blue), or 
                    <span className="text-yellow-400 font-bold"> Industrial</span> (yellow) grid lots nearby to expand capacity.
                  </p>
                </div>

                {/* 2. Emergency Outbreaks */}
                <div className="flex flex-col bg-slate-950/40 p-4 rounded-2xl border border-slate-850 hover:border-rose-500/10 transition-colors relative">
                  <div className="flex items-center gap-2 mb-2 text-rose-450 font-extrabold uppercase tracking-wide text-[11px]">
                    <span className="p-1 rounded bg-rose-950/40 border border-rose-900/30 text-rose-400">🚨</span>
                    <span>2. Outbreaks</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed text-[10.5px]">
                    Overheated districts trigger fire hazards! Deploy firefighting personnel dynamically using the visual utility deck controls. Maintain balanced climates to lower hazards.
                  </p>
                </div>

                {/* 3. AI Objectives */}
                <div className="flex flex-col bg-slate-950/40 p-4 rounded-2xl border border-slate-850 hover:border-indigo-500/10 transition-colors relative">
                  <div className="flex items-center gap-2 mb-2 text-indigo-400 font-extrabold uppercase tracking-wide text-[11px]">
                    <span className="p-1 rounded bg-indigo-950/40 border border-indigo-900/30 text-indigo-400">🏆</span>
                    <span>3. AI Objectives</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed text-[10.5px]">
                    Fulfill targets designated by your AI Advisor. Keep public approval high and congestion rates low to receive grand treasury rewards. Collect your tokens easily.
                  </p>
                </div>
              </div>

              {/* Tips block */}
              <div className="mt-6 bg-slate-950 p-3.5 rounded-2xl border border-slate-850 flex items-start gap-2.5">
                <div className="p-1 rounded bg-indigo-950 text-indigo-400 flex-shrink-0">
                  <Heart className="w-3.5 h-3.5 text-rose-400 animate-pulse fill-rose-450" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-350 block leading-none mb-1">
                    Simulator Tip
                  </span>
                  <span className="text-[10px] text-slate-400 leading-normal block">
                    Use simple road clicks spanning across water to automatically construct bridges. Real-time pathfinders allow direct route evaluation.
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
});

HandbookButton.displayName = 'HandbookButton';
