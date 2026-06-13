/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TelemetryService } from './Telemetry';

export interface ISimulationSystem {
  getName(): string;
  update(delta: number, tickIndex: number): void;
}

export interface SystemRegistryEntry {
  system: ISimulationSystem;
  priority: number;         // Execution order priority (lowest first)
  tickInterval: number;     // Execute every N ticks (1 = every tick, 5 = every 5th tick)
  enabled: boolean;         // Enable or disable system at runtime
}

/**
 * Centrally manages registration, update scheduling, runtime performance throttling,
 * and timing profiles for all core simulation sub-engines.
 */
export class SimulationScheduler {
  private registry = new Map<string, SystemRegistryEntry>();

  constructor(private telemetry: TelemetryService) {}

  /**
   * Enrolls a custom processing model.
   * @param system - Instance conforming to ISimulationSystem
   * @param priority - Execution precedence order coefficient (lower runs first)
   * @param tickInterval - Frequency of updates
   */
  public register(system: ISimulationSystem, priority: number = 100, tickInterval: number = 1): void {
    this.registry.set(system.getName(), {
      system,
      priority,
      tickInterval,
      enabled: true
    });
  }

  /**
   * Sets individual active running status.
   */
  public setSystemEnabled(name: string, enabled: boolean): void {
    const entry = this.registry.get(name);
    if (entry) {
      entry.enabled = enabled;
    }
  }

  /**
   * Direct trigger of one evaluation loop with ordering priorities.
   */
  public tick(tickCount: number, delta: number = 1): void {
    // Collect active systems sorted by execution priority
    const entries = Array.from(this.registry.values())
      .filter(entry => entry.enabled && (tickCount % entry.tickInterval === 0))
      .sort((a, b) => a.priority - b.priority);

    for (const entry of entries) {
      const name = entry.system.getName();
      
      this.telemetry.startProfile(name);
      try {
        entry.system.update(delta, tickCount);
      } catch (e) {
        console.error(`SimulationScheduler error executing system "${name}":`, e);
      } finally {
        this.telemetry.endProfile(name);
      }
    }
  }

  /**
   * Empties queue for cleanup.
   */
  public clear(): void {
    this.registry.clear();
  }

  /**
   * Inspects current scheduler structures.
   */
  public getScheduleOverview(): Array<{ name: string; priority: number; interval: number; enabled: boolean }> {
    return Array.from(this.registry.entries()).map(([name, val]) => ({
      name,
      priority: val.priority,
      interval: val.tickInterval,
      enabled: val.enabled
    }));
  }
}
