import type { CardInstance } from './Card';
import type { RelicInstance } from './Relic';
import type { PotionInstance } from './Potion';
import type { GameMap } from './Map';
import type { EnemyInstance } from './Enemy';

export type GamePhase =
  | 'main_menu'
  | 'character_select'
  | 'map'
  | 'combat'
  | 'reward'
  | 'shop'
  | 'campfire'
  | 'event'
  | 'treasure'
  | 'game_over'
  | 'victory';

export type CombatType = 'normal' | 'elite' | 'boss';

export interface GameState {
  phase: GamePhase;
  characterId: string;
  hp: number;
  maxHp: number;
  gold: number;
  energy: number;
  maxEnergy: number;
  deck: CardInstance[];
  relics: RelicInstance[];
  potions: PotionInstance[];
  map: GameMap | null;
  combat: CombatState | null;
  pendingReward: RewardState | null;
  currentEventId: string | null;
  stats: {
    floorsCleared: number;
    combatsWon: number;
    cardsPlayed: number;
  };
}

export interface CombatState {
  type: CombatType;
  turn: number;
  drawPile: CardInstance[];
  hand: CardInstance[];
  discardPile: CardInstance[];
  exhaustPile: CardInstance[];
  enemies: EnemyInstance[];
  playerBlock: number;
  playerStatuses: Map<string, number>;
  cardsPlayedThisTurn: number;
}

export interface RewardState {
  type: CombatType;
  gold: number;
  cardChoices: string[];
  potionDrop: string | null;
  relicDrop: string | null;
}
