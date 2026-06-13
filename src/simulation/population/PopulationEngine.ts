/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventBus } from '../../kernel/EventBus';
import { ECSManager } from '../../ecs/ECSManager';
import buildingsConfig from '../../config/buildings.json';
import policiesConfig from '../../config/policies.json';

export interface PopulationState {
  population: number;
  maxPopulation: number;
  averageHappiness: number;
}

export class PopulationEngine {
  private population = 0;
  private averageHappiness = 75;

  constructor(private eventBus: EventBus, private ecs: ECSManager) {}

  public getPopulation(): number {
    return this.population;
  }

  public setPopulation(pop: number): void {
    if (this.population !== pop) {
      const diff = pop - this.population;
      this.population = pop;
      this.eventBus.emit('population_changed', { newPopulation: this.population, delta: diff });
    }
  }

  public getState(): PopulationState {
    const buildings = this.ecs.query(['Building']);
    let resCount = 0;
    buildings.forEach(id => {
      const bType = this.ecs.getComponent(id, 'Building')!.type;
      if (bType === 'Residential') resCount++;
    });
    return {
      population: this.population,
      maxPopulation: resCount * 50,
      averageHappiness: this.averageHappiness
    };
  }

  public update(delta: number, activePolicies: Record<string, boolean>): void {
    // 1. Calculate residential capacity from active buildings
    const buildingEntities = this.ecs.query(['Building', 'Position']);
    let residentialCount = 0;
    let commercialCapacity = 0;
    let industrialCapacity = 0;
    let baseHappinessBoost = 0;
    let growthMultiplier = 1.0;

    // Check policy impacts
    for (const [pId, enabled] of Object.entries(activePolicies)) {
      if (enabled) {
        const p = policiesConfig.find(item => item.id === pId);
        if (p) {
          if (p.effects.happinessBoost !== undefined) baseHappinessBoost += p.effects.happinessBoost;
          if (p.effects.populationGrowthMultiplier !== undefined) growthMultiplier *= p.effects.populationGrowthMultiplier;
        }
      }
    }

    buildingEntities.forEach(id => {
      const bComp = this.ecs.getComponent(id, 'Building')!;
      if (bComp.type === 'Residential') {
        residentialCount++;
      } else if (bComp.type === 'Commercial') {
        commercialCapacity += (buildingsConfig as any).Commercial.jobsProvided || 5;
      } else if (bComp.type === 'Industrial') {
        industrialCapacity += (buildingsConfig as any).Industrial.jobsProvided || 15;
      }
    });

    const maxPop = residentialCount * 50;

    // 2. Adjust growth dynamically
    let growthAmount = 0;
    if (residentialCount > 0) {
      // Base growth: +5 per house
      growthAmount = Math.ceil(residentialCount * 1.5 * growthMultiplier);
    } else if (this.population > 0) {
      // shrink if no homes
      growthAmount = -5;
    }

    let nextPop = Math.max(0, this.population + growthAmount);
    if (nextPop > maxPop) {
      nextPop = maxPop;
    }

    this.setPopulation(nextPop);

    // 3. Update or re-spawn citizen entities in the ECS matching current population count
    const citizenEntities = this.ecs.query(['Happiness', 'Position']);
    const desiredCitizensInECS = Math.min(Math.floor(this.population / 2) || 1, 100); // capped for performance

    // Spawn if we need more
    if (citizenEntities.length < desiredCitizensInECS) {
      const spawnCount = desiredCitizensInECS - citizenEntities.length;
      
      // Find suitable places to spawn (e.g. residential buildings)
      const resBuildings = buildingEntities.filter(id => this.ecs.getComponent(id, 'Building')!.type === 'Residential');
      
      for (let i = 0; i < spawnCount; i++) {
        const citizenId = this.ecs.createEntity();
        
        let spawnX = 7;
        let spawnY = 7;
        
        if (resBuildings.length > 0) {
          const resB = resBuildings[Math.floor(Math.random() * resBuildings.length)];
          const pos = this.ecs.getComponent(resB, 'Position')!;
          spawnX = pos.x;
          spawnY = pos.y;
        }

        this.ecs.addComponent(citizenId, 'Position', { x: spawnX, y: spawnY });
        this.ecs.addComponent(citizenId, 'Happiness', { rating: 75, factorWork: 80, factorEnvironment: 70 });
        this.ecs.addComponent(citizenId, 'Employment', { hasJob: false, salary: 0 });
      }
    } 
    // Prune if we have too many
    else if (citizenEntities.length > desiredCitizensInECS) {
      const excess = citizenEntities.length - desiredCitizensInECS;
      for (let i = 0; i < excess; i++) {
        this.ecs.destroyEntity(citizenEntities[i]);
      }
    }

    // 4. Calculate happiness for existing citizen entities and find work matches
    const updatedCitizens = this.ecs.query(['Happiness', 'Position', 'Employment']);
    let totalHappiness = 0;

    updatedCitizens.forEach(cid => {
      const hap = this.ecs.getComponent(cid, 'Happiness')!;
      const emp = this.ecs.getComponent(cid, 'Employment')!;

      // simple job finder logic: matching with commercial/industrial demands
      if (!emp.hasJob) {
        if (commercialCapacity > 0 || industrialCapacity > 0) {
          emp.hasJob = true;
          emp.salary = 30; // standard paycheck
          if (commercialCapacity > 0) commercialCapacity--;
          else industrialCapacity--;
        }
      }

      // Calculate happiness elements
      const workFactor = emp.hasJob ? 90 : 40;
      const envFactor = Math.min(100, Math.max(20, 70 + baseHappinessBoost));

      hap.factorWork = workFactor;
      hap.factorEnvironment = envFactor;
      hap.rating = Math.round((workFactor + envFactor) / 2);

      totalHappiness += hap.rating;
    });

    this.averageHappiness = updatedCitizens.length > 0 ? Math.round(totalHappiness / updatedCitizens.length) : 75;
  }
}
