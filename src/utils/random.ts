import type { CardInstance } from '@/entities';

let counter = 0;

export function createInstanceId(prefix: string): string {
  counter += 1;
  return `${prefix}_${counter}_${Date.now()}`;
}

export function createCardInstance(definitionId: string, upgraded = false): CardInstance {
  return {
    instanceId: createInstanceId('card'),
    definitionId,
    upgraded,
  };
}

export function createDeckFromDefinitionIds(ids: string[]): CardInstance[] {
  return ids.map((id) => createCardInstance(id));
}

/** Fisher-Yates 洗牌 */
export function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function pickRandom<T>(array: T[], count: number): T[] {
  return shuffle(array).slice(0, count);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
