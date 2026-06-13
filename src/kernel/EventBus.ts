/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GameEvents {
  'tick': { tickCount: number; delta: number };
  'money_changed': { newAmount: number; delta: number };
  'population_changed': { newPopulation: number; delta: number };
  'building_placed': { x: number; y: number; type: string };
  'building_demolished': { x: number; y: number };
  'goal_generated': { description: string; targetType: string; targetValue: number; reward: number };
  'goal_completed': { reward: number };
  'news_triggered': { id: string; text: string; type: 'positive' | 'negative' | 'neutral' };
  'policy_changed': { policyId: string; enabled: boolean };
  'command_executed': { commandId: string; type: string; params: any };
  'grid_updated': { grid: any[][] };
  'state_sync': { snapshot: any };
}

export type EventCallback<T> = (data: T) => void;

export class EventBus {
  private listeners: Record<string, EventCallback<any>[]> = {};

  public on<K extends keyof GameEvents>(event: K, callback: EventCallback<GameEvents[K]>): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return () => this.off(event, callback);
  }

  public off<K extends keyof GameEvents>(event: K, callback: EventCallback<GameEvents[K]>): void {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  public emit<K extends keyof GameEvents>(event: K, data: GameEvents[K]): void {
    const list = this.listeners[event];
    if (list) {
      list.forEach(cb => {
        try {
          cb(data);
        } catch (e) {
          console.error(`Error in event listener for custom event "${event}":`, e);
        }
      });
    }
  }

  public clear(): void {
    this.listeners = {};
  }
}
