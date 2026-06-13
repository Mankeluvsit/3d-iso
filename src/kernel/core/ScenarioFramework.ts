/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RuleCondition, RuleEffect } from './RuleEngine';

export interface ScenarioDefinition {
  id: string;
  name: string;
  description: string;
  category: 'sandbox' | 'challenge' | 'campaign' | 'tutorial';
  startingCash: number;
  startingPopulation: number;
  lockedBuildings?: string[];
  goals: Array<{
    id: string;
    description: string;
    condition: RuleCondition;
    completed: boolean;
  }>;
}

/**
 * Centrally manages sandbox, challenge and tutorial structures.
 * Sets start balances and monitors completion metrics.
 */
export class ScenarioFramework {
  private activeScenario: ScenarioDefinition | null = null;

  /**
   * Loads a custom scenario specification.
   */
  public loadScenario(def: ScenarioDefinition): void {
    this.activeScenario = JSON.parse(JSON.stringify(def));
  }

  /**
   * Retrieves active scenario properties.
   */
  public getActiveScenario(): ScenarioDefinition | null {
    return this.activeScenario;
  }

  /**
   * Evaluates active conditions to mark matching achievements as complete.
   * @param getResourceValue - Callback querying active resource balances
   */
  public evaluateStatus(getResourceValue: (resourceId: string) => number): {
    completed: boolean;
    goals: Array<{ id: string; description: string; completed: boolean }>;
  } {
    if (!this.activeScenario) {
      return { completed: false, goals: [] };
    }

    let allCompleted = true;

    const updatedGoals = this.activeScenario.goals.map(goal => {
      if (goal.completed) {
        return goal;
      }

      let isGoalMet = false;
      const cond = goal.condition;

      if (cond.type === 'RESOURCE' && cond.resourceId) {
        const lVal = getResourceValue(cond.resourceId);
        const rVal = cond.value;

        switch (cond.operator) {
          case 'eq': isGoalMet = (lVal === rVal); break;
          case 'neq': isGoalMet = (lVal !== rVal); break;
          case 'gt': isGoalMet = (lVal > rVal); break;
          case 'gte': isGoalMet = (lVal >= rVal); break;
          case 'lt': isGoalMet = (lVal < rVal); break;
          case 'lte': isGoalMet = (lVal <= rVal); break;
        }
      }

      if (isGoalMet) {
        goal.completed = true;
      } else {
        allCompleted = false;
      }

      return goal;
    });

    this.activeScenario.goals = updatedGoals;

    return {
      completed: allCompleted,
      goals: updatedGoals.map(g => ({ id: g.id, description: g.description, completed: g.completed }))
    };
  }

  /**
   * Checks if a building type is locked under current conditions.
   */
  public isBuildingLocked(buildingType: string): boolean {
    if (!this.activeScenario || !this.activeScenario.lockedBuildings) {
      return false;
    }
    return this.activeScenario.lockedBuildings.includes(buildingType);
  }

  /**
   * Closes out active scenarios.
   */
  public exit(): void {
    this.activeScenario = null;
  }
}
