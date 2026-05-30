import type { PotionDefinition } from '@/entities';

const registry = new Map<string, PotionDefinition>();

export function registerPotion(potion: PotionDefinition): void {
  registry.set(potion.id, potion);
}

export function registerPotions(potions: PotionDefinition[]): void {
  potions.forEach(registerPotion);
}

export function getPotion(id: string): PotionDefinition | undefined {
  return registry.get(id);
}

export function getAllPotions(): PotionDefinition[] {
  return Array.from(registry.values());
}

export function pickRandomPotion(): PotionDefinition | undefined {
  const pool = getAllPotions();
  if (pool.length === 0) return undefined;
  return pool[Math.floor(Math.random() * pool.length)];
}
