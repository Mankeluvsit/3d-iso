/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventBus } from './EventBus';
import { ECSManager } from '../ecs/ECSManager';
import { EconomyEngine } from '../simulation/economy/EconomyEngine';
import { PopulationEngine } from '../simulation/population/PopulationEngine';
import { TrafficEngine } from '../simulation/traffic/TrafficEngine';
import { EventEngine } from '../simulation/environment/EventEngine';
import { ResourceNetwork } from '../simulation/utilities/ResourceNetwork';
import { AIService } from '../ai/AIServiceInterface';
import { GeminiAIService } from '../ai/GeminiAIService';
import { CommandManager } from './CommandManager';
import { GameStateSnapshot, TileSnapshot, GoalSnapshot } from './Snapshot';
import { BuildingType, Grid, TileData, CityStats, AIGoal, NewsItem } from '../../types';
import { GRID_SIZE, INITIAL_MONEY } from '../../constants';

// Professional Core Architecture Framework Imports
import { globalContainer } from './Container';
import { SeededRandomService } from './core/SeededRandom';
import { GameTimeService } from './core/GameTimeService';
import { TelemetryService } from './core/Telemetry';
import { SimulationScheduler } from './core/SimulationScheduler';
import { ResourceRegistry } from './core/ResourceRegistry';
import { TagSystem } from './core/TagSystem';
import { ModifierFramework } from './core/ModifierFramework';
import { RuleEngine } from './core/RuleEngine';
import { ContentRegistry, ContentItem } from './core/ContentRegistry';
import { WorldStateRegistry } from './core/WorldStateRegistry';
import { PathfindingService } from './core/PathfindingService';
import { SpatialPartitioning } from './core/SpatialPartitioning';
import { FeatureFlagService } from './core/FeatureFlag';
import { DomainEventHistorySystem } from './core/DomainEventHistory';
import { SaveMigrationFramework } from './core/SaveMigration';
import { DeterministicReplayFramework } from './core/ReplayFramework';
import { ScenarioFramework, ScenarioDefinition } from './core/ScenarioFramework';
import { HeadlessSimulationEngine } from './core/HeadlessSimulation';
import { AssetStreamingSystem } from './core/AssetStreaming';

/**
 * Centrally authoritative Facade representing the core of the game engine.
 * Connects the legacy simulations (ECS) with the professional data-driven framework.
 */
export class GameKernel {
  private eventBus: EventBus;
  private ecs: ECSManager;
  private economyEngine: EconomyEngine;
  private populationEngine: PopulationEngine;
  private trafficEngine: TrafficEngine;
  private eventEngine: EventEngine;
  private resourceNetwork: ResourceNetwork;
  private aiService: AIService;
  private commandManager: CommandManager;

  // Authorities
  private grid: Grid = [];
  private currentGoal: AIGoal | null = null;
  private newsFeed: NewsItem[] = [];
  private policies: Record<string, boolean> = {
    clean_energy: false,
    tax_cut: false,
    high_tax: false
  };

  // Professional Core Services Private Instances
  private random: SeededRandomService;
  private clock: GameTimeService;
  private telemetry: TelemetryService;
  private scheduler: SimulationScheduler;
  private resources: ResourceRegistry;
  private tags: TagSystem;
  private modifiers: ModifierFramework;
  private ruleEngine: RuleEngine;
  private contentRegistry: ContentRegistry;
  private worldStateRegistry: WorldStateRegistry;
  private pathfinder: PathfindingService;
  private spatialPartitioning: SpatialPartitioning;
  private featureFlags: FeatureFlagService;
  private eventHistory: DomainEventHistorySystem;
  private migrations: SaveMigrationFramework;
  private replayFramework: DeterministicReplayFramework;
  private scenarioFramework: ScenarioFramework;
  private headlessEngine: HeadlessSimulationEngine;
  private assetStreamer: AssetStreamingSystem;

  constructor() {
    this.eventBus = new EventBus();
    this.ecs = new ECSManager();
    this.economyEngine = new EconomyEngine(this.eventBus, this.ecs);
    this.populationEngine = new PopulationEngine(this.eventBus, this.ecs);
    this.trafficEngine = new TrafficEngine(this.eventBus, this.ecs);
    this.eventEngine = new EventEngine(this.eventBus);
    this.resourceNetwork = new ResourceNetwork();
    this.aiService = new GeminiAIService();
    this.commandManager = new CommandManager(this);

    // 1. Instantiate state-of-the-art framework services
    this.random = new SeededRandomService(1337);
    this.clock = new GameTimeService(5); // 5 ticks per calendar day
    this.telemetry = new TelemetryService();
    this.scheduler = new SimulationScheduler(this.telemetry);
    this.resources = new ResourceRegistry();
    this.tags = new TagSystem();
    this.modifiers = new ModifierFramework();
    this.ruleEngine = new RuleEngine(this.resources, this.tags, this.eventBus);
    this.contentRegistry = new ContentRegistry();
    this.worldStateRegistry = new WorldStateRegistry();
    this.pathfinder = new PathfindingService(this.telemetry);
    this.spatialPartitioning = new SpatialPartitioning(5); // 5x5 chunks
    this.featureFlags = new FeatureFlagService();
    this.eventHistory = new DomainEventHistorySystem();
    this.migrations = new SaveMigrationFramework();
    this.replayFramework = new DeterministicReplayFramework();
    this.scenarioFramework = new ScenarioFramework();
    this.headlessEngine = new HeadlessSimulationEngine(this.clock, this.resources, this.scheduler);
    this.assetStreamer = new AssetStreamingSystem();

    // 2. DI container registry enrollment
    this.registerWithDI();

    // 3. Setup default dynamic rules
    this.loadDefaultRules();

    // 4. Hook simulation engines into scheduler priorities
    this.registerScheduledSystems();

    this.initializeGrid();
    this.listenToEvents();

    this.eventHistory.logEvent('system', 'SkyMetropolis Simulation Kernel initialized', this.clock.getTicks());
  }

  /**
   * Enrolls services into the Dependency Injection global system container.
   */
  private registerWithDI(): void {
    globalContainer.register('SeededRandomService', this.random);
    globalContainer.register('GameTimeService', this.clock);
    globalContainer.register('TelemetryService', this.telemetry);
    globalContainer.register('SimulationScheduler', this.scheduler);
    globalContainer.register('ResourceRegistry', this.resources);
    globalContainer.register('TagSystem', this.tags);
    globalContainer.register('ModifierFramework', this.modifiers);
    globalContainer.register('RuleEngine', this.ruleEngine);
    globalContainer.register('ContentRegistry', this.contentRegistry);
    globalContainer.register('WorldStateRegistry', this.worldStateRegistry);
    globalContainer.register('PathfindingService', this.pathfinder);
    globalContainer.register('SpatialPartitioning', this.spatialPartitioning);
    globalContainer.register('FeatureFlagService', this.featureFlags);
    globalContainer.register('DomainEventHistorySystem', this.eventHistory);
    globalContainer.register('SaveMigrationFramework', this.migrations);
    globalContainer.register('DeterministicReplayFramework', this.replayFramework);
    globalContainer.register('ScenarioFramework', this.scenarioFramework);
    globalContainer.register('HeadlessSimulationEngine', this.headlessEngine);
    globalContainer.register('AssetStreamingSystem', this.assetStreamer);
  }

  private loadDefaultRules(): void {
    // Standard rule 1: milestone on population 100
    this.ruleEngine.registerRule({
      id: 'rule_milestone_pop100',
      name: 'Growing Village',
      description: 'Population exceeds 100 metric counts',
      conditions: [{ type: 'RESOURCE', resourceId: 'population', operator: 'gte', value: 100 }],
      effects: [
        { type: 'MODIFY_RESOURCE', resourceId: 'money', value: 5000 },
        { type: 'TRIGGER_NEWS', text: 'Boomtown milestone reached! High density buildings unlocked with +$5000 grant!', newsType: 'positive' },
        { type: 'UNLOCK_BUILDING', buildingType: 'Industrial' }
      ],
      once: true
    });
  }

  private registerScheduledSystems(): void {
    // Wrap and schedule legacy sub-engines within priorities
    this.scheduler.register({
      getName: () => 'EconomyEngine',
      update: (delta) => {
        if (!this.featureFlags.isEnabled('economy_taxes')) return;
        // Sync ledger resources with legacy cash field
        this.economyEngine.setTreasury(this.resources.get('money'));
        this.economyEngine.update(delta, this.policies);
        this.resources.set('money', this.economyEngine.getTreasury());
      }
    }, 10, 1); // priority 10, every tick

    this.scheduler.register({
      getName: () => 'PopulationEngine',
      update: (delta) => {
        this.populationEngine.setPopulation(this.resources.get('population'));
        this.populationEngine.update(delta, this.policies);
        const stats = this.populationEngine.getState();
        this.resources.set('population', stats.population);
        this.resources.set('happiness', stats.averageHappiness);
      }
    }, 20, 1);

    this.scheduler.register({
      getName: () => 'TrafficEngine',
      update: (delta) => {
        if (!this.featureFlags.isEnabled('advanced_traffic_pathing')) return;
        this.trafficEngine.update(delta, this.grid);
      }
    }, 30, 2); // run traffic check every 2nd tick to optimize throughput

    this.scheduler.register({
      getName: () => 'EventEngine',
      update: (delta) => {
        if (!this.featureFlags.isEnabled('simulation_disasters')) return;
        this.eventEngine.update(delta);
      }
    }, 40, 5); // events checked every 5th tick
  }

  // --- Getters ---
  public getEventBus(): EventBus { return this.eventBus; }
  public getECS(): ECSManager { return this.ecs; }
  public getEconomyEngine(): EconomyEngine { return this.economyEngine; }
  public getPopulationEngine(): PopulationEngine { return this.populationEngine; }
  public getTrafficEngine(): TrafficEngine { return this.trafficEngine; }
  public getEventEngine(): EventEngine { return this.eventEngine; }
  public getResourceNetwork(): ResourceNetwork { return this.resourceNetwork; }
  public getAIService(): AIService { return this.aiService; }
  public getCommandManager(): CommandManager { return this.commandManager; }
  public getGrid(): Grid { return this.grid; }
  
  // Refactored JSDoc Getters using new framework registries
  public getStats(): CityStats {
    return {
      money: this.resources.get('money'),
      population: this.resources.get('population'),
      day: this.clock.getCalendarDate().day
    };
  }

  public getPolicies(): Record<string, boolean> { return this.policies; }
  public getCurrentGoal(): AIGoal | null { return this.currentGoal; }
  public getNewsFeed(): NewsItem[] { return this.newsFeed; }

  // --- Professional Core Subsystem Direct Accessor Getters ---
  public getRandom(): SeededRandomService { return this.random; }
  public getClock(): GameTimeService { return this.clock; }
  public getTelemetry(): TelemetryService { return this.telemetry; }
  public getScheduler(): SimulationScheduler { return this.scheduler; }
  public getResources(): ResourceRegistry { return this.resources; }
  public getTags(): TagSystem { return this.tags; }
  public getModifiers(): ModifierFramework { return this.modifiers; }
  public getRuleEngine(): RuleEngine { return this.ruleEngine; }
  public getContentRegistry(): ContentRegistry { return this.contentRegistry; }
  public getWorldStateRegistry(): WorldStateRegistry { return this.worldStateRegistry; }
  public getPathfinder(): PathfindingService { return this.pathfinder; }
  public getSpatialPartitioning(): SpatialPartitioning { return this.spatialPartitioning; }
  public getFeatureFlags(): FeatureFlagService { return this.featureFlags; }
  public getEventHistory(): DomainEventHistorySystem { return this.eventHistory; }
  public getMigrations(): SaveMigrationFramework { return this.migrations; }
  public getReplayFramework(): DeterministicReplayFramework { return this.replayFramework; }
  public getScenarioFramework(): ScenarioFramework { return this.scenarioFramework; }
  public getHeadlessEngine(): HeadlessSimulationEngine { return this.headlessEngine; }
  public getAssetStreamer(): AssetStreamingSystem { return this.assetStreamer; }

  // --- Setup Helpers ---
  private initializeGrid(): void {
    const grid: Grid = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      const row: TileData[] = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        row.push({ x, y, buildingType: BuildingType.None });
      }
      grid.push(row);
    }
    this.grid = grid;
  }

  private listenToEvents(): void {
    this.eventBus.on('news_triggered', (item) => {
      this.newsFeed = [...this.newsFeed.slice(-12), { id: item.id, text: item.text, type: item.type as any }];
      this.eventHistory.logEvent('system', `Dispatch terminal update: ${item.text}`, this.clock.getTicks());
    });
  }

  public triggerGridUpdated(): void {
    this.eventBus.emit('grid_updated', { grid: this.grid });
    this.pathfinder.invalidateCache();
  }

  // --- Core Lifecycle ---
  public tick(): void {
    // 1. Advance centrally authoritative game clock
    const clockProceeded = this.clock.tick();
    if (!clockProceeded) return;

    const tickIndex = this.clock.getTicks();

    // 2. Solve Resource network graph routing
    this.solveResourcesAndInfrastructure();

    // 3. Delegate tick executions to scheduler
    this.scheduler.tick(tickIndex, 1);

    // 4. Update modifier frameworks
    this.modifiers.update(1);

    // 5. Evaluate custom rules and scenarios
    this.ruleEngine.evaluate(tickIndex);

    // 6. Scenario goals updates
    if (this.scenarioFramework.getActiveScenario()) {
      this.scenarioFramework.evaluateStatus((resId) => this.resources.get(resId));
    }

    // 7. Verify AI Objectives completion
    this.checkAIGoals();

    // 8. Commit synchronized snapshot clone into CQRS world state registry
    const snapshot = this.captureSnapshot();
    this.worldStateRegistry.updateState({
      tick: tickIndex,
      stats: snapshot.stats,
      resources: this.resources.getBalances(),
      grid: snapshot.grid,
      newsFeed: snapshot.newsFeed,
      vitals: {
        averageHappiness: snapshot.averageHappiness,
        congestionLevel: snapshot.congestionLevel,
        pollutionLevel: this.resources.get('pollution')
      }
    });

    this.eventBus.emit('tick', { tickCount: tickIndex, delta: 1 });
  }

  private solveResourcesAndInfrastructure(): void {
    this.resourceNetwork.clear();

    // Populate conductive nodes
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const tile = this.grid[y][x];
        if (tile.buildingType !== BuildingType.None) {
          const nodeId = `${x},${y}`;
          
          let isProducer = false;
          let isConsumer = false;
          let cap: Record<string, number> = {};
          let dem: Record<string, number> = {};

          if (tile.buildingType === BuildingType.Industrial) {
            isProducer = true;
            cap = { power: 10, water: 5, sewage: 5, internet: 5, transit: 5 };
          } else if (tile.buildingType === BuildingType.Residential || tile.buildingType === BuildingType.Commercial) {
            isConsumer = true;
            dem = { power: 1, water: 1, sewage: 1, internet: 1, transit: 1 };
          }

          this.resourceNetwork.addNode({
            id: nodeId,
            x,
            y,
            isProducer,
            isConsumer,
            capacity: cap,
            demand: dem
          });
        }
      }
    }

    // Edge connections along adjacent building blocks
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const nodeId = `${x},${y}`;
        if (this.grid[y][x].buildingType !== BuildingType.None) {
          const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
          for (const [dx, dy] of dirs) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
              if (this.grid[ny][nx].buildingType !== BuildingType.None) {
                this.resourceNetwork.addEdge(nodeId, `${nx},${ny}`);
              }
            }
          }
        }
      }
    }

    // BFS network solvers
    this.resourceNetwork.solve('power');
    this.resourceNetwork.solve('water');
    this.resourceNetwork.solve('sewage');
    this.resourceNetwork.solve('internet');
    this.resourceNetwork.solve('transit');

    // Sync supply properties inside ECS Building components
    const buildingEntities = this.ecs.query(['Building']);
    buildingEntities.forEach(eid => {
      const pos = this.ecs.getComponent(eid, 'Position');
      if (pos) {
        const nodeId = `${pos.x},${pos.y}`;
        const consumer = this.ecs.getComponent(eid, 'ResourceConsumer');
        if (consumer) {
          consumer.powerSatisfied = this.resourceNetwork.isNodeSupplied(nodeId, 'power');
          consumer.waterSatisfied = this.resourceNetwork.isNodeSupplied(nodeId, 'water');
        }
      }
    });
  }

  private checkAIGoals(): void {
    if (!this.currentGoal || this.currentGoal.completed) return;

    let buildingCounts: Record<string, number> = {};
    this.grid.flat().forEach(t => {
      if (t.buildingType !== BuildingType.None) {
        buildingCounts[t.buildingType] = (buildingCounts[t.buildingType] || 0) + 1;
      }
    });

    const stats = this.getStats();
    let isMet = false;
    
    if (this.currentGoal.targetType === 'money' && stats.money >= this.currentGoal.targetValue) {
      isMet = true;
    } else if (this.currentGoal.targetType === 'population' && stats.population >= this.currentGoal.targetValue) {
      isMet = true;
    } else if (this.currentGoal.targetType === 'building_count' && this.currentGoal.buildingType) {
      if ((buildingCounts[this.currentGoal.buildingType] || 0) >= this.currentGoal.targetValue) {
        isMet = true;
      }
    }

    if (isMet) {
      this.currentGoal.completed = true;
      this.eventHistory.logEvent('population_milestone', `AI goal fulfilled: "${this.currentGoal.description}"`, this.clock.getTicks());
      this.eventBus.emit('news_triggered', {
        id: (Date.now() + Math.random()).toString(),
        text: `Goal Accomplished! AI Advisor reward is ready: "${this.currentGoal.description}"`,
        type: 'positive'
      });
    }
  }

  public claimAIGoalReward(): void {
    if (this.currentGoal && this.currentGoal.completed) {
      const reward = this.currentGoal.reward;
      this.resources.adjust('money', reward);
      this.currentGoal = null;
      this.eventBus.emit('goal_completed', { reward });
      this.generateNewAIGoal();
    }
  }

  public async generateNewAIGoal(): Promise<void> {
    const fresh = await this.aiService.generateGoal(this.getStats(), this.grid);
    if (fresh) {
      this.currentGoal = fresh;
      this.eventBus.emit('goal_generated', {
        description: fresh.description,
        targetType: fresh.targetType,
        targetValue: fresh.targetValue,
        reward: fresh.reward
      });
    }
  }

  // --- Snapshot Serialization ---
  public captureSnapshot(): GameStateSnapshot {
    const popState = this.populationEngine.getState();
    const trafficState = this.trafficEngine.getState();
    const eventState = this.eventEngine.getState();

    // Estimate entity size from ECS queries
    const activeEntities = this.ecs.query([]).length;
    this.telemetry.setEntityCount(activeEntities);

    const activeSec = this.scenarioFramework.getActiveScenario();

    return {
      stats: this.getStats(),
      grid: this.grid.map(row => row.map(tile => ({ ...tile }))),
      currentGoal: this.currentGoal ? { ...this.currentGoal } : null,
      newsFeed: this.newsFeed.map(n => ({ ...n })),
      policies: { ...this.policies },
      ecsState: this.ecs.serialize(),
      tickCount: this.clock.getTicks(),
      congestionLevel: trafficState.congestionLevel,
      averageHappiness: popState.averageHappiness,
      recentEventName: eventState.recentEventName,
      telemetryReport: this.telemetry.getDiagnosticReport(),
      activeScenarioName: activeSec ? activeSec.name : undefined,
      activeScenarioGoalStatus: activeSec 
        ? activeSec.goals.map(g => `${g.description}: ${g.completed ? 'Success' : 'Active'}`).join(', ')
        : undefined
    };
  }

  public loadSnapshot(snapshot: GameStateSnapshot): void {
    // Save version upgrade migration pipeline
    const migrated = this.migrations.migrate({
      version: 1, // assumes base format, upgrade to target version 2
      payload: snapshot
    });
    
    const upgraded = migrated.payload as GameStateSnapshot;

    // 1. Restore time and seeds
    this.clock.restoreState({
      currentTick: upgraded.tickCount || 0,
      speed: 'NORMAL',
      isTickPaused: false
    });

    // 2. Restore balances
    this.resources.set('money', upgraded.stats?.money !== undefined ? upgraded.stats.money : INITIAL_MONEY);
    this.resources.set('population', upgraded.stats?.population || 0);

    this.economyEngine.setTreasury(this.resources.get('money'));
    this.populationEngine.setPopulation(this.resources.get('population'));

    // 3. Restore grids
    if (upgraded.grid) {
      this.grid = upgraded.grid.map(row => row.map(tile => ({ ...tile })));
    }

    this.currentGoal = upgraded.currentGoal ? { ...upgraded.currentGoal } : null;
    this.newsFeed = upgraded.newsFeed ? upgraded.newsFeed.map(n => ({ ...n })) : [];
    this.policies = upgraded.policies ? { ...upgraded.policies } : { clean_energy: false, tax_cut: false, high_tax: false };

    // 4. Hydrate ECS
    if (upgraded.ecsState) {
      this.ecs.deserialize(upgraded.ecsState);
    }

    this.triggerGridUpdated();
    this.eventHistory.logEvent('system', 'Game state restored from snapshot', this.clock.getTicks());
  }
}
