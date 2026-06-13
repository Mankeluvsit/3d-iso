/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ResourceRegistry } from './ResourceRegistry';
import { TagSystem } from './TagSystem';
import { EventBus } from '../EventBus';

export interface RuleCondition {
  type: 'RESOURCE' | 'TAG_COUNT' | 'TICK' | 'TIME_PASSED';
  resourceId?: string;
  tag?: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte';
  value: any;
}

export interface RuleEffect {
  type: 'MODIFY_RESOURCE' | 'TRIGGER_NEWS' | 'ADD_MODIFIER' | 'UNLOCK_BUILDING' | 'REMOVE_MODIFIER';
  resourceId?: string;
  value?: any;
  text?: string;
  newsType?: 'positive' | 'negative' | 'neutral';
  modifier?: any;
  buildingType?: string;
}

export interface RuleDefinition {
  id: string;
  name: string;
  description: string;
  conditions: RuleCondition[];
  effects: RuleEffect[];
  once: boolean; // evaluation frequency (stops triggering once met)
}

/**
 * Codeless dynamic rule logic evaluator and execution core.
 * Evaluates game milestones, economic alerts, scenarios, and disaster events.
 */
export class RuleEngine {
  private rules = new Map<string, RuleDefinition>();
  private evaluatedRuleCount = new Set<string>();

  constructor(
    private resources: ResourceRegistry,
    private tags: TagSystem,
    private eventBus: EventBus
  ) {}

  /**
   * Registers a dynamic rule.
   */
  public registerRule(rule: RuleDefinition): void {
    this.rules.set(rule.id, rule);
  }

  /**
   * Primary evaluation loop checking unregistered/repeat conditions.
   * Runs effects matching comparison criteria.
   */
  public evaluate(currentTick: number): void {
    for (const rule of this.rules.values()) {
      if (rule.once && this.evaluatedRuleCount.has(rule.id)) {
        continue;
      }

      if (this.checkConditions(rule.conditions, currentTick)) {
        this.executeEffects(rule.effects);
        if (rule.once) {
          this.evaluatedRuleCount.add(rule.id);
        }
      }
    }
  }

  private checkConditions(conditions: RuleCondition[], currentTick: number): boolean {
    return conditions.every(cond => {
      let lVal: any = 0;

      switch (cond.type) {
        case 'RESOURCE':
          if (!cond.resourceId) return false;
          lVal = this.resources.get(cond.resourceId);
          break;
        case 'TAG_COUNT':
          if (!cond.tag) return false;
          lVal = this.tags.queryByTag(cond.tag).length;
          break;
        case 'TICK':
          lVal = currentTick;
          break;
        default:
          return false;
      }

      const rVal = cond.value;
      switch (cond.operator) {
        case 'eq': return lVal === rVal;
        case 'neq': return lVal !== rVal;
        case 'gt': return lVal > rVal;
        case 'gte': return lVal >= rVal;
        case 'lt': return lVal < rVal;
        case 'lte': return lVal <= rVal;
        default: return false;
      }
    });
  }

  private executeEffects(effects: RuleEffect[]): void {
    effects.forEach(effect => {
      switch (effect.type) {
        case 'MODIFY_RESOURCE':
          if (effect.resourceId && effect.value !== undefined) {
            this.resources.adjust(effect.resourceId, effect.value);
          }
          break;

        case 'TRIGGER_NEWS':
          if (effect.text) {
            this.eventBus.emit('news_triggered', {
              id: `rule_evt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
              text: effect.text,
              type: effect.newsType || 'neutral'
            });
          }
          break;

        case 'UNLOCK_BUILDING':
          if (effect.buildingType) {
            this.eventBus.emit('news_triggered', {
              id: `unlock_${effect.buildingType}`,
              text: `Achievement Unlocked: Constructed footprint enables: "${effect.buildingType}" blueprint!`,
              type: 'positive'
            });
          }
          break;

        default:
          break;
      }
    });
  }

  /**
   * Resets evaluation histories.
   */
  public reset(): void {
    this.evaluatedRuleCount.clear();
  }

  /**
   * Lists loaded rules.
   */
  public getRules(): RuleDefinition[] {
    return Array.from(this.rules.values());
  }
}
