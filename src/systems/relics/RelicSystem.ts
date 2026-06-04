import { eventBus, GameEvents, type GameEventName } from '@/core/EventBus';
import { getRelic } from '@/core/registries/RelicRegistry';
import type { GameState, RelicDefinition, RelicTrigger } from '@/entities';

const EVENT_TO_TRIGGER: Partial<Record<GameEventName, RelicTrigger>> = {
  [GameEvents.BATTLE_START]: 'battle_start',
  [GameEvents.TURN_START]: 'turn_start',
  [GameEvents.TURN_END]: 'turn_end',
  [GameEvents.CARD_PLAYED]: 'on_play_card',
  [GameEvents.CARD_DRAWN]: 'on_draw',
  [GameEvents.CARD_DISCARDED]: 'on_discard',
  [GameEvents.DAMAGE_TAKEN]: 'on_damage_taken',
  [GameEvents.DAMAGE_DEALT]: 'on_damage_dealt',
  [GameEvents.ENEMY_KILLED]: 'on_kill',
  [GameEvents.ENTER_SHOP]: 'on_enter_shop',
  [GameEvents.REWARD_GAINED]: 'on_reward',
};

interface RelicEventPayload {
  definition?: { type?: string };
  [key: string]: unknown;
}

export function dispatchRelicEvent(
  state: GameState,
  event: GameEventName,
  payload: RelicEventPayload = {},
): GameState {
  eventBus.emit(event, payload);

  const trigger = EVENT_TO_TRIGGER[event];
  if (!trigger) return state;

  return state.relics.reduce((next, relicInstance) => {
    const relic = getRelic(relicInstance.definitionId);
    if (!relic || relic.trigger !== trigger) return next;
    return applyRelic(next, relic, payload);
  }, state);
}

function applyRelic(
  state: GameState,
  relic: RelicDefinition,
  payload: RelicEventPayload,
): GameState {
  if (relic.effect.custom === 'skill_threshold') {
    if (payload.definition?.type !== 'skill') return state;
    const played = state.combat?.skillCardsPlayedThisTurn ?? 0;
    if (played === 0 || played % 2 !== 0) return state;
  }

  const value = relic.effect.value ?? 0;
  switch (relic.effect.target) {
    case 'energy':
      return recordActivation({ ...state, energy: state.energy + value }, relic, `+${value} energy`);
    case 'block':
      if (!state.combat) return state;
      return recordActivation(
        {
          ...state,
          combat: { ...state.combat, playerBlock: state.combat.playerBlock + value },
        },
        relic,
        `+${value} block`,
      );
    case 'gold':
      return recordActivation({ ...state, gold: state.gold + value }, relic, `+${value} gold`);
    default:
      return state;
  }
}

function recordActivation(state: GameState, relic: RelicDefinition, effectText: string): GameState {
  return {
    ...state,
    recentRelicActivations: [
      {
        relicId: relic.id,
        name: relic.name,
        message: `${relic.name}: ${effectText}`,
      },
      ...state.recentRelicActivations,
    ].slice(0, 5),
  };
}
