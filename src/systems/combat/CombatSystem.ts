import type { CardEffect, CombatState, CombatType, GameState, RewardState } from '@/entities';
import { GAME, REWARD_GOLD } from '@/core/constants';
import { eventBus, GameEvents } from '@/core/EventBus';
import { dispatchRelicEvent } from '@/systems/relics/RelicSystem';
import {
  getCard,
  getCardCost,
  getCardEffects,
} from '@/core/registries/CardRegistry';
import { getEnemy } from '@/core/registries/EnemyRegistry';
import {
  createInstanceId,
  shuffle,
  randomInt,
  pickRandom,
} from '@/utils/random';
import { getCardRewardPool } from '@/core/registries/CardRegistry';
import { pickRandomPotion } from '@/core/registries/PotionRegistry';
import { getBossRelicPool, getRelicRewardPool } from '@/core/registries/RelicRegistry';
import { markCollected } from '@/systems/collection/CollectionSystem';

const TEMPORARY_STATUSES = new Set(['vulnerable', 'weak', 'frail']);
const PLAYER_TURN_START_DECAY = new Set(['burn']);

function getStatusValue(statuses: Map<string, number> | undefined, id: string): number {
  return statuses?.get(id) ?? 0;
}

function setStatus(statuses: Map<string, number>, id: string, stacks: number): Map<string, number> {
  const next = new Map(statuses);
  if (stacks <= 0) {
    next.delete(id);
  } else {
    next.set(id, stacks);
  }
  return next;
}

function addStatus(statuses: Map<string, number>, id: string, stacks: number): Map<string, number> {
  return setStatus(statuses, id, getStatusValue(statuses, id) + stacks);
}

function decayStatuses(
  statuses: Map<string, number>,
  ids: Set<string> = TEMPORARY_STATUSES,
): Map<string, number> {
  let next = new Map(statuses);
  for (const id of ids) {
    const stacks = getStatusValue(next, id);
    if (stacks > 0) {
      next = setStatus(next, id, stacks - 1);
    }
  }
  return next;
}

function calculateDamage(
  baseDamage: number,
  attackerStatuses: Map<string, number> | undefined,
  defenderStatuses: Map<string, number> | undefined,
): number {
  let damage = baseDamage + getStatusValue(attackerStatuses, 'strength');
  if (getStatusValue(attackerStatuses, 'weak') > 0) {
    damage = Math.floor(damage * 0.75);
  }
  if (getStatusValue(defenderStatuses, 'vulnerable') > 0) {
    damage = Math.floor(damage * 1.5);
  }
  return Math.max(0, damage);
}

function calculateBlock(baseBlock: number, statuses: Map<string, number> | undefined): number {
  let block = baseBlock + getStatusValue(statuses, 'dexterity');
  if (getStatusValue(statuses, 'frail') > 0) {
    block = Math.floor(block * 0.75);
  }
  return Math.max(0, block);
}

function effectRequiresEnemyTarget(effects: CardEffect): boolean {
  return Boolean(
    effects.damage ||
      effects.applyStatus?.target === 'enemy' ||
      effects.applyStatus?.target === 'all_enemies',
  );
}

function hasLiveTarget(state: GameState, targetEnemyId: string | undefined): boolean {
  if (!targetEnemyId || !state.combat) return false;
  return state.combat.enemies.some((enemy) => enemy.instanceId === targetEnemyId && enemy.hp > 0);
}

export function startCombat(state: GameState, type: CombatType, enemyIds: string[]): GameState {
  markCollected('enemies', enemyIds);
  const enemies = enemyIds.map((id) => {
    const def = getEnemy(id);
    if (!def) throw new Error(`Enemy not found: ${id}`);
    return {
      instanceId: createInstanceId('enemy'),
      definitionId: id,
      hp: def.maxHp,
      block: 0,
      moveIndex: 0,
      statuses: new Map(def.initialStatuses?.map((s) => [s.id, s.stacks]) ?? []),
    };
  });

  const drawPile = shuffle([...state.deck]);
  const combat: CombatState = {
    type,
    turn: 1,
    drawPile,
    hand: [],
    discardPile: [],
    exhaustPile: [],
    enemies,
    playerBlock: 0,
    playerStatuses: new Map(),
    cardsPlayedThisTurn: 0,
    skillCardsPlayedThisTurn: 0,
  };

  let next: GameState = { ...state, phase: 'combat', combat, energy: state.maxEnergy };
  next = preparePlayerTurn(next);
  next = dispatchRelicEvent(next, GameEvents.BATTLE_START, { type });
  next = dispatchRelicEvent(next, GameEvents.TURN_START, { turn: next.combat?.turn });
  return drawCards(next, GAME.DRAW_PER_TURN);
}

function startPlayerTurn(state: GameState): GameState {
  const next = preparePlayerTurn(state);
  return dispatchRelicEvent(next, GameEvents.TURN_START, { turn: next.combat?.turn });
}

function preparePlayerTurn(state: GameState): GameState {
  if (!state.combat) return state;
  let hp = state.hp;
  let statuses = new Map(state.combat.playerStatuses);
  const burn = getStatusValue(statuses, 'burn');
  if (burn > 0) {
    hp = Math.max(0, hp - burn);
    eventBus.emit(GameEvents.DAMAGE_TAKEN, { damage: burn });
  }
  statuses = decayStatuses(statuses, PLAYER_TURN_START_DECAY);
  const playerBlock = getStatusValue(statuses, 'auto_block');

  return {
    ...state,
    hp,
    energy: state.maxEnergy,
    combat: {
      ...state.combat,
      playerBlock,
      playerStatuses: statuses,
      cardsPlayedThisTurn: 0,
      skillCardsPlayedThisTurn: 0,
    },
  };
}

function drawCards(state: GameState, count: number): GameState {
  if (!state.combat) return state;
  let { drawPile, discardPile, hand } = state.combat;
  const drawn = [];

  for (let i = 0; i < count; i++) {
    if (drawPile.length === 0) {
      if (discardPile.length === 0) break;
      drawPile = shuffle(discardPile);
      discardPile = [];
    }
    const card = drawPile.pop();
    if (card) {
      drawn.push(card);
      hand = [...hand, card];
      eventBus.emit(GameEvents.CARD_DRAWN, { card });
    }
  }

  return {
    ...state,
    combat: { ...state.combat, drawPile, discardPile, hand },
  };
}

export function playCard(state: GameState, cardInstanceId: string, targetEnemyId?: string): GameState {
  if (!state.combat || state.phase !== 'combat') return state;

  const handIndex = state.combat.hand.findIndex((c) => c.instanceId === cardInstanceId);
  if (handIndex === -1) return state;

  const cardInst = state.combat.hand[handIndex];
  const cardDef = getCard(cardInst.definitionId);
  if (!cardDef) return state;

  const cost = getCardCost(cardDef, cardInst.upgraded);
  if (state.energy < cost) return state;

  const effects = getCardEffects(cardDef, cardInst.upgraded);
  if (effectRequiresEnemyTarget(effects) && !hasLiveTarget(state, targetEnemyId)) return state;

  markCollected('cards', cardDef.id);

  let next: GameState = {
    ...state,
    energy: state.energy - cost,
    combat: {
      ...state.combat,
      hand: state.combat.hand.filter((c) => c.instanceId !== cardInstanceId),
      cardsPlayedThisTurn: state.combat.cardsPlayedThisTurn + 1,
      skillCardsPlayedThisTurn:
        state.combat.skillCardsPlayedThisTurn + (cardDef.type === 'skill' ? 1 : 0),
    },
    stats: { ...state.stats, cardsPlayed: state.stats.cardsPlayed + 1 },
  };

  next = applyCardEffects(next, effects, targetEnemyId);

  if (cardDef.exhaust) {
    next = {
      ...next,
      combat: { ...next.combat!, exhaustPile: [...next.combat!.exhaustPile, cardInst] },
    };
  } else {
    eventBus.emit(GameEvents.CARD_DISCARDED, { card: cardInst });
    next = {
      ...next,
      combat: { ...next.combat!, discardPile: [...next.combat!.discardPile, cardInst] },
    };
  }

  next = dispatchRelicEvent(next, GameEvents.CARD_PLAYED, { card: cardInst, definition: cardDef });
  next = removeDeadEnemies(next);

  if (isCombatWon(next)) {
    return endCombat(next, true);
  }

  return next;
}

function applyCardEffects(state: GameState, effects: CardEffect, targetEnemyId?: string): GameState {
  if (!state.combat) return state;
  let next = state;

  if (effects.damage && targetEnemyId) {
    const hits = effects.hits ?? 1;
    for (let i = 0; i < hits; i += 1) {
      next = dealDamageToEnemy(next, targetEnemyId, effects.damage);
    }
  }

  if (effects.block) {
    if (!next.combat) return next;
    const block = calculateBlock(effects.block, next.combat.playerStatuses);
    next = {
      ...next,
      combat: { ...next.combat, playerBlock: next.combat.playerBlock + block },
    };
  }

  if (effects.applyStatus) {
    next = applyCardStatus(next, effects.applyStatus, targetEnemyId);
  }

  if (effects.custom) {
    next = applyCustomCardEffect(next, effects.custom);
  }

  if (effects.draw) {
    next = drawCards(next, effects.draw);
  }

  if (effects.energy) {
    next = { ...next, energy: next.energy + effects.energy };
  }

  return next;
}

function applyCardStatus(
  state: GameState,
  status: NonNullable<CardEffect['applyStatus']>,
  targetEnemyId?: string,
): GameState {
  if (!state.combat) return state;
  if (status.target === 'self') {
    return {
      ...state,
      combat: {
        ...state.combat,
        playerStatuses: addStatus(state.combat.playerStatuses, status.id, status.stacks),
      },
    };
  }

  const enemies = state.combat.enemies.map((enemy) => {
    const shouldApply =
      status.target === 'all_enemies' || (status.target === 'enemy' && enemy.instanceId === targetEnemyId);
    return shouldApply
      ? { ...enemy, statuses: addStatus(enemy.statuses, status.id, status.stacks) }
      : enemy;
  });
  return { ...state, combat: { ...state.combat, enemies } };
}

function applyCustomCardEffect(state: GameState, custom: string): GameState {
  if (!state.combat) return state;
  const autoBlockMatch = custom.match(/^gain_block_each_turn_(\d+)$/);
  if (autoBlockMatch) {
    const amount = Number(autoBlockMatch[1]);
    return {
      ...state,
      combat: {
        ...state.combat,
        playerStatuses: addStatus(state.combat.playerStatuses, 'auto_block', amount),
      },
    };
  }
  return state;
}

function dealDamageToEnemy(state: GameState, enemyId: string, damage: number): GameState {
  if (!state.combat) return state;
  const enemies = state.combat.enemies.map((e) => {
    if (e.instanceId !== enemyId) return e;
    let remaining = calculateDamage(damage, state.combat?.playerStatuses, e.statuses);
    let block = e.block;
    if (block > 0) {
      const blocked = Math.min(block, remaining);
      block -= blocked;
      remaining -= blocked;
    }
    const hp = Math.max(0, e.hp - remaining);
    if (hp === 0) {
      eventBus.emit(GameEvents.ENEMY_KILLED, { enemy: e });
    }
    eventBus.emit(GameEvents.DAMAGE_DEALT, { damage: remaining, target: e });
    return { ...e, hp, block };
  });
  return { ...state, combat: { ...state.combat, enemies } };
}

function removeDeadEnemies(state: GameState): GameState {
  if (!state.combat) return state;
  return {
    ...state,
    combat: {
      ...state.combat,
      enemies: state.combat.enemies.filter((e) => e.hp > 0),
    },
  };
}

export function endPlayerTurn(state: GameState): GameState {
  if (!state.combat) return state;

  // 寮冩帀鎵嬬墝
  const discardedHand = state.combat.hand;
  let next: GameState = {
    ...state,
    combat: {
      ...state.combat,
      discardPile: [...state.combat.discardPile, ...state.combat.hand],
      hand: [],
      playerStatuses: decayStatuses(state.combat.playerStatuses),
    },
  };
  discardedHand.forEach((c) => eventBus.emit(GameEvents.CARD_DISCARDED, { card: c }));

  // 鏁屼汉琛屽姩
  next = executeEnemyTurn(next);

  if (next.hp <= 0) {
    return { ...next, phase: 'game_over', combat: null };
  }

  if (isCombatWon(next)) {
    return endCombat(next, true);
  }

  // 鏂板洖鍚?
  const combat = { ...next.combat!, turn: next.combat!.turn + 1 };
  next = { ...next, combat, energy: next.maxEnergy };
  next = startPlayerTurn(next);
  if (next.hp <= 0) {
    return { ...next, phase: 'game_over', combat: null };
  }
  return drawCards(next, GAME.DRAW_PER_TURN);
}

function executeEnemyTurn(state: GameState): GameState {
  if (!state.combat) return state;
  let next = state;

  for (const enemy of state.combat.enemies) {
    const currentEnemy = next.combat?.enemies.find((e) => e.instanceId === enemy.instanceId);
    if (!currentEnemy || currentEnemy.hp <= 0) continue;
    const def = getEnemy(enemy.definitionId);
    if (!def) continue;
    const move = def.moves[currentEnemy.moveIndex % def.moves.length];
    const actions = move.actions;

    if (actions?.block) {
      next = updateEnemy(next, currentEnemy.instanceId, {
        block: currentEnemy.block + calculateBlock(actions.block, currentEnemy.statuses),
      });
    }
    if (actions?.damage) {
      const hits = actions.hits ?? 1;
      for (let i = 0; i < hits; i += 1) {
        const actingEnemy = next.combat?.enemies.find((e) => e.instanceId === currentEnemy.instanceId);
        next = dealDamageToPlayer(next, actions.damage, actingEnemy?.statuses);
      }
    }
    if (actions?.applyStatus) {
      const { id, stacks } = actions.applyStatus;
      if (actions.applyStatus.target === 'self') {
        const actingEnemy = next.combat?.enemies.find((e) => e.instanceId === currentEnemy.instanceId);
        if (actingEnemy) {
          next = updateEnemy(next, currentEnemy.instanceId, {
            statuses: addStatus(actingEnemy.statuses, id, stacks),
          });
        }
      } else {
        next = {
          ...next,
          combat: {
            ...next.combat!,
            playerStatuses: addStatus(next.combat!.playerStatuses, id, stacks),
          },
        };
      }
    }

    const latestEnemy = next.combat?.enemies.find((e) => e.instanceId === currentEnemy.instanceId);
    next = updateEnemy(next, enemy.instanceId, {
      moveIndex: (latestEnemy?.moveIndex ?? currentEnemy.moveIndex) + 1,
      block: actions?.damage ? 0 : latestEnemy?.block,
      statuses: latestEnemy ? decayStatuses(latestEnemy.statuses) : undefined,
    });
  }

  return next;
}

function updateEnemy(
  state: GameState,
  enemyId: string,
  patch: Partial<{ block: number; moveIndex: number; statuses: Map<string, number> }>
): GameState {
  if (!state.combat) return state;
  const cleanPatch = Object.fromEntries(
    Object.entries(patch).filter(([, value]) => value !== undefined),
  );
  const enemies = state.combat.enemies.map((e) =>
    e.instanceId === enemyId ? { ...e, ...cleanPatch } : e
  );
  return { ...state, combat: { ...state.combat, enemies } };
}

function dealDamageToPlayer(
  state: GameState,
  damage: number,
  attackerStatuses?: Map<string, number>,
): GameState {
  let remaining = calculateDamage(damage, attackerStatuses, state.combat?.playerStatuses);
  let block = state.combat?.playerBlock ?? 0;
  if (block > 0) {
    const blocked = Math.min(block, remaining);
    block -= blocked;
    remaining -= blocked;
  }
  const hp = Math.max(0, state.hp - remaining);
  eventBus.emit(GameEvents.DAMAGE_TAKEN, { damage: remaining });
  return {
    ...state,
    hp,
    combat: state.combat ? { ...state.combat, playerBlock: block } : null,
  };
}

function isCombatWon(state: GameState): boolean {
  return state.combat !== null && state.combat.enemies.length === 0;
}

function endCombat(state: GameState, _won: boolean): GameState {
  eventBus.emit(GameEvents.BATTLE_END, { won: _won });
  const type = state.combat!.type;
  const reward = generateReward(state, type);
  return {
    ...state,
    phase: 'reward',
    combat: null,
    pendingReward: reward,
    stats: { ...state.stats, combatsWon: state.stats.combatsWon + 1 },
  };
}

function generateReward(state: GameState, type: CombatType): RewardState {
  const range = REWARD_GOLD[type];
  const gold = randomInt(range.min, range.max);
  const pool = getCardRewardPool(state.characterId);
  const cardChoices = pickRandom(pool, GAME.CARD_REWARD_COUNT).map((c) => c.id);
  const potionDrop =
    Math.random() < GAME.POTION_DROP_CHANCE ? pickRandomPotion()?.id ?? null : null;

  let relicDrop: string | null = null;
  if (type === 'boss') {
    const bossPool = getBossRelicPool();
    relicDrop = pickRandom(bossPool, 1)[0]?.id ?? null;
  } else if (type === 'elite' && Math.random() < 0.25) {
    const relicPool = getRelicRewardPool(state.relics.map((r) => r.definitionId));
    relicDrop = pickRandom(relicPool, 1)[0]?.id ?? null;
  }

  return { type, gold, cardChoices, potionDrop, relicDrop };
}

export function getEnemyIntents(state: GameState): Map<string, string> {
  const result = new Map<string, string>();
  if (!state.combat) return result;
  for (const enemy of state.combat.enemies) {
    const def = getEnemy(enemy.definitionId);
    if (!def) continue;
    const move = def.moves[enemy.moveIndex % def.moves.length];
    const intent = move.intents.map((i) => i.label).join(' / ');
    result.set(enemy.instanceId, intent);
  }
  return result;
}

