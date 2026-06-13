/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ValidationPipeline } from './ValidationPipeline';

export interface ContentItem {
  id: string;
  type: 'building' | 'policy' | 'scenario' | 'achievement' | 'resource';
  data: any;
}

/**
 * Single source of truth indexing, retrieving, and validating
 * modifiable structural resources (building specs, expansion parameters, scenarios etc).
 */
export class ContentRegistry {
  private items = new Map<string, ContentItem>();
  private validator = new ValidationPipeline();

  /**
   * Enrolls a custom content specification into the registry, executing validation.
   */
  public register(item: ContentItem): void {
    const validationResult = this.validator.validate(item);
    if (!validationResult.isValid) {
      throw new Error(`ContentRegistry validation failed for ID "${item.id}": ${validationResult.errors.join(', ')}`);
    }
    this.items.set(`${item.type}:${item.id}`, item);
  }

  /**
   * Retrieves registered content config by ID and type.
   */
  public get(type: 'building' | 'policy' | 'scenario' | 'achievement' | 'resource', id: string): any | null {
    const found = this.items.get(`${type}:${id}`);
    return found ? found.data : null;
  }

  /**
   * Safe batch query returns all registered content files of a specific group category.
   */
  public getAllOfType(type: 'building' | 'policy' | 'scenario' | 'achievement' | 'resource'): any[] {
    const results: any[] = [];
    for (const [key, item] of this.items.entries()) {
      if (key.startsWith(`${type}:`)) {
        results.push(item.data);
      }
    }
    return results;
  }

  /**
   * Resets active content registrations.
   */
  public clear(): void {
    this.items.clear();
  }
}
