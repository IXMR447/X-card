import type { GameState, CombatState } from '@/entities/GameState';
import type { EnemyInstance } from '@/entities/Enemy';
import type { CardInstance } from '@/entities/Card';
import type { RelicInstance } from '@/entities/Relic';
import type { PotionInstance } from '@/entities/Potion';
import type { RelicActivation } from '@/entities/GameState';
import type { RewardState } from '@/entities/GameState';
import type { GameMap } from '@/entities/Map';

export const SAVE_FORMAT_VERSION = 1;

// ── Serializable mirrors (Maps → arrays) ──

interface SerializableCombatState {
  type: 'normal' | 'elite' | 'boss';
  turn: number;
  drawPile: CardInstance[];
  hand: CardInstance[];
  discardPile: CardInstance[];
  exhaustPile: CardInstance[];
  enemies: SerializableEnemyInstance[];
  playerBlock: number;
  playerStatuses: [string, number][];
  cardsPlayedThisTurn: number;
  skillCardsPlayedThisTurn: number;
}

interface SerializableEnemyInstance {
  instanceId: string;
  definitionId: string;
  hp: number;
  block: number;
  moveIndex: number;
  statuses: [string, number][];
}

export interface SerializableGameState {
  phase: string;
  characterId: string;
  hp: number;
  maxHp: number;
  gold: number;
  energy: number;
  maxEnergy: number;
  deck: CardInstance[];
  relics: RelicInstance[];
  potions: PotionInstance[];
  recentRelicActivations: RelicActivation[];
  map: GameMap | null;
  combat: SerializableCombatState | null;
  pendingReward: RewardState | null;
  currentEventId: string | null;
  stats: { floorsCleared: number; combatsWon: number; cardsPlayed: number };
}

export interface SerializedSaveSlot {
  version: number;
  timestamp: number;
  characterName: string;
  floor: number;
  gameState: SerializableGameState;
}

// ── Serialization ──

function serializeEnemy(enemy: EnemyInstance): SerializableEnemyInstance {
  return {
    ...enemy,
    statuses: [...enemy.statuses.entries()],
  };
}

function deserializeEnemy(data: SerializableEnemyInstance): EnemyInstance {
  return {
    ...data,
    statuses: new Map(data.statuses),
  };
}

function serializeCombat(combat: CombatState): SerializableCombatState {
  return {
    ...combat,
    playerStatuses: [...combat.playerStatuses.entries()],
    enemies: combat.enemies.map(serializeEnemy),
  };
}

function deserializeCombat(data: SerializableCombatState): CombatState {
  return {
    ...data,
    playerStatuses: new Map(data.playerStatuses),
    enemies: data.enemies.map(deserializeEnemy),
  };
}

export function serializeGameState(state: GameState): SerializableGameState {
  const serialized: SerializableGameState = {
    phase: state.phase,
    characterId: state.characterId,
    hp: state.hp,
    maxHp: state.maxHp,
    gold: state.gold,
    energy: state.energy,
    maxEnergy: state.maxEnergy,
    deck: state.deck,
    relics: state.relics,
    potions: state.potions,
    recentRelicActivations: state.recentRelicActivations,
    map: state.map,
    combat: state.combat ? serializeCombat(state.combat) : null,
    pendingReward: state.pendingReward,
    currentEventId: state.currentEventId,
    stats: state.stats,
  };
  return serialized;
}

export function deserializeGameState(data: SerializableGameState): GameState {
  return {
    phase: data.phase as GameState['phase'],
    characterId: data.characterId,
    hp: data.hp,
    maxHp: data.maxHp,
    gold: data.gold,
    energy: data.energy,
    maxEnergy: data.maxEnergy,
    deck: data.deck,
    relics: data.relics,
    potions: data.potions,
    recentRelicActivations: data.recentRelicActivations,
    map: data.map,
    combat: data.combat ? deserializeCombat(data.combat) : null,
    pendingReward: data.pendingReward,
    currentEventId: data.currentEventId,
    stats: data.stats,
  };
}

// ── Save slot helpers ──

export function packSaveSlot(
  state: GameState,
  characterName: string,
  floor: number,
): SerializedSaveSlot {
  return {
    version: SAVE_FORMAT_VERSION,
    timestamp: Date.now(),
    characterName,
    floor,
    gameState: serializeGameState(state),
  };
}

export function unpackSaveSlot(slot: SerializedSaveSlot): GameState {
  return deserializeGameState(slot.gameState);
}
