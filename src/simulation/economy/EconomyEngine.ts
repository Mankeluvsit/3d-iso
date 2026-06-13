/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventBus } from '../../kernel/EventBus';
import { ECSManager } from '../../ecs/ECSManager';
import buildingsConfig from '../../config/buildings.json';
import policiesConfig from '../../config/policies.json';

export interface EconomyState {
  treasury: number;
  dailyIncome: number;
  dailyExpenses: number;
}

export class EconomyEngine {
  private treasury = 1000;
  private dailyIncome = 0;
  private dailyExpenses = 0;

  constructor(private eventBus: EventBus, private ecs: ECSManager) {}

  public getTreasury(): number {
    return this.treasury;
  }

  public setTreasury(amount: number): void {
    const diff = amount - this.treasury;
    this.treasury = amount;
    this.eventBus.emit('money_changed', { newAmount: this.treasury, delta: diff });
  }

  public getState(): EconomyState {
    return {
      treasury: this.treasury,
      dailyIncome: this.dailyIncome,
      dailyExpenses: this.dailyExpenses
    };
  }

  public update(delta: number, activePolicies: Record<string, boolean>): void {
    let rawIncome = 0;
    let rawExpenses = 0;

    // 1. Calculate base values from active buildings in the ECS
    const buildingEntities = this.ecs.query(['Building']);
    
    // Look up modifiers from active policies
    let commercialMultiplier = 1.0;
    let industrialMultiplier = 1.0;

    for (const [policyId, enabled] of Object.entries(activePolicies)) {
      if (enabled) {
        const policy = policiesConfig.find(p => p.id === policyId);
        if (policy) {
          rawExpenses += policy.costPerDay;
          if (policy.effects.commercialIncomeMultiplier !== undefined) {
            commercialMultiplier *= policy.effects.commercialIncomeMultiplier;
          }
          if (policy.effects.industrialIncomeMultiplier !== undefined) {
            industrialMultiplier *= policy.effects.industrialIncomeMultiplier;
          }
        }
      }
    }

    buildingEntities.forEach(entId => {
      const bComp = this.ecs.getComponent(entId, 'Building')!;
      const config = (buildingsConfig as any)[bComp.type];
      if (config) {
        let inc = config.incomeGen || 0;
        if (bComp.type === 'Commercial') {
          inc *= commercialMultiplier;
        } else if (bComp.type === 'Industrial') {
          inc *= industrialMultiplier;
        }
        rawIncome += inc;
      }
    });

    this.dailyIncome = Math.round(rawIncome);
    this.dailyExpenses = Math.round(rawExpenses);

    // Update treasury
    const netIncome = this.dailyIncome - this.dailyExpenses;
    this.setTreasury(this.treasury + netIncome);
  }
}
