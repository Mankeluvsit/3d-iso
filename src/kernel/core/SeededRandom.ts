/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Deterministic PRNG service using the Mulberry32 algorithm.
 * Guarantees identical simulation sequencing across runs on any engine.
 */
export class SeededRandomService {
  private initialSeed: number;
  private state: number;

  constructor(seed: number = 42) {
    this.initialSeed = seed;
    this.state = seed;
  }

  /**
   * Sets the state of the generator using a seed number.
   * @param seed - Numeric seed value
   */
  public reseed(seed: number): void {
    this.initialSeed = seed;
    this.state = seed;
  }

  /**
   * Generates a deterministic float between 0 (inclusive) and 1 (exclusive).
   * @returns Deterministic pseudo-random number
   */
  public next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Generates a deterministic float in a custom range.
   * @param min - Minimum bound (inclusive)
   * @param max - Maximum bound (exclusive)
   * @returns Randomized float value
   */
  public range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /**
   * Generates a deterministic integer in a custom range.
   * @param min - Minimum bound (inclusive)
   * @param max - Maximum bound (inclusive)
   * @returns Randomized integer value
   */
  public intRange(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  /**
   * Deterministically shuffles an array in place.
   * @param array - Array to be shuffled
   * @returns Shuffled array reference
   */
  public shuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = this.intRange(0, i);
      const temp = arr[i];
      arr[i] = arr[j];
      arr[j] = temp;
    }
    return arr;
  }

  /**
   * Pick a deterministic element from an array.
   */
  public choice<T>(array: T[]): T {
    if (array.length === 0) {
      throw new Error("Cannot select from an empty array");
    }
    return array[this.intRange(0, array.length - 1)];
  }

  /**
   * Captures current state for snapshotting.
   */
  public getState(): { initialSeed: number; state: number } {
    return {
      initialSeed: this.initialSeed,
      state: this.state,
    };
  }

  /**
   * Restores random generation sequence state.
   */
  public restoreState(state: { initialSeed: number; state: number }): void {
    this.initialSeed = state.initialSeed;
    this.state = state.state;
  }
}
