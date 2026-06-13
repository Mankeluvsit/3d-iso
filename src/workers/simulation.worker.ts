/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameKernel } from '../kernel/GameKernel';
import { BuildCommand, DemolishCommand, PolicyToggleCommand } from '../kernel/Command';

let kernel: GameKernel | null = null;
let tickTimer: any = null;

// Handle messages inside Web Worker
self.onmessage = (event: MessageEvent) => {
  const { type, data } = event.data;

  if (!kernel) {
    kernel = new GameKernel();
  }

  switch (type) {
    case 'INIT':
      // Reset state and generate first goal
      kernel.generateNewAIGoal().then(() => {
        postSnapshot();
      });

      // Start tick interval timer (fixed ticks)
      if (tickTimer) clearInterval(tickTimer);
      tickTimer = setInterval(() => {
        if (kernel) {
          kernel.tick();
          postSnapshot();
        }
      }, 2000); // Ticking rate corresponds to 2 seconds standard
      break;

    case 'EXEC_COMMAND':
      const { cmdType, params } = data;
      let executedSuccess = false;

      if (cmdType === 'BuildCommand') {
        const cmd = new BuildCommand(params.x, params.y, params.buildingType);
        executedSuccess = kernel.getCommandManager().execute(cmd);
      } else if (cmdType === 'DemolishCommand') {
        const cmd = new DemolishCommand(params.x, params.y);
        executedSuccess = kernel.getCommandManager().execute(cmd);
      } else if (cmdType === 'PolicyToggleCommand') {
        const cmd = new PolicyToggleCommand(params.policyId);
        executedSuccess = kernel.getCommandManager().execute(cmd);
      }

      if (executedSuccess) {
        postSnapshot();
      }
      break;

    case 'UNDO':
      if (kernel.getCommandManager().undo()) {
        postSnapshot();
      }
      break;

    case 'REDO':
      if (kernel.getCommandManager().redo()) {
        postSnapshot();
      }
      break;

    case 'CLAIM_AWARD':
      kernel.claimAIGoalReward();
      postSnapshot();
      break;

    case 'GET_STATUS':
      postSnapshot();
      break;

    case 'SET_SNAPSHOT':
      kernel.loadSnapshot(data.snapshot);
      postSnapshot();
      break;

    case 'RUN_HEADLESS_AUDIT':
      const auditResult = kernel.getHeadlessEngine().runTicks(data.ticks || 100);
      kernel.getEventBus().emit('news_triggered', {
        id: `audit_${Date.now()}`,
        text: `Headless simulation completed: ${auditResult.totalTicks} ticks processed. Economy is ${auditResult.isEconomyStable ? 'Stable' : 'Unstable'}. Population Delta: ${auditResult.growthDelta}`,
        type: 'neutral'
      });
      postSnapshot();
      break;
  }
};

function postSnapshot() {
  if (kernel) {
    const snap = kernel.captureSnapshot();
    self.postMessage({ type: 'STATE_SYNC', data: { snapshot: snap } });
  }
}
