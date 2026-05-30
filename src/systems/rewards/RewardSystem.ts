import type { GameState } from '@/entities';
import { createCardInstance } from '@/utils/random';
import { eventBus, GameEvents } from '@/core/EventBus';

export function applyGoldReward(state: GameState, amount: number): GameState {
  return { ...state, gold: state.gold + amount };
}

export function addCardToDeck(state: GameState, cardDefinitionId: string): GameState {
  return {
    ...state,
    deck: [...state.deck, createCardInstance(cardDefinitionId)],
  };
}

export function removeCardFromDeck(state: GameState, instanceId: string): GameState {
  return {
    ...state,
    deck: state.deck.filter((c) => c.instanceId !== instanceId),
  };
}

export function addRelic(state: GameState, relicDefinitionId: string): GameState {
  return {
    ...state,
    relics: [...state.relics, { definitionId: relicDefinitionId }],
  };
}

export function addPotion(state: GameState, potionDefinitionId: string): GameState {
  if (state.potions.length >= 3) return state;
  return {
    ...state,
    potions: [...state.potions, { definitionId: potionDefinitionId }],
  };
}

export function claimReward(state: GameState, selectedCardId?: string): GameState {
  if (!state.pendingReward) return state;

  let next = applyGoldReward(state, state.pendingReward.gold);

  if (selectedCardId) {
    next = addCardToDeck(next, selectedCardId);
  }
  if (state.pendingReward.potionDrop) {
    next = addPotion(next, state.pendingReward.potionDrop);
  }
  if (state.pendingReward.relicDrop) {
    next = addRelic(next, state.pendingReward.relicDrop);
  }

  eventBus.emit(GameEvents.REWARD_GAINED, { reward: state.pendingReward });

  return {
    ...next,
    phase: 'map',
    pendingReward: null,
  };
}

export function skipCardReward(state: GameState): GameState {
  return claimReward(state);
}
