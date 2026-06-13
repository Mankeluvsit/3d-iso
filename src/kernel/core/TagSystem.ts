/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Universal dynamic tag and classification database. Connects meta-tags to
 * world coordinates, structures, citizen demographics, or policy rules.
 */
export class TagSystem {
  private entityTags = new Map<string, Set<string>>(); // targetId -> set of tags

  /**
   * Applies metadata label to an entity or grid block element.
   */
  public addTag(targetId: string, tag: string): void {
    if (!this.entityTags.has(targetId)) {
      this.entityTags.set(targetId, new Set());
    }
    this.entityTags.get(targetId)!.add(tag);
  }

  /**
   * Batch adds tags to an entity or grid block element.
   */
  public addTags(targetId: string, tags: string[]): void {
    tags.forEach(tag => this.addTag(targetId, tag));
  }

  /**
   * Detaches a label structure.
   */
  public removeTag(targetId: string, tag: string): void {
    const list = this.entityTags.get(targetId);
    if (list) {
      list.delete(tag);
      if (list.size === 0) {
        this.entityTags.delete(targetId);
      }
    }
  }

  /**
   * Asserts whether a target supports a given label.
   */
  public hasTag(targetId: string, tag: string): boolean {
    const list = this.entityTags.get(targetId);
    return list ? list.has(tag) : false;
  }

  /**
   * Matches whether target supports any of the specified tag labels.
   */
  public hasAnyTag(targetId: string, tags: string[]): boolean {
    const list = this.entityTags.get(targetId);
    if (!list) return false;
    return tags.some(tag => list.has(tag));
  }

  /**
   * Matches whether target supports all of the specified tag labels.
   */
  public hasAllTags(targetId: string, tags: string[]): boolean {
    const list = this.entityTags.get(targetId);
    if (!list) return false;
    return tags.every(tag => list.has(tag));
  }

  /**
   * Retrieves all active labels assigned to the target ID.
   */
  public getTags(targetId: string): string[] {
    const list = this.entityTags.get(targetId);
    return list ? Array.from(list) : [];
  }

  /**
   * Queries list of entities possessing a specific tag.
   */
  public queryByTag(tag: string): string[] {
    const results: string[] = [];
    for (const [id, set] of this.entityTags.entries()) {
      if (set.has(tag)) {
        results.push(id);
      }
    }
    return results;
  }

  /**
   * Resets tag mappings.
   */
  public clear(): void {
    this.entityTags.clear();
  }
}
