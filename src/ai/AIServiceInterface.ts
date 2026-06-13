/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AIGoal, CityStats, NewsItem } from '../../types';

export interface AIService {
  generateGoal(stats: CityStats, grid: any[][]): Promise<AIGoal | null>;
  generateNews(stats: CityStats, recentAction: string | null): Promise<NewsItem | null>;
}

/**
 * A robust emulated AI service that can generate creative contextual objectives
 * and news feed alerts. This serves as an immediate backup/fallback to ensure excellent user experience.
 */
export class ProceduralAIService implements AIService {
  private fallbackGoals: Omit<AIGoal, 'completed'>[] = [
    {
      description: "Our citizens are complaining about lack of green spaces. Build at least 3 parks to boost morale.",
      targetType: "building_count",
      targetValue: 3,
      buildingType: "Park" as any,
      reward: 150
    },
    {
      description: "Our industry is ready for expansion. Build 5 robust factories to supply the growing metropolis.",
      targetType: "building_count",
      targetValue: 5,
      buildingType: "Industrial" as any,
      reward: 350
    },
    {
      description: "Local shopkeepers demand more foot traffic. Expand commercial zoning by building 3 new shops.",
      targetType: "building_count",
      targetValue: 3,
      buildingType: "Commercial" as any,
      reward: 200
    },
    {
      description: "The treasury needs a cushion. Accumulate $3,000 cash for future capital projects.",
      targetType: "money",
      targetValue: 3000,
      reward: 500
    },
    {
      description: "The SkyMetropolis is attracting newcomers! Grow our population to 150 citizens.",
      targetType: "population",
      targetValue: 150,
      reward: 400
    }
  ];

  private fallbackNewsCount = 0;
  private fallbackNews: { text: string; type: 'positive' | 'negative' | 'neutral' }[] = [
    { text: "Local park declared 'prettiest in the sky' by visiting sky-sailors.", type: 'positive' },
    { text: "A fresh batch of prospective residents has arrived at the docking gates.", type: 'positive' },
    { text: "Industrial sectors reporting 98% fuel combustion efficiency. Clean clouds ahead!", type: 'positive' },
    { text: "Shopkeepers claim sky-tolls are impacting trade profits.", type: 'negative' },
    { text: "Minor power fluctuation reported. Citizens advised to keep toaster-usage to a minimum.", type: 'negative' },
    { text: "A sudden wind-storm tests island anchoring cables. All secure.", type: 'neutral' },
    { text: "SkyMetropolis Daily crossword puzzle champion crowned.", type: 'neutral' },
    { text: "Mysterious flock of purple clouds hovers over residential sectors.", type: 'neutral' }
  ];

  public async generateGoal(stats: CityStats, grid: any[][]): Promise<AIGoal | null> {
    // Return a random goal, prioritizing those not already achieved
    const idx = Math.floor(Math.random() * this.fallbackGoals.length);
    const goal = this.fallbackGoals[idx];
    return { ...goal, completed: false };
  }

  public async generateNews(stats: CityStats, recentAction: string | null): Promise<NewsItem | null> {
    const list = [...this.fallbackNews];
    if (recentAction) {
      list.push({ text: `Residents react enthusiastically to recent: "${recentAction}".`, type: 'positive' });
    }
    const item = list[Math.floor(Math.random() * list.length)];
    return {
      id: `${Date.now()}_proc_${this.fallbackNewsCount++}`,
      text: item.text,
      type: item.type
    };
  }
}
