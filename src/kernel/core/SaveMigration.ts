/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface VersionedSaveState {
  version: number;
  payload: any;
}

export type MigrationStep = (payload: any) => any;

/**
 * Centrally coordinates upgrading stored files to prevent runtime bugs across version releases.
 * Executes versioned migration transformations step-by-step.
 */
export class SaveMigrationFramework {
  private migrations = new Map<number, MigrationStep>();
  private currentVersion: number = 2; // Target schema version representation

  constructor() {
    this.registerMigrationSteps();
  }

  private registerMigrationSteps(): void {
    // Migration: Version 1 -> Version 2: adds a default "vitals" block
    this.migrations.set(1, (oldPayload: any) => {
      return {
        ...oldPayload,
        vitals: oldPayload.vitals || {
          averageHappiness: oldPayload.averageHappiness ?? 75,
          congestionLevel: oldPayload.congestionLevel ?? 0,
          pollutionLevel: oldPayload.pollutionLevel ?? 0
        }
      };
    });
  }

  /**
   * Evaluates and updates save states sequentially matching migration versions.
   */
  public migrate(save: VersionedSaveState): VersionedSaveState {
    let activePayload = { ...save.payload };
    let activeVersion = save.version;

    while (activeVersion < this.currentVersion) {
      const step = this.migrations.get(activeVersion);
      if (!step) {
        console.warn(`No migration step registered to upgrade schema version ${activeVersion}. Halt.`);
        break;
      }
      activePayload = step(activePayload);
      activeVersion++;
    }

    return {
      version: this.currentVersion,
      payload: activePayload
    };
  }

  /**
   * Package payload into standard versioned save objects.
   */
  public packageState(stateData: any): VersionedSaveState {
    return {
      version: this.currentVersion,
      payload: stateData
    };
  }
}
