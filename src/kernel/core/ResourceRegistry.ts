/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ResourceDefinition {
  id: string;
  name: string;
  category: 'treasury' | 'utility' | 'social' | 'environmental' | 'urban';
  baseValue: number;
  minVal?: number;
  maxVal?: number;
}

/**
 * Data-driven resource database and ledger. Restructures resource models (power, sewage, pollution,
 * crime) into registerable properties instead of rigid, hardcoded class fields.
 */
export class ResourceRegistry {
  private definitions = new Map<string, ResourceDefinition>();
  private balances = new Map<string, number>();

  constructor() {
    this.registerDefaults();
  }

  /**
   * Registers a new custom gameplay resource to the simulation engine.
   */
  public register(def: ResourceDefinition): void {
    this.definitions.set(def.id, def);
    if (!this.balances.has(def.id)) {
      this.balances.set(def.id, def.baseValue);
    }
  }

  private registerDefaults(): void {
    const defaults: ResourceDefinition[] = [
      { id: 'money', name: 'Treasury Cash', category: 'treasury', baseValue: 1000, minVal: -100000 },
      { id: 'population', name: 'Citizens', category: 'social', baseValue: 0, minVal: 0 },
      { id: 'happiness', name: 'Public Happiness', category: 'social', baseValue: 75, minVal: 0, maxVal: 100 },
      { id: 'pollution', name: 'Industrial Smog', category: 'environmental', baseValue: 0, minVal: 0, maxVal: 100 },
      { id: 'crime', name: 'Street Crime', category: 'urban', baseValue: 10, minVal: 0, maxVal: 100 },
      { id: 'power', name: 'Electrical Power', category: 'utility', baseValue: 0, minVal: 0 },
      { id: 'water', name: 'Pressurized Water', category: 'utility', baseValue: 0, minVal: 0 },
      { id: 'sewage', name: 'Sewage Drainage', category: 'utility', baseValue: 0, minVal: 0 },
      { id: 'internet', name: 'Fiber Broadband', category: 'utility', baseValue: 0, minVal: 0 },
    ];
    defaults.forEach(d => this.register(d));
  }

  /**
   * Gets the ledger scalar balancing total.
   */
  public get(resourceId: string): number {
    return this.balances.get(resourceId) ?? 0;
  }

  /**
   * Safe set of a ledger metric, enforcing bounds.
   */
  public set(resourceId: string, value: number): number {
    const def = this.definitions.get(resourceId);
    let clamped = value;
    if (def) {
      if (def.minVal !== undefined) clamped = Math.max(def.minVal, clamped);
      if (def.maxVal !== undefined) clamped = Math.min(def.maxVal, clamped);
    }
    this.balances.set(resourceId, clamped);
    return clamped;
  }

  /**
   * Offsets value by difference.
   */
  public adjust(resourceId: string, delta: number): number {
    const current = this.get(resourceId);
    return this.set(resourceId, current + delta);
  }

  /**
   * Exposes raw state records.
   */
  public getBalances(): Record<string, number> {
    const balances: Record<string, number> = {};
    for (const [id, value] of this.balances.entries()) {
      balances[id] = value;
    }
    return balances;
  }

  /**
   * Resets all metrics back to default definitions.
   */
  public reset(): void {
    this.balances.clear();
    for (const [id, def] of this.definitions.entries()) {
      this.balances.set(id, def.baseValue);
    }
  }

  /**
   * Lists all definitions inside engine registry.
   */
  public getDefinitions(): ResourceDefinition[] {
    return Array.from(this.definitions.values());
  }
}
