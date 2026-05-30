import type { CharacterDefinition } from '@/entities';

const registry = new Map<string, CharacterDefinition>();

export function registerCharacter(character: CharacterDefinition): void {
  registry.set(character.id, character);
}

export function getCharacter(id: string): CharacterDefinition | undefined {
  return registry.get(id);
}

export function getAllCharacters(): CharacterDefinition[] {
  return Array.from(registry.values());
}
