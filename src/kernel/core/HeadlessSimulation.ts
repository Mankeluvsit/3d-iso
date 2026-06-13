/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameTimeService } from './GameTimeService';
import { ResourceRegistry } from './ResourceRegistry';
import { SimulationScheduler } from './SimulationScheduler';

export interface AuditReport {
  totalTicks: number;
  finalBalances: Record<string, number>;
  isEconomyStable: boolean;
  growthDelta: number;
  averageTickDurationMs: number;
}

/**
 * Headless simulation runner. Allows executing thousands of simulation loops
 * instantly with no rendering inside UI threads. Perfect for balancing checks,
 * batch validations, regression tests, and AI training.
 */
export class HeadlessSimulationEngine {
  constructor(
    private clock: GameTimeService,
    private resources: ResourceRegistry,
    private scheduler: SimulationScheduler
  ) {}

  /**
   * Triggers a highly optimized run for N loops.
   * Asserts statistics transitions and performance averages.
   */
  public runTicks(tickCount: number): AuditReport {
    const startPerf = performance.now();
    const initialPopulation = this.resources.get('population');
    
    // De-couple update interval constraints for maximum speed
    const prevSpeed = this.clock.getSpeed();
    this.clock.setSpeed('HYPER');

    for (let t = 0; t < tickCount; t++) {
      this.clock.tick();
      this.scheduler.tick(this.clock.getTicks(), 1);
    }

    // Restore old speed factor
    this.clock.setSpeed(prevSpeed);

    const endPerf = performance.now();
    const durationTotal = endPerf - startPerf;

    const finalPopulation = this.resources.get('population');
    const finalMoney = this.resources.get('money');

    // Economical sanity checker rules
    const isStable = finalMoney > -50000;

    return {
      totalTicks: tickCount,
      finalBalances: this.resources.getBalances(),
      isEconomyStable: isStable,
      growthDelta: finalPopulation - initialPopulation,
      averageTickDurationMs: durationTotal / tickCount
    };
  }
}
