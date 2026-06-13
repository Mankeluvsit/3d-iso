/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SimulationSpeed = 'PAUSED' | 'NORMAL' | 'FAST' | 'HYPER' | 'CHRONO';

/**
 * Centrally authoritative simulation clock supporting pause, resume,
 * multiple playback speed factors, deterministic tick calculations,
 * and standard calendar date representations.
 */
export class GameTimeService {
  private currentTick: number = 0;
  private isTickPaused: boolean = false;
  private speed: SimulationSpeed = 'NORMAL';

  // Conversion rates (e.g. 5 ticks = 1 in-game day)
  private ticksPerDay: number = 5;
  private daysPerMonth: number = 30;

  constructor(ticksPerDay: number = 5) {
    this.ticksPerDay = ticksPerDay;
  }

  /**
   * Returns current monotonic tick count.
   */
  public getTicks(): number {
    return this.currentTick;
  }

  /**
   * Resets active clock to inception.
   */
  public reset(): void {
    this.currentTick = 0;
    this.speed = 'NORMAL';
    this.isTickPaused = false;
  }

  /**
   * Pauses the progression.
   */
  public pause(): void {
    this.isTickPaused = true;
  }

  /**
   * Resumes the clock state.
   */
  public resume(): void {
    this.isTickPaused = false;
  }

  /**
   * Checks if time is currently standing still.
   */
  public isPaused(): boolean {
    return this.isTickPaused || this.speed === 'PAUSED';
  }

  /**
   * Updates standard simulation speed presets.
   */
  public setSpeed(speed: SimulationSpeed): void {
    this.speed = speed;
    if (speed === 'PAUSED') {
      this.isTickPaused = true;
    } else {
      this.isTickPaused = false;
    }
  }

  /**
   * Returns current active speed multiplier value.
   */
  public getSpeed(): SimulationSpeed {
    return this.speed;
  }

  /**
   * Converts speed preset to tick interval delay milliseconds.
   */
  public getIntervalMs(): number {
    switch (this.speed) {
      case 'PAUSED': return 10000000;
      case 'NORMAL': return 2000; // 2 sec tick
      case 'FAST': return 1000;   // 1 sec tick
      case 'HYPER': return 400;   // 0.4 sec tick
      case 'CHRONO': return 100;  // 0.1 sec tick (for testing/replay speeds)
      default: return 2000;
    }
  }

  /**
   * Monotonically increments elapsed simulation ticks.
   */
  public tick(): boolean {
    if (this.isPaused()) {
      return false;
    }
    this.currentTick++;
    return true;
  }

  /**
   * Decodes calendar state based on total ticks.
   */
  public getCalendarDate(): { day: number; month: number; year: number } {
    const totalDays = Math.floor(this.currentTick / this.ticksPerDay) + 1;
    const year = Math.floor((totalDays - 1) / (this.daysPerMonth * 12)) + 1;
    const remainingDaysInYear = (totalDays - 1) % (this.daysPerMonth * 12);
    const month = Math.floor(remainingDaysInYear / this.daysPerMonth) + 1;
    const day = (remainingDaysInYear % this.daysPerMonth) + 1;

    return { day, month, year };
  }

  /**
   * Captures time stamp metadata for files and logs.
   */
  public getFormattedTime(): string {
    const { day, month, year } = this.getCalendarDate();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `Y${year}-M${pad(month)}-D${pad(day)} (Tick ${this.currentTick})`;
  }

  /**
   * Captures snapshot configuration.
   */
  public getState(): { currentTick: number; speed: SimulationSpeed; isTickPaused: boolean } {
    return {
      currentTick: this.currentTick,
      speed: this.speed,
      isTickPaused: this.isTickPaused
    };
  }

  /**
   * Deserializes clock parameters.
   */
  public restoreState(state: { currentTick: number; speed: SimulationSpeed; isTickPaused: boolean }): void {
    this.currentTick = state.currentTick || 0;
    this.speed = state.speed || 'NORMAL';
    this.isTickPaused = !!state.isTickPaused;
  }
}
