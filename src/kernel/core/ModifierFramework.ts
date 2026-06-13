/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ModifierType = 'ADD' | 'MULTIPLY' | 'PERCENT';

export interface Modifier {
  id: string;
  sourceId: string;         // e.g., "policy_clean_energy", "event_solar"
  targetKey: string;        // e.g., "industrialIncome", "populationGrowth", "happiness"
  type: ModifierType;
  value: number;            // offset scalar (e.g., +10, 0.85, 0.40)
  durationTicks?: number;   // if timed, remaining ticks before decay
  priority: number;         // precedence (lower first or ordered processing)
}

/**
 * Universal numerical modification framework. Handles stackable additives,
 * percentage scales, timed modifiers, and priority layers dynamic arithmetic.
 */
export class ModifierFramework {
  private modifiers: Modifier[] = [];

  /**
   * Adds a modifier to the system pipeline.
   */
  public addModifier(mod: Modifier): void {
    // Avoid double stacking of unique identifier mods
    this.removeModifier(mod.id);
    this.modifiers.push(mod);
    // Sort by priority so math is done in order (ADD, then MULTIPLY/PERCENT)
    this.modifiers.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Removes modifiers based on primary identifier keys.
   */
  public removeModifier(id: string): void {
    this.modifiers = this.modifiers.filter(m => m.id !== id);
  }

  /**
   * Removes all modifiers linked to a specific source block (e.g., policy, event).
   */
  public removeBySource(sourceId: string): void {
    this.modifiers = this.modifiers.filter(m => m.sourceId !== sourceId);
  }

  /**
   * Ticks down timed/temporary modifiers, purging them on expiry.
   */
  public update(deltaTicks: number = 1): void {
    this.modifiers.forEach(mod => {
      if (mod.durationTicks !== undefined) {
        mod.durationTicks -= deltaTicks;
      }
    });

    // Remove expired modifiers
    this.modifiers = this.modifiers.filter(mod => mod.durationTicks === undefined || mod.durationTicks > 0);
  }

  /**
   * Aggregates modifiers of a given key and computes final value based on a base.
   * Modifiers run in sequence:
   * 1. Sum up all addition modifiers
   * 2. Sum up percent modifiers
   * 3. Apply multipliers sequentially
   * @param targetKey - Key of value to modify (e.g. "industrialIncome")
   * @param baseValue - Core un-modified amount
   */
  public modify(targetKey: string, baseValue: number): number {
    const active = this.modifiers.filter(m => m.targetKey === targetKey);
    if (active.length === 0) return baseValue;

    let result = baseValue;

    // 1. Process ADD
    const additions = active.filter(m => m.type === 'ADD');
    for (const mod of additions) {
      result += mod.value;
    }

    // 2. Process PERCENT (adds percentage modifier e.g. +10% is 0.10)
    const percents = active.filter(m => m.type === 'PERCENT');
    if (percents.length > 0) {
      const sumPercent = percents.reduce((sum, m) => sum + m.value, 0);
      result *= (1 + sumPercent);
    }

    // 3. Process MULTIPLY sequentially
    const multipliers = active.filter(m => m.type === 'MULTIPLY');
    for (const mod of multipliers) {
      result *= mod.value;
    }

    return result;
  }

  /**
   * Clears all active modifiers in system.
   */
  public clear(): void {
    this.modifiers = [];
  }

  /**
   * Retrieves active modifier list configuration.
   */
  public getActiveModifiers(): Modifier[] {
    return this.modifiers.map(m => ({ ...m }));
  }
}
