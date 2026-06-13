/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameKernel } from './GameKernel';
import { BuildingType } from '../../types';
import buildingsConfig from '../config/buildings.json';

export interface CommandSerializer {
  type: string;
  params: any;
}

export interface Command {
  id: string;
  type: string;
  timestamp: number;
  execute(kernel: GameKernel): boolean;
  undo(kernel: GameKernel): boolean;
  serialize(): CommandSerializer;
}

/**
 * Commands correspond to player placements
 */
export class BuildCommand implements Command {
  public id: string;
  public type = 'BuildCommand';
  public timestamp = Date.now();
  private previousType: BuildingType = BuildingType.None;

  constructor(private x: number, private y: number, private buildingType: BuildingType) {
    this.id = `cmd_build_${this.x}_${this.y}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  }

  public execute(kernel: GameKernel): boolean {
    const grid = kernel.getGrid();
    const stats = kernel.getStats();

    if (this.x < 0 || this.x >= grid.length || this.y < 0 || this.y >= grid[0].length) {
      return false;
    }

    const currentTile = grid[this.y][this.x];
    if (currentTile.buildingType !== BuildingType.None) return false;

    const config = (buildingsConfig as any)[this.buildingType];
    if (!config) return false;

    if (stats.money < config.cost) {
      // not cheap enough
      kernel.getEventBus().emit('news_triggered', {
        id: Date.now().toString() + Math.random(),
        text: `Treasury lacks the funding ($${config.cost}) for a ${config.name}.`,
        type: 'negative'
      });
      return false;
    }

    // Capture previous type for undo
    this.previousType = currentTile.buildingType;

    // Place building
    currentTile.buildingType = this.buildingType;
    kernel.getEconomyEngine().setTreasury(stats.money - config.cost);

    // Write to ECS as an entity
    const entId = `tile_${this.x}_${this.y}`;
    kernel.getECS().createEntity(entId);
    kernel.getECS().addComponent(entId, 'Position', { x: this.x, y: this.y });
    kernel.getECS().addComponent(entId, 'Building', { type: this.buildingType, cost: config.cost, age: 0 });

    kernel.getEventBus().emit('building_placed', { x: this.x, y: this.y, type: this.buildingType });
    
    // Trigger grid distribution solve
    kernel.triggerGridUpdated();
    return true;
  }

  public undo(kernel: GameKernel): boolean {
    const grid = kernel.getGrid();
    const stats = kernel.getStats();
    const config = (buildingsConfig as any)[this.buildingType];

    grid[this.y][this.x].buildingType = this.previousType;
    kernel.getEconomyEngine().setTreasury(stats.money + config.cost);

    const entId = `tile_${this.x}_${this.y}`;
    kernel.getECS().destroyEntity(entId);

    kernel.getEventBus().emit('building_demolished', { x: this.x, y: this.y });
    kernel.triggerGridUpdated();
    return true;
  }

  public serialize(): CommandSerializer {
    return {
      type: this.type,
      params: { x: this.x, y: this.y, buildingType: this.buildingType }
    };
  }
}

/**
 * Commands correspond to player demolitions
 */
export class DemolishCommand implements Command {
  public id: string;
  public type = 'DemolishCommand';
  public timestamp = Date.now();
  private previousType: BuildingType = BuildingType.None;
  private demolishCost = 5;

  constructor(private x: number, private y: number) {
    this.id = `cmd_demo_${this.x}_${this.y}_${Date.now()}`;
  }

  public execute(kernel: GameKernel): boolean {
    const grid = kernel.getGrid();
    const stats = kernel.getStats();

    if (this.x < 0 || this.x >= grid.length || this.y < 0 || this.y >= grid[0].length) {
      return false;
    }

    const currentTile = grid[this.y][this.x];
    if (currentTile.buildingType === BuildingType.None) return false;

    if (stats.money < this.demolishCost) {
      kernel.getEventBus().emit('news_triggered', {
        id: Date.now().toString() + Math.random(),
        text: "Too debt-ridden to fund building demolition.",
        type: 'negative'
      });
      return false;
    }

    // Demolish
    this.previousType = currentTile.buildingType;
    currentTile.buildingType = BuildingType.None;
    kernel.getEconomyEngine().setTreasury(stats.money - this.demolishCost);

    const entId = `tile_${this.x}_${this.y}`;
    kernel.getECS().destroyEntity(entId);

    kernel.getEventBus().emit('building_demolished', { x: this.x, y: this.y });
    kernel.triggerGridUpdated();
    return true;
  }

  public undo(kernel: GameKernel): boolean {
    const grid = kernel.getGrid();
    const stats = kernel.getStats();

    grid[this.y][this.x].buildingType = this.previousType;
    kernel.getEconomyEngine().setTreasury(stats.money + this.demolishCost);

    const config = (buildingsConfig as any)[this.previousType];
    const entId = `tile_${this.x}_${this.y}`;
    kernel.getECS().createEntity(entId);
    kernel.getECS().addComponent(entId, 'Position', { x: this.x, y: this.y });
    kernel.getECS().addComponent(entId, 'Building', { type: this.previousType, cost: config?.cost || 0, age: 0 });

    kernel.getEventBus().emit('building_placed', { x: this.x, y: this.y, type: this.previousType });
    kernel.triggerGridUpdated();
    return true;
  }

  public serialize(): CommandSerializer {
    return {
      type: this.type,
      params: { x: this.x, y: this.y }
    };
  }
}

/**
 * Commands correspond to policy setting changes
 */
export class PolicyToggleCommand implements Command {
  public id: string;
  public type = 'PolicyToggleCommand';
  public timestamp = Date.now();

  constructor(private policyId: string) {
    this.id = `cmd_policy_${this.policyId}_${Date.now()}`;
  }

  public execute(kernel: GameKernel): boolean {
    const currentStatus = !!kernel.getPolicies()[this.policyId];
    kernel.getPolicies()[this.policyId] = !currentStatus;
    kernel.getEventBus().emit('policy_changed', { policyId: this.policyId, enabled: !currentStatus });
    return true;
  }

  public undo(kernel: GameKernel): boolean {
    const currentStatus = !!kernel.getPolicies()[this.policyId];
    kernel.getPolicies()[this.policyId] = !currentStatus;
    kernel.getEventBus().emit('policy_changed', { policyId: this.policyId, enabled: !currentStatus });
    return true;
  }

  public serialize(): CommandSerializer {
    return {
      type: this.type,
      params: { policyId: this.policyId }
    };
  }
}
