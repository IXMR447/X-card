import type { GameState } from '@/entities';
import { GAME } from '@/core/constants';
import { getCharacter } from '@/core/registries/CharacterRegistry';
import { generateMap, getCurrentNode, moveToNode } from '@/systems/map/MapSystem';
import { mapConfig } from '@/content/map/config';
import { createDeckFromDefinitionIds } from '@/utils/random';
import { startCombat } from '@/systems/combat/CombatSystem';
import { enterShop } from '@/systems/shop/ShopSystem';
import { enterCampfire } from '@/systems/campfire/CampfireSystem';
import { enterEvent } from '@/systems/events/EventSystem';
import type { ShopInventory } from '@/systems/shop/ShopSystem';

type StateListener = (state: GameState) => void;

export class GameManager {
  private state: GameState;
  private listeners: StateListener[] = [];
  shopInventory: ShopInventory | null = null;

  constructor() {
    this.state = this.createInitialState();
  }

  private createInitialState(): GameState {
    return {
      phase: 'main_menu',
      characterId: '',
      hp: 0,
      maxHp: 0,
      gold: 0,
      energy: GAME.BASE_ENERGY,
      maxEnergy: GAME.BASE_ENERGY,
      deck: [],
      relics: [],
      potions: [],
      map: null,
      combat: null,
      pendingReward: null,
      currentEventId: null,
      stats: { floorsCleared: 0, combatsWon: 0, cardsPlayed: 0 },
    };
  }

  getState(): GameState {
    return this.state;
  }

  subscribe(listener: StateListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private emit(): void {
    this.listeners.forEach((l) => l(this.state));
  }

  private setState(state: GameState): void {
    this.state = state;
    this.emit();
  }

  goToCharacterSelect(): void {
    this.setState({ ...this.state, phase: 'character_select' });
  }

  startRun(characterId: string): void {
    const character = getCharacter(characterId);
    if (!character) return;

    const map = generateMap(mapConfig, 1);
    this.setState({
      ...this.createInitialState(),
      phase: 'map',
      characterId,
      hp: character.maxHp,
      maxHp: character.maxHp,
      gold: character.startingGold,
      deck: createDeckFromDefinitionIds(character.startingDeck),
      relics: character.startingRelics.map((id) => ({ definitionId: id })),
      map,
    });
  }

  selectMapNode(nodeId: string): void {
    if (!this.state.map) return;
    const map = moveToNode(this.state.map, nodeId);
    const node = getCurrentNode(map);
    if (!node) return;

    let next: GameState = { ...this.state, map };

    switch (node.type) {
      case 'combat':
      case 'elite':
      case 'boss': {
        if (node.enemyId) {
          const combatType =
            node.type === 'boss' ? 'boss' : node.type === 'elite' ? 'elite' : 'normal';
          next = startCombat(next, combatType, [node.enemyId]);
        }
        break;
      }
      case 'shop': {
        const result = enterShop(next);
        this.shopInventory = result.inventory;
        next = result.state;
        break;
      }
      case 'campfire':
        next = enterCampfire(next);
        break;
      case 'event':
        if (node.eventId) next = enterEvent(next, node.eventId);
        break;
      case 'treasure':
        next = { ...next, phase: 'treasure' };
        break;
      default:
        break;
    }

    this.setState(next);
  }

  updateState(updater: (s: GameState) => GameState): void {
    this.setState(updater(this.state));
  }

  returnToMenu(): void {
    this.shopInventory = null;
    this.setState(this.createInitialState());
  }
}

export const gameManager = new GameManager();
