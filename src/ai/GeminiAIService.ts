/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AIGoal, CityStats, NewsItem } from '../../types';
import { AIService, ProceduralAIService } from './AIServiceInterface';

export class GeminiAIService implements AIService {
  private backupService = new ProceduralAIService();

  public async generateGoal(stats: CityStats, grid: any[][]): Promise<AIGoal | null> {
    try {
      // Proxy request to the server-side API to keep the key hidden
      const response = await fetch('/api/gemini/goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stats, grid })
      });

      if (response.ok) {
        const goalData = await response.json();
        if (goalData && goalData.description) {
          return { ...goalData, completed: false };
        }
      }
    } catch (e) {
      console.warn("Gemini Server Proxy failed to reach or returned error. Falling back to procedural backup.", e);
    }
    return this.backupService.generateGoal(stats, grid);
  }

  public async generateNews(stats: CityStats, recentAction: string | null): Promise<NewsItem | null> {
    try {
      const response = await fetch('/api/gemini/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stats, recentAction })
      });

      if (response.ok) {
        const newsData = await response.json();
        if (newsData && newsData.text) {
          return newsData;
        }
      }
    } catch (e) {
      console.warn("Gemini News Proxy failed. Falling back to procedural news helper.", e);
    }
    return this.backupService.generateNews(stats, recentAction);
  }
}
