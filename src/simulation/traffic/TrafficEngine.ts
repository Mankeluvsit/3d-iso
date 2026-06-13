/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventBus } from '../../kernel/EventBus';
import { ECSManager } from '../../ecs/ECSManager';

export interface TrafficState {
  congestionLevel: number; // 0-100%
  vehicleCount: number;
}

export class TrafficEngine {
  private congestionLevel = 0;

  constructor(private eventBus: EventBus, private ecs: ECSManager) {}

  public getState(): TrafficState {
    const vehicles = this.ecs.query(['Traffic', 'Position']);
    return {
      congestionLevel: this.congestionLevel,
      vehicleCount: vehicles.length
    };
  }

  public update(delta: number, grid: any[][]): void {
    // 1. Gather all road coordinates
    const roads: { x: number; y: number }[] = [];
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        if (grid[y][x].buildingType === 'Road') {
          roads.push({ x, y });
        }
      }
    }

    // 2. Adjust vehicle entities to match roads density (up to some max, e.g. 1 vehicle per 2 roads, capped at 30)
    const desiredVehicles = Math.min(Math.floor(roads.length / 2), 30);
    const vehicleEntities = this.ecs.query(['Traffic', 'Position']);

    if (roads.length >= 2) {
      if (vehicleEntities.length < desiredVehicles) {
        const spawnCount = desiredVehicles - vehicleEntities.length;
        for (let i = 0; i < spawnCount; i++) {
          const vehId = this.ecs.createEntity();
          const startNode = roads[Math.floor(Math.random() * roads.length)];

          this.ecs.addComponent(vehId, 'Position', { x: startNode.x, y: startNode.y });
          this.ecs.addComponent(vehId, 'Traffic', {
            route: [],
            progress: 1, // forces pick of new origin & target
            speed: 0.1,
            originX: startNode.x,
            originY: startNode.y,
            targetX: startNode.x,
            targetY: startNode.y
          });
        }
      } else if (vehicleEntities.length > desiredVehicles) {
        const excess = vehicleEntities.length - desiredVehicles;
        for (let i = 0; i < excess; i++) {
          this.ecs.destroyEntity(vehicleEntities[i]);
        }
      }
    } else {
      // If no roads, delete all outstanding vehicles
      vehicleEntities.forEach(vid => this.ecs.destroyEntity(vid));
    }

    // 3. Process driving routes in ECS with custom safety triggers
    const activeVehicles = this.ecs.query(['Traffic', 'Position']);
    activeVehicles.forEach(vid => {
      const position = this.ecs.getComponent(vid, 'Position')!;
      const traffic = this.ecs.getComponent(vid, 'Traffic')!;

      traffic.progress += traffic.speed * 2.0; // speed update rate multiplier

      if (traffic.progress >= 1.0) {
        // Move to current target
        traffic.originX = traffic.targetX;
        traffic.originY = traffic.targetY;
        position.x = traffic.originX;
        position.y = traffic.originY;
        traffic.progress = 0;

        // Choose adjacent next road to travel to
        const curX = traffic.originX;
        const curY = traffic.originY;

        const neighbors = roads.filter(r => 
          (Math.abs(r.x - curX) === 1 && r.y === curY) ||
          (Math.abs(r.y - curY) === 1 && r.x === curX)
        );

        if (neighbors.length > 0) {
          const next = neighbors[Math.floor(Math.random() * neighbors.length)];
          traffic.targetX = next.x;
          traffic.targetY = next.y;
        } else {
          // Fallback to random road to prevent getting stuck
          const rnd = roads[Math.floor(Math.random() * roads.length)];
          if (rnd) {
            traffic.originX = rnd.x;
            traffic.originY = rnd.y;
            traffic.targetX = rnd.x;
            traffic.targetY = rnd.y;
          }
        }
      } else {
        // Linearly interpolate positions for accurate ECS position stats
        position.x = traffic.originX + (traffic.targetX - traffic.originX) * traffic.progress;
        position.y = traffic.originY + (traffic.targetY - traffic.originY) * traffic.progress;
      }
    });

    // 4. Calculate Congestion Coefficient
    if (roads.length > 0) {
      this.congestionLevel = Math.min(100, Math.round((activeVehicles.length / roads.length) * 100));
    } else {
      this.congestionLevel = 0;
    }
  }
}
