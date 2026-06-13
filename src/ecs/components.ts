/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BuildingType } from '../../types';

export interface PositionComponent {
  x: number;
  y: number;
}

export interface EmploymentComponent {
  hasJob: boolean;
  workplaceEntityId?: string;
  salary: number;
}

export interface TrafficComponent {
  route: { x: number; y: number }[];
  progress: number;
  speed: number;
  originX: number;
  originY: number;
  targetX: number;
  targetY: number;
}

export interface HappinessComponent {
  rating: number; // 0-100
  factorWork: number;
  factorEnvironment: number;
}

export interface ResourceConsumerComponent {
  powerConsumer: boolean;
  waterConsumer: boolean;
  powerSatisfied: boolean;
  waterSatisfied: boolean;
  sewageConsumer: boolean;
  internetConsumer: boolean;
}

export interface ResourceProducerComponent {
  powerProducer: boolean;
  waterProducer: boolean;
  sewageProducer: boolean;
  internetProducer: boolean;
  capacity: number;
  supplyLeft: number;
}

export interface BuildingComponent {
  type: BuildingType;
  cost: number;
  age: number;
}

export interface ComponentMap {
  Position: PositionComponent;
  Employment: EmploymentComponent;
  Traffic: TrafficComponent;
  Happiness: HappinessComponent;
  ResourceConsumer: ResourceConsumerComponent;
  ResourceProducer: ResourceProducerComponent;
  Building: BuildingComponent;
}

export type ComponentName = keyof ComponentMap;
