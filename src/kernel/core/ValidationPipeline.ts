/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ContentItem } from './ContentRegistry';

export interface ValidationReport {
  isValid: boolean;
  errors: string[];
}

/**
 * Structural validation validator checks schemas on file loading to protect simulation stability.
 */
export class ValidationPipeline {
  /**
   * Evaluates the schema properties of incoming dynamic content specifications.
   */
  public validate(item: ContentItem): ValidationReport {
    const errors: string[] = [];

    if (!item.id) errors.push('Missing unique identifier "id".');
    if (!item.type) errors.push('Missing categorization "type".');
    if (!item.data) {
      errors.push('Missing associated config "data" body.');
      return { isValid: false, errors };
    }

    switch (item.type) {
      case 'building':
        this.validateBuilding(item.data, errors);
        break;
      case 'policy':
        this.validatePolicy(item.data, errors);
        break;
      case 'scenario':
        this.validateScenario(item.data, errors);
        break;
      default:
        break;
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private validateBuilding(data: any, errors: string[]): void {
    if (typeof data.name !== 'string') errors.push('Building "name" must be a valid string.');
    if (typeof data.cost !== 'number' || data.cost < 0) errors.push('Building "cost" must be a non-negative number.');
    if (data.color && typeof data.color !== 'string') errors.push('Building "color" hex representation must be a string.');
  }

  private validatePolicy(data: any, errors: string[]): void {
    if (typeof data.name !== 'string') errors.push('Policy "name" must be a string.');
    if (typeof data.description !== 'string') errors.push('Policy "description" must be a string.');
  }

  private validateScenario(data: any, errors: string[]): void {
    if (typeof data.name !== 'string') errors.push('Scenario "name" must be a string.');
    if (!Array.isArray(data.goals)) errors.push('Scenario "goals" must be represented as a valid array definition.');
  }
}
