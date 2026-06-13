/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SystemProfile {
  name: string;
  durationMs: number;
  tickCount: number;
}

/**
 * Continuous performance tracking subsystem. Captures tick costs,
 * system bottlenecks, network/heap diagnostics, and core count statistics.
 */
export class TelemetryService {
  private executionTimes: Record<string, number[]> = {};
  private currentTickTimes: Record<string, number> = {};
  private activeEntityCount: number = 0;
  private pathfindingRequests: number = 0;
  private pathfindingCacheHits: number = 0;
  private maxHistory: number = 50;

  /**
   * Starts tracking execution duration for a registered sub-engine.
   */
  public startProfile(systemName: string): void {
    this.currentTickTimes[systemName] = performance.now();
  }

  /**
   * Concludes duration tracking and commits output to profiling buffer.
   */
  public endProfile(systemName: string): void {
    const start = this.currentTickTimes[systemName];
    if (start === undefined) return;
    const durationCount = performance.now() - start;

    if (!this.executionTimes[systemName]) {
      this.executionTimes[systemName] = [];
    }
    const history = this.executionTimes[systemName];
    history.push(durationCount);
    if (history.length > this.maxHistory) {
      history.shift();
    }
    delete this.currentTickTimes[systemName];
  }

  /**
   * Updates global counts.
   */
  public setEntityCount(count: number): void {
    this.activeEntityCount = count;
  }

  /**
   * Increments pathfinding routing parameters.
   */
  public recordPathfind(isCacheHit: boolean = false): void {
    this.pathfindingRequests++;
    if (isCacheHit) {
      this.pathfindingCacheHits++;
    }
  }

  /**
   * Retrieves averaged performance metrics per system.
   */
  public getAverageDurations(): Record<string, number> {
    const records: Record<string, number> = {};
    for (const [name, times] of Object.entries(this.executionTimes)) {
      if (times.length === 0) continue;
      const sum = times.reduce((acc, t) => acc + t, 0);
      records[name] = parseFloat((sum / times.length).toFixed(3));
    }
    return records;
  }

  /**
   * Assembles an overview of the full system's physical heap state.
   */
  public getDiagnosticReport(): {
    heapSizeAllocatedMb: number;
    activeEntityCount: number;
    pathfindingRequests: number;
    pathfindingCacheRatio: number;
    averages: Record<string, number>;
  } {
    // Graceful estimation when performance.memory is not natively supported by JS environment
    const memory = (performance as any).memory;
    const heap = memory ? memory.usedJSHeapSize / (1024 * 1024) : 0;
    const hitRatio = this.pathfindingRequests > 0 
      ? parseFloat((this.pathfindingCacheHits / this.pathfindingRequests).toFixed(2))
      : 1.0;

    return {
      heapSizeAllocatedMb: parseFloat(heap.toFixed(2)),
      activeEntityCount: this.activeEntityCount,
      pathfindingRequests: this.pathfindingRequests,
      pathfindingCacheRatio: hitRatio,
      averages: this.getAverageDurations()
    };
  }

  /**
   * Resets counts.
   */
  public clear(): void {
    this.executionTimes = {};
    this.currentTickTimes = {};
    this.activeEntityCount = 0;
    this.pathfindingRequests = 0;
    this.pathfindingCacheHits = 0;
  }
}
