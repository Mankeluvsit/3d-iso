/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventBus } from '../../kernel/EventBus';

export interface EventEngineState {
  recentEventName: string | null;
  daysSinceLastDisaster: number;
}

export class EventEngine {
  private recentEventName: string | null = null;
  private daysSinceLastDisaster = 0;

  private randomEvents = [
    {
      text: "Solar Flare generates pristine aurora over SkyMetropolis. Solar battery outputs surge +50%!",
      type: "positive" as const
    },
    {
      text: "Sky-sailor merchant fleet docks! Island trade volume boosts economy revenues.",
      type: "positive" as const
    },
    {
      text: "An unforeseen air-current draft rattles core balancing gyros. Citizens holding onto carpets!",
      type: "negative" as const
    },
    {
      text: "Dust-cloud storm obscures the solar collection array. Power efficiency dips slightly.",
      type: "negative" as const
    },
    {
      text: "Local bakers bake island-wide giant flying soufflé. Residents eat free!",
      type: "positive" as const
    }
  ];

  constructor(private eventBus: EventBus) {}

  public getState(): EventEngineState {
    return {
      recentEventName: this.recentEventName,
      daysSinceLastDisaster: this.daysSinceLastDisaster
    };
  }

  public update(delta: number): void {
    this.daysSinceLastDisaster++;

    // 5% chance of spawning custom events on random ticks
    if (Math.random() < 0.05) {
      const selected = this.randomEvents[Math.floor(Math.random() * this.randomEvents.length)];
      this.recentEventName = selected.text;
      
      if (selected.type === "negative") {
        this.daysSinceLastDisaster = 0; // reset
      }

      this.eventBus.emit('news_triggered', {
        id: (Date.now() + Math.random()).toString(),
        text: selected.text,
        type: selected.type
      });
    }
  }
}
