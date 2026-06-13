/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameStateSnapshot } from '../kernel/Snapshot';

export type OnMsgCallback = (snap: GameStateSnapshot) => void;

export class SimulationWorkerManager {
  private worker: Worker | null = null;
  private mockInterval: any = null;
  private mockKernel: any = null;

  constructor(private onMessage: OnMsgCallback) {
    this.init();
  }

  private async init() {
    try {
      // Initialize ESM Web Worker dynamically via Vite asset resolution
      this.worker = new Worker(
        new URL('./simulation.worker.ts', import.meta.url),
        { type: 'module' }
      );

      this.worker.onmessage = (event) => {
        const { type, data } = event.data;
        if (type === 'STATE_SYNC') {
          this.onMessage(data.snapshot);
        }
      };

      // Start tick inside worker
      this.worker.postMessage({ type: 'INIT' });
      console.log("Dedicated simulation Web Worker instantiated successfully.");
    } catch (e) {
      console.warn("Sandbox/CORS constraints blocked Web Worker instantiation. Activating main-thread Simulation MockWorker fallback gracefully.", e);
      this.initMockWorker();
    }
  }

  private initMockWorker() {
    import('../kernel/GameKernel').then(({ GameKernel }) => {
      this.mockKernel = new GameKernel();
      
      this.mockKernel.generateNewAIGoal().then(() => {
        this.emitMockSnapshot();
      });

      this.mockInterval = setInterval(() => {
        this.mockKernel.tick();
        this.emitMockSnapshot();
      }, 2000);
    });
  }

  private emitMockSnapshot() {
    if (this.mockKernel) {
      this.onMessage(this.mockKernel.captureSnapshot());
    }
  }

  public postMessage(msg: { type: string; data?: any }) {
    if (this.worker) {
      this.worker.postMessage(msg);
    } else {
      setTimeout(() => {
        if (!this.mockKernel) return;
        const { type, data } = msg;

        switch (type) {
          case 'INIT':
            // done
            break;
          case 'EXEC_COMMAND':
            const { cmdType, params } = data;
            import('../kernel/Command').then(({ BuildCommand, DemolishCommand, PolicyToggleCommand }) => {
              let success = false;
              if (cmdType === 'BuildCommand') {
                const cmd = new BuildCommand(params.x, params.y, params.buildingType);
                success = this.mockKernel.getCommandManager().execute(cmd);
              } else if (cmdType === 'DemolishCommand') {
                const cmd = new DemolishCommand(params.x, params.y);
                success = this.mockKernel.getCommandManager().execute(cmd);
              } else if (cmdType === 'PolicyToggleCommand') {
                const cmd = new PolicyToggleCommand(params.policyId);
                success = this.mockKernel.getCommandManager().execute(cmd);
              }
              if (success) {
                this.emitMockSnapshot();
              }
            });
            break;

          case 'UNDO':
            if (this.mockKernel.getCommandManager().undo()) {
              this.emitMockSnapshot();
            }
            break;

          case 'REDO':
            if (this.mockKernel.getCommandManager().redo()) {
              this.emitMockSnapshot();
            }
            break;

          case 'CLAIM_AWARD':
            this.mockKernel.claimAIGoalReward();
            this.emitMockSnapshot();
            break;

          case 'GET_STATUS':
            this.emitMockSnapshot();
            break;

          case 'RUN_HEADLESS_AUDIT':
            if (this.mockKernel) {
              const auditResult = this.mockKernel.getHeadlessEngine().runTicks(data?.ticks || 100);
              this.mockKernel.getEventBus().emit('news_triggered', {
                id: `audit_${Date.now()}`,
                text: `Headless simulation completed: ${auditResult.totalTicks} ticks processed. Economy is ${auditResult.isEconomyStable ? 'Stable' : 'Unstable'}. Population Delta: ${auditResult.growthDelta}`,
                type: 'neutral'
              });
              this.emitMockSnapshot();
            }
            break;
        }
      }, 0);
    }
  }

  public terminate() {
    if (this.worker) {
      this.worker.terminate();
    }
    if (this.mockInterval) {
      clearInterval(this.mockInterval);
    }
  }
}
