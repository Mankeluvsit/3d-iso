/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AssetMetadata {
  id: string;
  type: 'model' | 'texture' | 'audio' | 'ui';
  estimatedBytes: number;
}

/**
 * Lazily loads models, texture files, audio profiles, and visual UI overlays.
 * Track memory allocations against customizable budgets, and unloads assets iteratively.
 */
export class AssetStreamingSystem {
  private loadedAssets = new Map<string, { meta: AssetMetadata; asset: any }>();
  private currentAllocationBytes: number = 0;

  constructor(private maxMemoryAllocationBytes: number = 250 * 1024 * 1024) {} // Default 250MB size capacity budget

  /**
   * Safe fetch of graphics or sounds. Loads asset dynamically, unloading
   * other files if current memory allocation goes past custom budget sizes.
   */
  public async loadAsset<T>(meta: AssetMetadata, loadFn: () => Promise<T>): Promise<T> {
    if (this.loadedAssets.has(meta.id)) {
      return this.loadedAssets.get(meta.id)!.asset as T;
    }

    // Allocate memory and auto-purge elements if capacity limits are breached
    this.ensureBudgetCapacity(meta.estimatedBytes);

    const asset = await loadFn();
    this.loadedAssets.set(meta.id, { meta, asset });
    this.currentAllocationBytes += meta.estimatedBytes;

    return asset;
  }

  /**
   * Force unloads an asset by key, freeing allocated memory.
   */
  public unloadAsset(id: string): void {
    const record = this.loadedAssets.get(id);
    if (record) {
      this.currentAllocationBytes -= record.meta.estimatedBytes;
      this.loadedAssets.delete(id);
    }
  }

  private ensureBudgetCapacity(incomingBytes: number): void {
    if (this.currentAllocationBytes + incomingBytes <= this.maxMemoryAllocationBytes) {
      return;
    }

    // Select oldest loaded assets to unload
    const items = Array.from(this.loadedAssets.entries());
    for (const [id, item] of items) {
      if (this.currentAllocationBytes + incomingBytes <= this.maxMemoryAllocationBytes) {
        break;
      }
      console.log(`[AssetStreaming] Evicting asset ID: ${id} to fit memory budgets`);
      this.unloadAsset(id);
    }
  }

  /**
   * Checks current estimated byte count allocated by system elements.
   */
  public getAllocatedBytes(): number {
    return this.currentAllocationBytes;
  }

  /**
   * Flushes asset stream.
   */
  public clear(): void {
    this.loadedAssets.clear();
    this.currentAllocationBytes = 0;
  }
}
