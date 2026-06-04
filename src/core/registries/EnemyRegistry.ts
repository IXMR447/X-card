import type { EnemyDefinition, EnemyTier } from '@/entities';

const registry = new Map<string, EnemyDefinition>();

export function registerEnemy(enemy: EnemyDefinition): void {
  registry.set(enemy.id, enemy);
}

export function registerEnemies(enemies: EnemyDefinition[]): void {
  enemies.forEach(registerEnemy);
}

export function getEnemy(id: string): EnemyDefinition | undefined {
  return registry.get(id);
}

export function getEnemiesByTier(tier: EnemyTier): EnemyDefinition[] {
  return Array.from(registry.values()).filter((e) => e.tier === tier);
}

export function getAllEnemies(): EnemyDefinition[] {
  return Array.from(registry.values());
}

export function pickRandomEnemy(tier: EnemyTier, exclude: string[] = []): EnemyDefinition | undefined {
  const pool = getEnemiesByTier(tier).filter((e) => !exclude.includes(e.id));
  if (pool.length === 0) return undefined;
  return pool[Math.floor(Math.random() * pool.length)];
}
