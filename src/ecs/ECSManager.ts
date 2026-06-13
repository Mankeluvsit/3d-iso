/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ComponentMap, ComponentName } from './components';

export class ECSManager {
  private nextEntityId = 1;
  private entities = new Set<string>();
  private components = new Map<string, Map<string, any>>(); // componentName -> entityId -> componentData

  public createEntity(id?: string): string {
    const entId = id || `ent_${this.nextEntityId++}`;
    this.entities.add(entId);
    return entId;
  }

  public destroyEntity(entityId: string): void {
    this.entities.delete(entityId);
    for (const store of this.components.values()) {
      store.delete(entityId);
    }
  }

  public addComponent<K extends ComponentName>(entityId: string, name: K, data: ComponentMap[K]): void {
    if (!this.components.has(name)) {
      this.components.set(name, new Map());
    }
    this.components.get(name)!.set(entityId, data);
  }

  public removeComponent(entityId: string, name: ComponentName): void {
    const store = this.components.get(name);
    if (store) {
      store.delete(entityId);
    }
  }

  public getComponent<K extends ComponentName>(entityId: string, name: K): ComponentMap[K] | undefined {
    const store = this.components.get(name);
    if (!store) return undefined;
    return store.get(entityId);
  }

  public hasComponent(entityId: string, name: ComponentName): boolean {
    const store = this.components.get(name);
    return store ? store.has(entityId) : false;
  }

  public query<K extends ComponentName>(requiredComponents: K[]): string[] {
    if (requiredComponents.length === 0) return Array.from(this.entities);

    const firstComp = requiredComponents[0];
    const firstStore = this.components.get(firstComp);
    if (!firstStore) return [];

    let candidateIds = Array.from(firstStore.keys());
    for (let i = 1; i < requiredComponents.length; i++) {
      const compName = requiredComponents[i];
      const store = this.components.get(compName);
      if (!store) return [];
      candidateIds = candidateIds.filter(id => store.has(id));
    }

    return candidateIds;
  }

  public getEntities(): string[] {
    return Array.from(this.entities);
  }

  public clear(): void {
    this.entities.clear();
    this.components.clear();
    this.nextEntityId = 1;
  }

  /**
   * Snapshot serialization of the entire ECS state
   */
  public serialize(): any {
    const serialized: any = {
      entities: Array.from(this.entities),
      nextEntityId: this.nextEntityId,
      components: {}
    };
    for (const [name, store] of this.components.entries()) {
      serialized.components[name] = Array.from(store.entries());
    }
    return serialized;
  }

  /**
   * Hydrates the entire ECS state from a snapshot
   */
  public deserialize(data: any): void {
    this.clear();
    this.nextEntityId = data.nextEntityId || 1;
    if (data.entities) {
      data.entities.forEach((id: string) => this.entities.add(id));
    }
    if (data.components) {
      for (const [name, entries] of Object.entries(data.components)) {
        const store = new Map<string, any>();
        if (Array.isArray(entries)) {
          entries.forEach(([entityId, componentData]) => {
            store.set(entityId, componentData);
          });
        }
        this.components.set(name, store);
      }
    }
  }
}
