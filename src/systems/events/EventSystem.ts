import type { GameState } from '@/entities';
import { getEvent, getOutcome } from '@/core/registries/EventRegistry';
import {
  applyGoldReward,
  addCardToDeck,
  addRelic,
  addPotion,
  removeCardFromDeck,
} from '@/systems/rewards/RewardSystem';
import { pickRandom } from '@/utils/random';
import { getCardRewardPool } from '@/core/registries/CardRegistry';
import { getRelicRewardPool } from '@/core/registries/RelicRegistry';
import { pickRandomPotion } from '@/core/registries/PotionRegistry';
import { upgradeCardAtCampfire } from '@/systems/campfire/CampfireSystem';

export function enterEvent(state: GameState, eventId: string): GameState {
  return { ...state, phase: 'event', currentEventId: eventId };
}

export function resolveEventChoice(state: GameState, outcomeIds: string[]): GameState {
  let next = { ...state };

  for (const outcomeId of outcomeIds) {
    const outcome = getOutcome(outcomeId);
    if (!outcome) continue;
    next = applyOutcome(next, outcome);
  }

  return { ...next, phase: 'map', currentEventId: null };
}

function applyOutcome(state: GameState, outcome: import('@/entities').EventOutcome): GameState {
  switch (outcome.type) {
    case 'gain_gold':
      return applyGoldReward(state, Number(outcome.value ?? 0));
    case 'lose_gold':
      return { ...state, gold: Math.max(0, state.gold - Number(outcome.value ?? 0)) };
    case 'gain_hp':
      return { ...state, hp: Math.min(state.maxHp, state.hp + Number(outcome.value ?? 0)) };
    case 'lose_hp':
      return { ...state, hp: Math.max(0, state.hp - Number(outcome.value ?? 0)) };
    case 'gain_card': {
      const pool = getCardRewardPool(state.characterId);
      const card = pickRandom(pool, 1)[0];
      return card ? addCardToDeck(state, card.id) : state;
    }
    case 'lose_card': {
      if (state.deck.length === 0) return state;
      const toRemove = state.deck[Math.floor(Math.random() * state.deck.length)];
      return removeCardFromDeck(state, toRemove.instanceId);
    }
    case 'gain_relic': {
      const pool = getRelicRewardPool(state.relics.map((r) => r.definitionId));
      const relic = pickRandom(pool, 1)[0];
      return relic ? addRelic(state, relic.id) : state;
    }
    case 'gain_potion': {
      const potion = pickRandomPotion();
      return potion ? addPotion(state, potion.id) : state;
    }
    case 'upgrade_random_card': {
      const upgradeable = state.deck.filter((c) => !c.upgraded);
      if (upgradeable.length === 0) return state;
      const target = upgradeable[Math.floor(Math.random() * upgradeable.length)];
      return upgradeCardAtCampfire(state, target.instanceId);
    }
    default:
      return state;
  }
}

export function leaveEvent(state: GameState): GameState {
  return { ...state, phase: 'map', currentEventId: null };
}

export function getCurrentEvent(state: GameState) {
  if (!state.currentEventId) return undefined;
  return getEvent(state.currentEventId);
}
