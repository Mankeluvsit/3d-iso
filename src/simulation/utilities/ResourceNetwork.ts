/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ResourceType = 'power' | 'water' | 'sewage' | 'internet' | 'transit' | string;

export interface GraphNode {
  id: string; // "x,y" coordinates or entity ID
  x: number;
  y: number;
  isProducer: boolean;
  isConsumer: boolean;
  capacity?: Record<ResourceType, number>; // capacity provided if producer
  demand?: Record<ResourceType, number>;   // demand required if consumer
  supplied?: Record<ResourceType, boolean>; // resolved supplies
}

export class ResourceNetwork {
  private nodes = new Map<string, GraphNode>();
  private adjacencyList = new Map<string, Set<string>>();

  public clear(): void {
    this.nodes.clear();
    this.adjacencyList.clear();
  }

  public addNode(node: GraphNode): void {
    this.nodes.set(node.id, {
      ...node,
      supplied: node.supplied || {} as Record<ResourceType, boolean>
    });
    if (!this.adjacencyList.has(node.id)) {
      this.adjacencyList.set(node.id, new Set());
    }
  }

  public addEdge(node1Id: string, node2Id: string): void {
    if (!this.adjacencyList.has(node1Id)) this.adjacencyList.set(node1Id, new Set());
    if (!this.adjacencyList.has(node2Id)) this.adjacencyList.set(node2Id, new Set());
    
    this.adjacencyList.get(node1Id)!.add(node2Id);
    this.adjacencyList.get(node2Id)!.add(node1Id);
  }

  /**
   * Propagates flows from producer nodes to consumers through conductive links (e.g., roads, connectors)
   */
  public solve(resource: ResourceType): void {
    // 1. Reset supplied states for this resource
    for (const node of this.nodes.values()) {
      if (!node.supplied) node.supplied = {};
      node.supplied[resource] = false;
    }

    // 2. Identify all producers with active capacity for this resource
    const producers = Array.from(this.nodes.values()).filter(
      n => n.isProducer && n.capacity && n.capacity[resource] && n.capacity[resource] > 0
    );

    // Sort power / water bases or producers to loop through them
    for (const producer of producers) {
      let remainingSupply = producer.capacity![resource];
      
      // Run a Breath-First-Search (BFS) from this producer node to find connected consumer nodes
      const visited = new Set<string>();
      const queue: string[] = [producer.id];
      visited.add(producer.id);

      // mark producer itself supplied
      producer.supplied![resource] = true;

      while (queue.length > 0 && remainingSupply > 0) {
        const currentId = queue.shift()!;
        const currentNode = this.nodes.get(currentId)!;

        // If current is a consumer that is not yet fully met, satisfy its request
        if (currentNode.isConsumer && currentNode.demand && currentNode.demand[resource]) {
          const req = currentNode.demand[resource];
          if (!currentNode.supplied![resource]) {
            if (remainingSupply >= req) {
              currentNode.supplied![resource] = true;
              remainingSupply -= req;
            }
          }
        }

        // Traverse neighbors
        const neighbors = this.adjacencyList.get(currentId);
        if (neighbors) {
          for (const neighborId of neighbors) {
            if (!visited.has(neighborId)) {
              visited.add(neighborId);
              queue.push(neighborId);
            }
          }
        }
      }
    }
  }

  /**
   * Helper to inspect supply verification states
   */
  public isNodeSupplied(id: string, resource: ResourceType): boolean {
    const node = this.nodes.get(id);
    return node ? !!node.supplied?.[resource] : false;
  }

  public getNodes(): GraphNode[] {
    return Array.from(this.nodes.values());
  }
}
