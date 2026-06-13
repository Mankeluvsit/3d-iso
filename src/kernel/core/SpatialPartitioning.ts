/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SpatialEntity {
  id: string;
  x: number;
  y: number;
  type: string;
}

/**
 * High performance spatial chunk grid partitioning structure.
 * Accelerates close proximity queries, citizen selection, utilities coverage, and traffic checks.
 */
export class SpatialPartitioning {
  private chunks = new Map<string, SpatialEntity[]>();

  constructor(private chunkSize: number = 5) {}

  /**
   * Computes key for coordinate hash.
   */
  private getChunkKey(x: number, y: number): string {
    const cx = Math.floor(x / this.chunkSize);
    const cy = Math.floor(y / this.chunkSize);
    return `${cx}:${cy}`;
  }

  /**
   * Enrolls an entity geographically inside target chunk bounds.
   */
  public register(entity: SpatialEntity): void {
    const key = this.getChunkKey(entity.x, entity.y);
    if (!this.chunks.has(key)) {
      this.chunks.set(key, []);
    }
    this.chunks.get(key)!.push(entity);
  }

  /**
   * Discards an registered item from local chunk grids.
   */
  public deregister(entityId: string, x: number, y: number): void {
    const key = this.getChunkKey(x, y);
    const list = this.chunks.get(key);
    if (list) {
      this.chunks.set(key, list.filter(e => e.id !== entityId));
    }
  }

  /**
   * Moves an registered item to another geographic coordinate hash.
   */
  public move(entity: SpatialEntity, oldX: number, oldY: number): void {
    this.deregister(entity.id, oldX, oldY);
    this.register(entity);
  }

  /**
   * Retrieves all registered elements sitting inside a custom distance radius.
   * Query limits check only candidate grids instead of full coordinate matrix.
   * @param x - Center coordinate X
   * @param y - Center coordinate Y
   * @param radius - Search radius limit
   */
  public queryRange(x: number, y: number, radius: number): SpatialEntity[] {
    const minCx = Math.floor((x - radius) / this.chunkSize);
    const maxCx = Math.floor((x + radius) / this.chunkSize);
    const minCy = Math.floor((y - radius) / this.chunkSize);
    const maxCy = Math.floor((y + radius) / this.chunkSize);

    const matches: SpatialEntity[] = [];

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const key = `${cx}:${cy}`;
        const chunk = this.chunks.get(key);
        if (chunk) {
          for (const entity of chunk) {
            const dx = entity.x - x;
            const dy = entity.y - y;
            if (dx * dx + dy * dy <= radius * radius) {
              matches.push(entity);
            }
          }
        }
      }
    }

    return matches;
  }

  /**
   * Flushes spatial allocations.
   */
  public clear(): void {
    this.chunks.clear();
  }
}
