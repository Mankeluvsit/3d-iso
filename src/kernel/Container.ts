/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export class Container {
  private services = new Map<string, any>();

  public register<T>(name: string, service: T): void {
    this.services.set(name, service);
  }

  public resolve<T>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service "${name}" not found in DI Container`);
    }
    return service;
  }

  public clear(): void {
    this.services.clear();
  }
}

export const globalContainer = new Container();
