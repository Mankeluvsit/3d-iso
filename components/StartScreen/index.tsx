/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useMemo } from 'react';
import { 
  ShieldCheck, 
  Wrench, 
  Coins, 
  Library, 
  Sparkles 
} from 'lucide-react';
import { ClimatePreset, MayorSpecialty, MapArchetype, GameMode, SeasonType, WeatherType } from './types';
import { Hero } from './Hero';
import { ModeSelector } from './ModeSelector';
import { AdvancedSetup } from './AdvancedSetup';
import { TreasuryPreview } from './TreasuryPreview';
import { HandbookButton } from './HandbookButton';

interface StartScreenProps {
  onStart: (
    aiEnabled: boolean,
    customMoney: number,
    startingSeason?: SeasonType,
    startingWeather?: WeatherType,
    startingTime?: number
  ) => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  // 1. Core State Lifted to parent index
  const [selectedMode, setSelectedMode] = useState<GameMode>('ai_mayor');
  const [startingMoney, setStartingMoney] = useState<number>(1500); // Default Eco ($1000 base + $500 bonus)
  const [selectedPreset, setSelectedPreset] = useState<string>('spring_sunrise');
  const [selectedMayor, setSelectedMayor] = useState<string>('eco');
  const [selectedMapStyle, setSelectedMapStyle] = useState<string>('meandering');
  const [isMusicEnabled, setIsMusicEnabled] = useState<boolean>(true);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState<boolean>(false);

  // 2. Constants & Configuration presets
  const climatePresets: ClimatePreset[] = useMemo(() => [
    {
      id: 'spring_sunrise',
      name: 'Spring Sunrise',
      description: 'Cool crisp spring morning with cherry blossoms',
      icon: '🌸',
      season: 'spring',
      weather: 'clear',
      time: 7.5
    },
    {
      id: 'summer_noon',
      name: 'Summer Noon',
      description: 'Lush golden afternoon sun with bright skies',
      icon: '🌻',
      season: 'summer',
      weather: 'clear',
      time: 12.0
    },
    {
      id: 'autumn_twilight',
      name: 'Autumn Rain',
      description: 'Moody orange canopy with dynamic drizzles',
      icon: '🍁',
      season: 'autumn',
      weather: 'rain',
      time: 17.5
    },
    {
      id: 'winter_frost',
      name: 'Winter Blizzard',
      description: 'Dense powdery snow covered hills under fog',
      icon: '❄️',
      season: 'winter',
      weather: 'snow',
      time: 10.0
    }
  ], []);

  const mayorSpecialties: MayorSpecialty[] = useMemo(() => [
    {
      id: 'eco',
      badge: '🌲 Climate Reformer',
      name: 'Eco Adviser',
      perkTitle: 'Sub-Tropical Greening Permit',
      perkDesc: 'Parks and carbon offset reserves yield +15% happiness approval multiplier.',
      icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
      bonusCash: 500,
      highlightClass: 'border-emerald-500 shadow-emerald-950/30'
    },
    {
      id: 'tech',
      badge: '⚡ Smart Infrastructure',
      name: 'Dr. Cybernetica',
      perkTitle: 'Grid Node Pre-allocation',
      perkDesc: 'Reduces electric distribution blackout risks and expands road connectivity efficiency.',
      icon: <Wrench className="w-4 h-4 text-indigo-405" />,
      bonusCash: 1500,
      highlightClass: 'border-indigo-500 shadow-indigo-950/30'
    },
    {
      id: 'tycoon',
      badge: '💼 Industrial Magnate',
      name: 'Chairman Sterling',
      perkTitle: 'Consolidated Treasury Grant',
      perkDesc: 'Receive +$5,000 immediate surplus, but initial atmospheric pollution metrics increase slightly.',
      icon: <Coins className="w-4 h-4 text-amber-500" />,
      bonusCash: 5000,
      highlightClass: 'border-amber-500 shadow-amber-950/30'
    },
    {
      id: 'scholar',
      badge: '📚 Academic Planner',
      name: 'Provost Vanesse',
      perkTitle: 'Intelligent Civic Syllabus',
      perkDesc: 'Commercial and educational zones qualify for faster double tax yields under proper grid placement.',
      icon: <Library className="w-4 h-4 text-cyan-400" />,
      bonusCash: 2000,
      highlightClass: 'border-cyan-500 shadow-cyan-950/30'
    }
  ], []);

  const mapArchetypes: MapArchetype[] = useMemo(() => [
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
  ], []);

  // 3. Memoized event handlers
  const handleToggleMusic = useCallback(() => {
    setIsMusicEnabled((prev) => !prev);
  }, []);

  const handleToggleAdvanced = useCallback(() => {
    setIsAdvancedOpen((prev) => !prev);
  }, []);

  const handleModeChange = useCallback((mode: GameMode) => {
    setSelectedMode(mode);
    if (mode === 'ai_mayor') {
      const activeMayorProfile = mayorSpecialties.find(m => m.id === selectedMayor);
      const bonus = activeMayorProfile ? activeMayorProfile.bonusCash : 500;
      setStartingMoney(1000 + bonus);
    } else {
      setStartingMoney(50000);
    }
  }, [selectedMayor, mayorSpecialties]);

  const handleMayorSelect = useCallback((id: string) => {
    setSelectedMayor(id);
    if (selectedMode === 'ai_mayor') {
      const profile = mayorSpecialties.find(m => m.id === id);
      const bonus = profile ? profile.bonusCash : 500;
      setStartingMoney(1000 + bonus);
    }
  }, [selectedMode, mayorSpecialties]);

  const handleMapStyleSelect = useCallback((id: string) => {
    setSelectedMapStyle(id);
  }, []);

  const handlePresetSelect = useCallback((id: string) => {
    setSelectedPreset(id);
  }, []);

  const handlePlayGame = useCallback(() => {
    const preset = climatePresets.find(p => p.id === selectedPreset) || climatePresets[0];
    onStart(
      selectedMode === 'ai_mayor',
      startingMoney,
      preset.season,
      preset.weather,
      preset.time
    );
  }, [onStart, selectedMode, startingMoney, selectedPreset, climatePresets]);

  // Derived calculations
  const currentSpecialtyBonus = useMemo(() => {
    const profile = mayorSpecialties.find(m => m.id === selectedMayor);
    return profile ? profile.bonusCash : 0;
  }, [selectedMayor, mayorSpecialties]);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-50 text-white font-sans p-4 md:p-6 bg-slate-950 overflow-y-auto no-scrollbar pointer-events-auto" id="start-screen-viewport">
      
      {/* Decorative Blueprint Background Grid with scrolling telemetry effect */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-35 pointer-events-none"></div>
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.5)] animate-shimmer pointer-events-none animate-pulse"></div>

      {/* Main card panel */}
      <div className="max-w-4xl w-full bg-slate-900/90 backdrop-blur-md p-5 md:p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-y-auto no-scrollbar max-h-[96vh] flex flex-col gap-6 my-auto animate-in fade-in duration-500 relative z-10" id="start-screen-card">
        
        {/* Core Hero Branding Grid */}
        <Hero 
          isMusicEnabled={isMusicEnabled} 
          onToggleMusic={handleToggleMusic} 
          onPlay={handlePlayGame} 
        />

        {/* Divided Column Configurator Fields */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 overflow-y-auto no-scrollbar pr-0.5">
          {/* Left panel options: Modes & Core settings */}
          <div className="md:col-span-7 space-y-4">
            <ModeSelector 
              selectedMode={selectedMode} 
              onModeChange={handleModeChange} 
            />
          </div>

          {/* Right panel options: starting ledger & metrics */}
          <div className="md:col-span-5 space-y-4">
            <TreasuryPreview 
              startingMoney={startingMoney} 
              isAiModeActive={selectedMode === 'ai_mayor'} 
              specialtyBonus={currentSpecialtyBonus} 
            />
          </div>
        </div>

        {/* Advanced Drawer Collapsible Panels */}
        <AdvancedSetup 
          isOpen={isAdvancedOpen}
          onToggleOpen={handleToggleAdvanced}
          mayorSpecialties={mayorSpecialties}
          selectedMayor={selectedMayor}
          onMayorSelect={handleMayorSelect}
          isAiModeActive={selectedMode === 'ai_mayor'}
          mapArchetypes={mapArchetypes}
          selectedMapStyle={selectedMapStyle}
          onMapStyleSelect={handleMapStyleSelect}
          climatePresets={climatePresets}
          selectedPreset={selectedPreset}
          onPresetSelect={handlePresetSelect}
        />

        {/* Handbook Controller Portal */}
        <HandbookButton />
      </div>
    </div>
  );
};

export default StartScreen;
