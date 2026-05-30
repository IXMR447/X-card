import type { CombatState, CombatType, GameState, RewardState } from '@/entities';
import { GAME, REWARD_GOLD } from '@/core/constants';
import { eventBus, GameEvents } from '@/core/EventBus';
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

export function startCombat(state: GameState, type: CombatType, enemyIds: string[]): GameState {
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
  };

  eventBus.emit(GameEvents.BATTLE_START, { type });

  const next = { ...state, phase: 'combat' as const, combat, energy: state.maxEnergy };
  return drawCards(startPlayerTurn(next), GAME.DRAW_PER_TURN);
}

function startPlayerTurn(state: GameState): GameState {
  if (!state.combat) return state;
  eventBus.emit(GameEvents.TURN_START, { turn: state.combat.turn });
  return { ...state, energy: state.maxEnergy, combat: { ...state.combat, playerBlock: 0, cardsPlayedThisTurn: 0 } };
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

  let next = { ...state, energy: state.energy - cost };
  const effects = getCardEffects(cardDef, cardInst.upgraded);

  // 应用效果
  if (effects.damage && targetEnemyId) {
    next = dealDamageToEnemy(next, targetEnemyId, effects.damage);
  }
  if (effects.block) {
    next = {
      ...next,
      combat: next.combat
        ? { ...next.combat, playerBlock: next.combat.playerBlock + effects.block }
        : null,
    };
  }
  if (effects.draw) {
    next = drawCards(next, effects.draw);
  }
  if (effects.energy) {
    next = { ...next, energy: next.energy + effects.energy };
  }

  // 移动卡牌
  const played = cardInst;
  const newHand = state.combat.hand.filter((c) => c.instanceId !== cardInstanceId);
  const discardPile = [...state.combat.discardPile];
  const exhaustPile = [...state.combat.exhaustPile];

  if (cardDef.exhaust) {
    exhaustPile.push(played);
  } else {
    discardPile.push(played);
    eventBus.emit(GameEvents.CARD_DISCARDED, { card: played });
  }

  next = {
    ...next,
    combat: {
      ...next.combat!,
      hand: newHand,
      discardPile,
      exhaustPile,
      cardsPlayedThisTurn: next.combat!.cardsPlayedThisTurn + 1,
    },
    stats: { ...next.stats, cardsPlayed: next.stats.cardsPlayed + 1 },
  };

  eventBus.emit(GameEvents.CARD_PLAYED, { card: cardInst, definition: cardDef });

  // 检查敌人死亡
  next = removeDeadEnemies(next);

  if (isCombatWon(next)) {
    return endCombat(next, true);
  }

  return next;
}

function dealDamageToEnemy(state: GameState, enemyId: string, damage: number): GameState {
  if (!state.combat) return state;
  const enemies = state.combat.enemies.map((e) => {
    if (e.instanceId !== enemyId) return e;
    let remaining = damage;
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

  // 弃掉手牌
  let next: GameState = {
    ...state,
    combat: {
      ...state.combat,
      discardPile: [...state.combat.discardPile, ...state.combat.hand],
      hand: [],
    },
  };
  next.combat!.hand.forEach((c) => eventBus.emit(GameEvents.CARD_DISCARDED, { card: c }));

  // 敌人行动
  next = executeEnemyTurn(next);

  if (next.hp <= 0) {
    return { ...next, phase: 'game_over', combat: null };
  }

  if (isCombatWon(next)) {
    return endCombat(next, true);
  }

  // 新回合
  const combat = { ...next.combat!, turn: next.combat!.turn + 1 };
  next = { ...next, combat, energy: next.maxEnergy };
  next = startPlayerTurn(next);
  return drawCards(next, GAME.DRAW_PER_TURN);
}

function executeEnemyTurn(state: GameState): GameState {
  if (!state.combat) return state;
  let next = state;

  for (const enemy of state.combat.enemies) {
    const def = getEnemy(enemy.definitionId);
    if (!def) continue;
    const move = def.moves[enemy.moveIndex % def.moves.length];
    const actions = move.actions;

    if (actions?.block) {
      next = updateEnemy(next, enemy.instanceId, { block: enemy.block + actions.block });
    }
    if (actions?.damage) {
      next = dealDamageToPlayer(next, actions.damage);
    }
    if (actions?.applyStatus) {
      const { id, stacks } = actions.applyStatus;
      const statuses = new Map(next.combat!.playerStatuses);
      statuses.set(id, (statuses.get(id) ?? 0) + stacks);
      next = { ...next, combat: { ...next.combat!, playerStatuses: statuses } };
    }

    next = updateEnemy(next, enemy.instanceId, {
      moveIndex: enemy.moveIndex + 1,
      block: actions?.damage ? enemy.block : undefined,
    });
  }

  return next;
}

function updateEnemy(
  state: GameState,
  enemyId: string,
  patch: Partial<{ block: number; moveIndex: number }>
): GameState {
  if (!state.combat) return state;
  const enemies = state.combat.enemies.map((e) =>
    e.instanceId === enemyId ? { ...e, ...patch } : e
  );
  return { ...state, combat: { ...state.combat, enemies } };
}

function dealDamageToPlayer(state: GameState, damage: number): GameState {
  let remaining = damage;
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
