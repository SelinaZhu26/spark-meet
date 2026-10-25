/** A stable number for a string, so the same spark always gets the same art. */
export function seedOf(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function pick<T>(seed: number, items: readonly T[]): T {
  return items[seed % items.length];
}
