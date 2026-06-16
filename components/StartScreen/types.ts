/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export type GameMode = 'ai_mayor' | 'sandbox';
export type SeasonType = 'spring' | 'summer' | 'autumn' | 'winter';
export type WeatherType = 'clear' | 'overcast' | 'rain' | 'thunderstorm' | 'snow';

export interface ClimatePreset {
  id: string;
  name: string;
  description: string;
  icon: string | React.ReactNode;
  season: SeasonType;
  weather: WeatherType;
  time: number;
}

export interface MayorSpecialty {
  id: string;
  badge: string;
  name: string;
  perkTitle: string;
  perkDesc: string;
  icon: React.ReactNode;
  bonusCash: number;
  highlightClass: string;
}

export interface MapArchetype {
  id: string;
  name: string;
  description: string;
  badge: string;
}
