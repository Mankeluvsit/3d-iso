/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ReplayCommand {
  tick: number;
  type: string;
  data: any;
}

export interface ReplaySessionRecord {
  initialSeed: number;
  totalTicks: number;
  commands: ReplayCommand[];
}

/**
 * Capture-and-playback coordinator. Logs all user execution instructions,
 * seeds, and timed events, allowing deterministic simulations to recreate and audit exact states.
 */
export class DeterministicReplayFramework {
  private initialSeed: number = 42;
  private commands: ReplayCommand[] = [];
  private isRecordingSession: boolean = false;

  /**
   * Commences recording loop.
   */
  public startRecording(seed: number): void {
    this.initialSeed = seed;
    this.commands = [];
    this.isRecordingSession = true;
  }

  /**
   * Commits timed instruction to record sheet.
   */
  public recordCommand(tick: number, type: string, data: any): void {
    if (!this.isRecordingSession) return;
    this.commands.push({ tick, type, data });
  }

  /**
   * Stops recording and returns completed payload.
   */
  public stopRecording(currentTicks: number): ReplaySessionRecord {
    this.isRecordingSession = false;
    return {
      initialSeed: this.initialSeed,
      totalTicks: currentTicks,
      commands: [...this.commands]
    };
  }

  /**
   * Evaluates if commands are scheduled on a given tick, returning them.
   */
  public getCommandsForTick(tick: number, session: ReplaySessionRecord): ReplayCommand[] {
    return session.commands.filter(cmd => cmd.tick === tick);
  }

  /**
   * Evaluates whether simulation has reached completion metrics.
   */
  public isCompleted(tick: number, session: ReplaySessionRecord): boolean {
    return tick >= session.totalTicks;
  }
}
