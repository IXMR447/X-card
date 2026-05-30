import type { RelicDefinition } from '@/entities';

const registry = new Map<string, RelicDefinition>();

export function registerRelic(relic: RelicDefinition): void {
  registry.set(relic.id, relic);
}

export function registerRelics(relics: RelicDefinition[]): void {
  relics.forEach(registerRelic);
}

export function getRelic(id: string): RelicDefinition | undefined {
  return registry.get(id);
}

export function getAllRelics(): RelicDefinition[] {
  return Array.from(registry.values());
}

export function getRelicRewardPool(excludeIds: string[] = []): RelicDefinition[] {
  return getAllRelics().filter(
    (r) => r.rarity !== 'starter' && r.rarity !== 'boss' && !excludeIds.includes(r.id)
  );
}

export function getBossRelicPool(): RelicDefinition[] {
  return getAllRelics().filter((r) => r.rarity === 'boss' || r.rarity === 'rare');
}
