import type { GameState } from '@/entities';
import { CAMPFIRE } from '@/core/constants';
import { getCard } from '@/core/registries/CardRegistry';

export type CampfireAction = 'rest' | 'upgrade';

export function enterCampfire(state: GameState): GameState {
  return { ...state, phase: 'campfire' };
}

export function restAtCampfire(state: GameState): GameState {
  const heal = Math.floor(state.maxHp * CAMPFIRE.HEAL_RATIO);
  return {
    ...state,
    hp: Math.min(state.maxHp, state.hp + heal),
    phase: 'map',
  };
}

export function upgradeCardAtCampfire(state: GameState, instanceId: string): GameState {
  const card = state.deck.find((c) => c.instanceId === instanceId);
  if (!card || card.upgraded) return state;
  const def = getCard(card.definitionId);
  if (!def?.upgrade) return state;

  const deck = state.deck.map((c) =>
    c.instanceId === instanceId ? { ...c, upgraded: true } : c
  );
  return { ...state, deck, phase: 'map' };
}

export function getUpgradeableCards(state: GameState): string[] {
  return state.deck
    .filter((c) => {
      if (c.upgraded) return false;
      const def = getCard(c.definitionId);
      return !!def?.upgrade;
    })
    .map((c) => c.instanceId);
}
