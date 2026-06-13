/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DomainEvent {
  id: string;
  type: 'population_milestone' | 'tax_change' | 'disaster' | 'infrastructure_placed' | 'policy_toggled' | 'economic_shift' | 'system';
  msg: string;
  tickIndex: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

/**
 * Centrally records city timeline events. This immutable log stores
 * critical occurrences (milestones, policy updates, structural changes)
 * in sequence, consumable by statistics, HUD components, and saving pipelines.
 */
export class DomainEventHistorySystem {
  private log: DomainEvent[] = [];
  private maxHistorySize: number = 200;

  /**
   * Commits a new structural event to the timeline ledger.
   */
  public logEvent(
    type: DomainEvent['type'],
    msg: string,
    tickIndex: number,
    metadata?: Record<string, any>
  ): void {
    const event: DomainEvent = {
      id: `devt_${tickIndex}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      type,
      msg,
      tickIndex,
      timestamp: new Date().toISOString(),
      metadata
    };

    this.log.push(event);

    if (this.log.length > this.maxHistorySize) {
      this.log.shift();
    }
  }

  /**
   * Safe fetch of all documented events.
   */
  public getHistory(): DomainEvent[] {
    return [...this.log];
  }

  /**
   * Queries history filtered by distinct categories.
   */
  public queryByType(type: DomainEvent['type']): DomainEvent[] {
    return this.log.filter(evt => evt.type === type);
  }

  /**
   * Resets active ledger history.
   */
  public clear(): void {
    this.log = [];
  }

  /**
   * Snapshots full history stream.
   */
  public serialize(): string {
    return JSON.stringify(this.log);
  }

  /**
   * Restores timeline logs.
   */
  public deserialize(serialized: string): void {
    try {
      const parsed = JSON.parse(serialized);
      if (Array.isArray(parsed)) {
        this.log = parsed;
      }
    } catch (e) {
      console.error('Failed to parse domain event history stream:', e);
    }
  }
}
