/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Command } from './Command';
import { GameKernel } from './GameKernel';

export class CommandManager {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private history: Command[] = [];

  constructor(private kernel: GameKernel) {}

  public execute(command: Command): boolean {
    const success = command.execute(this.kernel);
    if (success) {
      this.undoStack.push(command);
      this.history.push(command);
      this.redoStack = []; // clear redo on new player action
      this.kernel.getEventBus().emit('command_executed', {
        commandId: command.id,
        type: command.type,
        params: command.serialize().params
      });
    }
    return success;
  }

  public undo(): boolean {
    const command = this.undoStack.pop();
    if (command) {
      const success = command.undo(this.kernel);
      if (success) {
        this.redoStack.push(command);
        return true;
      } else {
        // roll back if failed
        this.undoStack.push(command);
      }
    }
    return false;
  }

  public redo(): boolean {
    const command = this.redoStack.pop();
    if (command) {
      const success = command.execute(this.kernel);
      if (success) {
        this.undoStack.push(command);
        return true;
      } else {
        this.redoStack.push(command);
      }
    }
    return false;
  }

  public getHistory(): any[] {
    return this.history.map(c => c.serialize());
  }

  public clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.history = [];
  }
}
