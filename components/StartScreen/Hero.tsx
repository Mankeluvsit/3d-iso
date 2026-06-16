/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sparkles, Play, Volume2, VolumeX, ChevronRight, Terminal } from 'lucide-react';

interface HeroProps {
  isMusicEnabled: boolean;
  onToggleMusic: () => void;
  onPlay: () => void;
}

export const Hero: React.FC<HeroProps> = React.memo(({
  isMusicEnabled,
  onToggleMusic,
  onPlay,
}) => {
  return (
    <div className="relative flex flex-col items-center text-center py-4 w-full select-none" id="hero-section">
      {/* Floating/Fixed Music Toggle inside container */}
      <div className="absolute -top-2 right-0 z-50">
        <button
          onClick={onToggleMusic}
          className="p-2.5 bg-slate-950/90 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-full transition-all text-slate-400 hover:text-white cursor-pointer hover:scale-105 active:scale-95 shadow-lg shadow-black/80 flex items-center justify-center"
          title={isMusicEnabled ? "Mute Cosmic Soundscapes" : "Activate Ambient Physics Loop"}
          id="btn-music-toggle"
        >
          {isMusicEnabled ? (
            <Volume2 className="w-4 h-4 text-cyan-400 animate-pulse" />
          ) : (
            <VolumeX className="w-4 h-4 text-rose-500" />
          )}
        </button>
      </div>

      {/* Decorative Core Physics Tag */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-950 rounded-full border border-slate-800 shadow-[0_0_15px_rgba(34,211,238,0.08)] mb-4 text-[9px] font-black tracking-widest text-indigo-400 uppercase animate-pulse">
        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
        Core Simulation Physics v2.6.4
      </div>

      {/* Title & Glow */}
      <div className="relative group max-w-lg mb-2">
        <div className="absolute -inset-1.5 bg-gradient-to-r from-cyan-500 to-indigo-600 rounded-lg blur-xl opacity-30 group-hover:opacity-40 transition-all duration-1000 animate-pulse"></div>
        <h1 
          className="relative text-5xl md:text-6xl font-black tracking-tighter leading-none bg-gradient-to-r from-white via-cyan-100 to-indigo-400 bg-clip-text text-transparent filter drop-shadow-[0_0_20px_rgba(34,211,238,0.3)]"
          id="hero-title"
        >
          SkyMetropolis
        </h1>
      </div>

      {/* Tagline */}
      <p className="text-slate-400 text-xs md:text-sm font-semibold tracking-wider max-w-lg mx-auto mb-6 flex items-center justify-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
        3D Isometric Urban Sandbox & AI Governor Engine
      </p>

      {/* Primary Glowing Action Trigger */}
      <div className="w-full max-w-md px-4 mb-4">
        <button
          onClick={onPlay}
          className="group relative w-full py-4 px-6 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-black rounded-2xl shadow-2xl hover:shadow-[0_0_30px_rgba(99,102,241,0.45)] transform transition-all active:scale-[0.985] text-xs md:text-sm tracking-widest uppercase flex items-center justify-center gap-2 border border-indigo-400/30 cursor-pointer overflow-hidden"
          id="btn-play-protocol"
        >
          {/* Subtle inside gradient highlight */}
          <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer duration-1000"></span>
          <Play className="w-4 h-4 fill-white animate-pulse" />
          <span>Engage Metro Simulator Protocol</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Credit line */}
      <a
        href="https://x.com/ammaar"
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-[10px] text-slate-500 hover:text-cyan-400 transition-colors font-mono hover:scale-105 active:scale-95 cursor-pointer pb-2"
        id="credit-link"
      >
        <span>Under executive direction of</span>
        <span className="font-extrabold text-slate-400 border-b border-dashed border-slate-600 hover:border-cyan-400">@ammaar</span>
      </a>

      {/* Tiny separator lines */}
      <div className="h-0.5 w-32 bg-gradient-to-r from-transparent via-slate-800 to-transparent rounded-full mt-1"></div>
    </div>
  );
});

Hero.displayName = 'Hero';
