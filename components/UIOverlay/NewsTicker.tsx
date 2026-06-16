/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { NewsItem } from '../../types';

interface NewsTickerProps {
  newsFeed: NewsItem[];
  aiEnabled: boolean;
}

export const NewsTicker: React.FC<NewsTickerProps> = ({
  newsFeed,
  aiEnabled,
}) => {
  const newsRef = useRef<HTMLDivElement>(null);

  // Track auto-scroll for news dispatch
  useEffect(() => {
    if (newsRef.current) {
      newsRef.current.scrollTop = newsRef.current.scrollHeight;
    }
  }, [newsFeed]);

  return (
    <div id="newsticker-container" className="w-full md:w-80 h-32 md:h-40 bg-slate-950 text-white rounded-2xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden relative">
      <div className="bg-slate-900 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-300 border-b border-slate-800 flex justify-between items-center select-none">
        <span>Terminal Dispatch</span>
        <span className={`w-1.5 h-1.5 rounded-full ${aiEnabled ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`}></span>
      </div>
      
      <div ref={newsRef} className="flex-1 overflow-y-auto p-2 md:p-3 space-y-1.5 text-[10px] font-mono scroll-smooth z-10">
        {newsFeed.length === 0 && (
          <div className="text-slate-600 italic text-center mt-8 select-none">
            Establishing island telemetry stream...
          </div>
        )}
        {newsFeed.map((news) => (
          <div key={news.id} className={`
            border-l-2 pl-2 py-0.5 transition-all text-[11px] leading-snug
            ${news.type === 'positive' ? 'border-green-500 text-green-300 bg-green-950/40' : ''}
            ${news.type === 'negative' ? 'border-red-500 text-red-300 bg-red-950/40' : ''}
            ${news.type === 'neutral' ? 'border-cyan-500 text-cyan-200 bg-slate-900/40' : ''}
          `}>
            {news.text}
          </div>
        ))}
      </div>
    </div>
  );
};
