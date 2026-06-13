/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Centrally defines active simulation logic toggles (disasters, traffic simulations, AI generation, etc.)
 * supporting safe hot-swapping and testing of components without compilation breaks.
 */
export class FeatureFlagService {
  private flags = new Map<string, boolean>();

  constructor() {
    this.registerDefaults();
  }

  private registerDefaults(): void {
    const defaults: Record<string, boolean> = {
      'simulation_disasters': false,
      'advanced_traffic_pathing': true,
      'ai_goal_generation': true,
      'economy_taxes': true,
      'debug_profiler_hud': true,
      'resource_caps_clamping': true,
      'mod_system_hooks': true,
    };

    for (const [key, value] of Object.entries(defaults)) {
      this.flags.set(key, value);
    }
  }

  /**
   * Asserts whether a feature key is enabled.
   */
  public isEnabled(flagKey: string): boolean {
    return this.flags.get(flagKey) ?? false;
  }

  /**
   * Fine-tunes active feature flag configurations on the fly.
   */
  public setFlag(flagKey: string, value: boolean): void {
    this.flags.set(flagKey, value);
  }

  /**
   * Retrieves full mapping matrix representation.
   */
  public getAllFlags(): Record<string, boolean> {
    const records: Record<string, boolean> = {};
    for (const [key, val] of this.flags.entries()) {
      records[key] = val;
    }
    return records;
  }
}
