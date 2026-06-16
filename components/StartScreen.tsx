/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { 
  Building2, 
  Cpu, 
  Sparkles, 
  Coins, 
  Palette, 
  Compass, 
  Sun, 
  CloudSun, 
  CloudRain, 
  Snowflake,
  ChevronRight,
  TrendingUp,
  Sliders,
  Play,
  UserCheck,
  ShieldCheck,
  Wrench,
  Library,
  Flame,
  Award,
  BookOpen,
  Map,
  Volume2,
  VolumeX,
  Plus
} from 'lucide-react';

interface StartScreenProps {
  onStart: (
    aiEnabled: boolean,
    customMoney: number,
    startingSeason?: 'spring' | 'summer' | 'autumn' | 'winter',
    startingWeather?: 'clear' | 'overcast' | 'rain' | 'thunderstorm' | 'snow',
    startingTime?: number
  ) => void;
}

interface ClimatePreset {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  weather: 'clear' | 'overcast' | 'rain' | 'thunderstorm' | 'snow';
  time: number;
}

interface MayorSpecialty {
  id: string;
  badge: string;
  name: string;
  perkTitle: string;
  perkDesc: string;
  icon: React.ReactNode;
  bonusCash: number;
  highlightClass: string;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  // Game modes: 'ai_mayor' or 'sandbox'
  const [selectedMode, setSelectedMode] = useState<'ai_mayor' | 'sandbox'>('ai_mayor');
  
  // Custom starting money selection
  const [startingMoney, setStartingMoney] = useState<number>(1000);
  
  // Atmospheric Preset selection
  const [selectedPreset, setSelectedPreset] = useState<string>('spring_sunrise');

  // Currently active Mayor specialty profile
  const [selectedMayor, setSelectedMayor] = useState<string>('eco');

  // Geographical Land Archetype preview selection
  const [selectedMapStyle, setSelectedMapStyle] = useState<string>('meandering');

  // Handbook/Tutorial state toggle
  const [isHandbookOpen, setIsHandbookOpen] = useState<boolean>(false);

  // Audio mute toggler on start screen
  const [isMusicEnabled, setIsMusicEnabled] = useState<boolean>(true);

  const climatePresets: ClimatePreset[] = [
    {
      id: 'spring_sunrise',
      name: 'Spring Sunrise',
      description: 'Cool crisp spring morning with cherry blossoms',
      icon: <span className="text-pink-300 font-bold">🌸</span>,
      season: 'spring',
      weather: 'clear',
      time: 7.5
    },
    {
      id: 'summer_noon',
      name: 'Summer Noon',
      description: 'Lush golden afternoon sun with bright skies',
      icon: <span className="text-yellow-400 font-bold">🌻</span>,
      season: 'summer',
      weather: 'clear',
      time: 12.0
    },
    {
      id: 'autumn_twilight',
      name: 'Autumn Rain',
      description: 'Moody orange canopy with dynamic drizzles',
      icon: <span className="text-amber-500 font-bold">🍁</span>,
      season: 'autumn',
      weather: 'rain',
      time: 17.5
    },
    {
      id: 'winter_frost',
      name: 'Winter Blizzard',
      description: 'Dense powdery snow covered hills under fog',
      icon: <span className="text-cyan-200 font-bold">❄️</span>,
      season: 'winter',
      weather: 'snow',
      time: 10.0
    }
  ];

  const mayorSpecialties: MayorSpecialty[] = [
    {
      id: 'eco',
      badge: '🌲 Climate Reformer',
      name: 'Eco Adviser',
      perkTitle: 'Sub-Tropical Greening Permit',
      perkDesc: 'Parks and carbon offset reserves yield +15% happiness approval multiplier.',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-400 animate-pulse" />,
      bonusCash: 500,
      highlightClass: 'border-emerald-550 shadow-emerald-950/40'
    },
    {
      id: 'tech',
      badge: '⚡ Smart Infrastructure',
      name: 'Dr. Cybernetica',
      perkTitle: 'Grid Node Pre-allocation',
      perkDesc: 'Reduces electric distribution blackout risks and expands road connectivity efficiency.',
      icon: <Wrench className="w-5 h-5 text-indigo-400" />,
      bonusCash: 1500,
      highlightClass: 'border-indigo-550 shadow-indigo-950/40'
    },
    {
      id: 'tycoon',
      badge: '💼 Industrial Magnate',
      name: 'Chairman Sterling',
      perkTitle: 'Consolidated Treasury Grant',
      perkDesc: 'Receive +$5,000 immediate surplus, but initial atmospheric pollution metrics increase slightly.',
      icon: <Coins className="w-5 h-5 text-amber-400" />,
      bonusCash: 5000,
      highlightClass: 'border-amber-550 shadow-amber-950/40'
    },
    {
      id: 'scholar',
      badge: '📚 Academic Planner',
      name: 'Provost Vanesse',
      perkTitle: 'Intelligent Civic Syllabus',
      perkDesc: 'Commercial and educational zones qualify for faster double tax yields under proper grid placement.',
      icon: <Library className="w-5 h-5 text-cyan-400" />,
      bonusCash: 2000,
      highlightClass: 'border-cyan-550 shadow-cyan-950/40'
    }
  ];

  const mapArchetypes = [
    {
      id: 'meandering',
      name: 'Meandering Delta Valley',
      description: 'Procedural river flow splitting lush grasslands. Offers perfect balance for beginners.',
      badge: 'Balanced Grid'
    },
    {
      id: 'highlands',
      name: 'High Alpine Ridges',
      description: 'Elevated terrain blocks with fewer flat surfaces. Requires clever road layouts.',
      badge: 'Rocky Terraced'
    },
    {
      id: 'basin',
      name: 'Arid Basin Solars',
      description: 'High drylands optimized for massive solar grid layouts and industrial sprawl.',
      badge: 'Flatlands'
    }
  ];

  const handleModeChange = (mode: 'ai_mayor' | 'sandbox') => {
    setSelectedMode(mode);
    if (mode === 'ai_mayor') {
      const activeMayorProfile = mayorSpecialties.find(m => m.id === selectedMayor);
      const bonus = activeMayorProfile ? activeMayorProfile.bonusCash : 1000;
      setStartingMoney(1000 + bonus);
    } else {
      setStartingMoney(50000);
    }
  };

  const handleMayorSelect = (id: string) => {
    setSelectedMayor(id);
    if (selectedMode === 'ai_mayor') {
      const profile = mayorSpecialties.find(m => m.id === id);
      const bonus = profile ? profile.bonusCash : 1000;
      setStartingMoney(1000 + bonus);
    }
  };

  const handlePlay = () => {
    const preset = climatePresets.find(p => p.id === selectedPreset) || climatePresets[0];
    onStart(
      selectedMode === 'ai_mayor',
      startingMoney,
      preset.season,
      preset.weather,
      preset.time
    );
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-50 text-white font-sans p-4 md:p-6 bg-slate-950 select-none overflow-y-auto no-scrollbar">
      
      {/* Decorative Blueprint Background Grid Lines with CSS scanner effect */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30 pointer-events-none"></div>
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.5)] animate-shimmer pointer-events-none"></div>

      <div className="max-w-4xl w-full bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden z-10 flex flex-col gap-6 my-auto animate-in fade-in zoom-in-95 duration-500 max-h-[96vh]">
        
        {/* Absolute Outer Header Accessories */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <button 
            onClick={() => setIsMusicEnabled(!isMusicEnabled)}
            className="p-2 bg-slate-950/80 hover:bg-slate-800 text-slate-400 hover:text-white rounded-full border border-slate-800 transition-all cursor-pointer"
            title={isMusicEnabled ? "Mute Background Loop" : "Enable Soundscapes"}
          >
            {isMusicEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
          </button>
        </div>

        {/* SkyMetropolis Isometric Header Panel */}
        <div className="text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-950 rounded-full border border-slate-850 mb-2.5 text-[9px] font-black tracking-widest text-indigo-400 uppercase">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            Core Simulation Physics v2.6.4
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-br from-white via-cyan-100 to-indigo-400 bg-clip-text text-transparent tracking-tighter leading-none mb-1 text-center">
            SkyMetropolis
          </h1>
          <p className="text-slate-400 text-[10px] md:text-xs font-semibold uppercase tracking-widest flex items-center justify-center gap-2 mb-1">
            🚀 3D Isometric Urban sandbox & AI Governor engine
          </p>
          <div className="h-0.5 w-24 bg-gradient-to-r from-cyan-500/20 via-indigo-500 to-emerald-500/20 mx-auto rounded-full"></div>
        </div>

        {/* Outer Layout Divided into Left settings panel / Right options */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 overflow-y-auto no-scrollbar pr-0.5">
          
          {/* LEFT 7 PANELS: Game Setup Options */}
          <div className="md:col-span-7 space-y-4">
            
            {/* 1. INTERACTIVE GAME MODE SELECTOR */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-cyan-400" />
                  1. Play Protocol Profile
                </span>
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Simulation Core</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {/* AI Advisor Mode Selection Card */}
                <div 
                  onClick={() => handleModeChange('ai_mayor')}
                  className={`group flex flex-col p-3 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
                    selectedMode === 'ai_mayor' 
                      ? 'border-indigo-550 bg-slate-950/90 shadow-lg shadow-indigo-950/30' 
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="p-1 rounded bg-indigo-950 text-indigo-400 border border-indigo-900">
                      <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                    <span className="text-[7.5px] font-black bg-indigo-950/80 border border-indigo-700/30 px-1.5 py-0.2 rounded-full text-indigo-300 uppercase tracking-widest">
                      RECOMMENDED
                    </span>
                  </div>
                  <h3 className="text-xs font-black text-white group-hover:text-indigo-400 transition-colors">
                    🏆 AI Mayor Quest
                  </h3>
                  <p className="text-slate-400 text-[9.5px] leading-tight mt-1">
                    Receive dynamic objectives from Gemini advisor. Earn substantial grant rewards!
                  </p>
                </div>

                {/* Sandbox mode selection card */}
                <div 
                  onClick={() => handleModeChange('sandbox')}
                  className={`group flex flex-col p-3 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
                    selectedMode === 'sandbox' 
                      ? 'border-cyan-550 bg-slate-950/90 shadow-lg shadow-cyan-950/30' 
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="p-1 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                      <Palette className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                    </div>
                    <span className="text-[7.5px] font-black bg-cyan-950 border border-cyan-700/30 px-1.5 py-0.2 rounded-full text-cyan-300 uppercase tracking-widest">
                      FREEPLAY
                    </span>
                  </div>
                  <h3 className="text-xs font-black text-white group-hover:text-cyan-400 transition-colors">
                    🎨 Grand Sandbox
                  </h3>
                  <p className="text-slate-400 text-[9.5px] leading-tight mt-1">
                    Deactivate goal engines. Pure creative planning at a peaceful, modular tempo.
                  </p>
                </div>
              </div>
            </div>

            {/* 2. CHOOSE MAYOR SPECIALTY PROFILE */}
            <div className={`space-y-2 transition-all ${selectedMode !== 'ai_mayor' ? 'opacity-30 pointer-events-none' : ''}`}>
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  2. Executive Mayor Specialization
                </span>
                <span className="text-[8px] font-semibold text-amber-500 uppercase font-mono">Selects Perk & Grants</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {mayorSpecialties.map((mayor) => (
                  <div
                    key={mayor.id}
                    onClick={() => handleMayorSelect(mayor.id)}
                    className={`flex flex-col p-2.5 rounded-xl border transition-all cursor-pointer hover:bg-slate-950 ${
                      selectedMayor === mayor.id
                        ? `bg-slate-950 border-2 ${mayor.highlightClass} shadow-md`
                        : 'bg-slate-900/40 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex justify-between items-center gap-2 mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm flex-shrink-0">{mayor.icon}</span>
                        <span className="text-[10px] font-black text-white">{mayor.name}</span>
                      </div>
                      <span className="text-[7.5px] font-mono text-emerald-400 font-bold bg-emerald-950 border border-emerald-900/40 px-1 rounded-sm">
                        +${mayor.bonusCash.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-[8.5px] font-black text-indigo-400 leading-none mb-1">{mayor.badge}</div>
                    <p className="text-[8.5px] text-slate-400 leading-normal truncate-3-lines">{mayor.perkDesc}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT 5 PANELS: Atmosphere, Map Style, Sandbox values */}
          <div className="md:col-span-5 space-y-4">
            
            {/* 3. TERRAIN GEOGRAPHY ARCHETYPE */}
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 px-1">
                <Map className="w-3.5 h-3.5 text-yellow-400" />
                3. Topographical Land Profile
              </span>
              <div className="flex flex-col gap-1.5">
                {mapArchetypes.map((mStyle) => (
                  <button
                    key={mStyle.id}
                    onClick={() => setSelectedMapStyle(mStyle.id)}
                    className={`flex items-center justify-between p-2 rounded-xl text-left border transition-all cursor-pointer ${
                      selectedMapStyle === mStyle.id
                        ? 'bg-slate-950 border-indigo-500 text-white shadow-md'
                        : 'bg-slate-900/30 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="text-[10px] font-bold text-white leading-none">{mStyle.name}</div>
                      <div className="text-[8px] text-slate-500 font-normal leading-normal mt-0.5 max-w-xs">{mStyle.description}</div>
                    </div>
                    <span className="text-[7px] font-black uppercase tracking-widest bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-slate-400 flex-shrink-0 ml-1">
                      {mStyle.badge}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. ATMOSPHERIC SCENIC WEATHER PRESET */}
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 px-1">
                <Sliders className="w-3.5 h-3.5 text-sky-400" />
                4. Initial Atmospheric Setting
              </span>
              
              <div className="grid grid-cols-2 gap-2">
                {climatePresets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setSelectedPreset(preset.id)}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-xl text-[9px] font-bold border transition-all text-left cursor-pointer ${
                      selectedPreset === preset.id
                        ? 'bg-slate-950 border-indigo-500 text-white shadow-md'
                        : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                    title={preset.description}
                  >
                    <span className="text-xs flex-shrink-0">{preset.icon}</span>
                    <div className="truncate">
                      <div className="font-extrabold text-[9.5px] text-white leading-none truncate">{preset.name}</div>
                      <div className="text-[7.5px] text-slate-500 truncate capitalize mt-0.5">{preset.season} • {preset.weather}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 5. TREASURY CALCULATOR BREAKDOWN */}
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850 space-y-1.5">
              <div className="flex justify-between items-center text-[8px] text-slate-500 uppercase tracking-wider font-extrabold pb-1 border-b border-slate-900">
                <span>Core Budget Allocation</span>
                <span>Active Ledger Sheet</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-350">
                <span>Base Treasury Grant:</span>
                <span className="font-mono">$1,000</span>
              </div>
              {selectedMode === 'ai_mayor' && (
                <div className="flex justify-between text-[10px] text-emerald-400">
                  <span>Specialty Surplus Bonus:</span>
                  <span className="font-mono font-bold">+${(startingMoney - 1000).toLocaleString()}</span>
                </div>
              )}
              {selectedMode === 'sandbox' && (
                <div className="flex justify-between text-[10px] text-cyan-400">
                  <span>Creative Sandbox Allowance:</span>
                  <span className="font-mono font-bold">+$49,000</span>
                </div>
              )}
              <div className="h-[1px] bg-slate-900 w-full"></div>
              <div className="flex justify-between items-center text-[11px] font-black text-white">
                <span className="flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-emerald-400" />
                  STARTING LEDGER BALANCE:
                </span>
                <span className="font-mono text-emerald-400 text-xs bg-emerald-950 border border-emerald-900 px-1.5 py-0.2 rounded font-bold">
                  ${startingMoney.toLocaleString()}
                </span>
              </div>
            </div>

          </div>

        </div>

        {/* BOTTOM SECTION: Handbook Manual and Main Start Button Action Trigger */}
        <div className="flex flex-col gap-2.5">
          
          {/* Quick Expandable Handbook Accordion */}
          <div className="bg-slate-950 rounded-xl border border-slate-850 overflow-hidden">
            <button 
              onClick={() => setIsHandbookOpen(!isHandbookOpen)}
              className="w-full px-3 py-2 flex justify-between items-center text-left text-slate-300 hover:text-white transition-all cursor-pointer font-bold text-[10px] uppercase tracking-wider bg-slate-900/60"
            >
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                📖 Interactive Handbook: How to Govern & Simulate
              </span>
              <span className="text-slate-500 font-mono">{isHandbookOpen ? '[-] Collapse Handbook' : '[+] Expand Handbook'}</span>
            </button>
            
            {isHandbookOpen && (
              <div className="p-3.5 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-900 text-[10px] text-slate-400 bg-slate-950 overflow-y-auto max-h-[16vh] no-scrollbar">
                <div className="space-y-1">
                  <div className="font-extrabold text-white uppercase tracking-wider flex items-center gap-1">
                    <span className="text-emerald-400">🏗️</span> 1. Zone Constructing
                  </div>
                  <p className="leading-relaxed">
                    Select Roads to lay pathways. Construct Residential (green), Commercial (blue), or Industrial (yellow) grid lots nearby to expand capacity.
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="font-extrabold text-white uppercase tracking-wider flex items-center gap-1">
                    <span className="text-red-400">🚒</span> 2. Emergency Outbreaks
                  </div>
                  <p className="leading-relaxed">
                    Overheated districts trigger fire hazards! Deploy firefighting personnel dynamically using the visual utility deck controls.
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="font-extrabold text-white uppercase tracking-wider flex items-center gap-1">
                    <span className="text-purple-400">🏆</span> 3. AI Objectives
                  </div>
                  <p className="leading-relaxed">
                    Fulfill targets designated by your AI Advisor. Keep public approval high and congestion rates low to receive grand treasury rewards.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <button 
              onClick={handlePlay}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-black rounded-xl shadow-xl transform transition-all hover:scale-[1.008] active:scale-[0.992] text-sm tracking-widest uppercase flex items-center justify-center gap-1.5 border border-indigo-400/30 cursor-pointer"
            >
              <Play className="w-4 h-4 text-white fill-white animate-pulse" />
              Engage Metro Simulator Protocol
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="text-center pt-0.5">
              <a 
                href="https://x.com/ammaar" 
                target="_blank" 
                rel="noreferrer" 
                className="inline-flex items-center gap-1 text-[10px] text-slate-500 hover:text-cyan-400 transition-colors font-mono group"
              >
                <span>Built under executive direction of</span>
                <span className="font-bold group-hover:underline decoration-cyan-500/55 underline-offset-2">@ammaar</span>
              </a>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default StartScreen;
