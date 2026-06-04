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
import { markCollected } from '@/systems/collection/CollectionSystem';
import { packSaveSlot } from '@/services/serialization';

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
      recentRelicActivations: [],
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

    markCollected('characters', character.id);
    markCollected('cards', character.startingDeck);
    markCollected('relics', character.startingRelics);

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

  loadState(state: GameState): void {
    this.setState(state);
  }

  getCurrentFloor(): number {
    if (!this.state.map) return 0;
    const node = getCurrentNode(this.state.map);
    return node?.floor ?? 0;
  }

  async saveCurrentRun(slotIndex: number): Promise<void> {
    const state = this.state;
    const character = getCharacter(state.characterId);
    const characterName = character?.name ?? 'Unknown';
    const floor = this.getCurrentFloor();
    const slot = packSaveSlot(state, characterName, floor);

    // Always save to localStorage as backup
    const saves = (() => {
      try {
        const raw = localStorage.getItem('x-card-save-slots');
        const arr = raw ? JSON.parse(raw) : [];
        return Array.isArray(arr) ? arr : [];
      } catch {
        return [];
      }
    })();
    const idx = saves.findIndex((s: { slotIndex: number }) => s.slotIndex === slotIndex);
    const entry = { slotIndex, data: slot };
    if (idx >= 0) {
      saves[idx] = entry;
    } else {
      saves.push(entry);
    }
    localStorage.setItem('x-card-save-slots', JSON.stringify(saves));

    // Also save to cloud if logged in
    try {
      const { authService } = await import('@/services/AuthService');
      if (authService.isLoggedIn()) {
        const { cloudSaveService } = await import('@/services/CloudSaveService');
        await cloudSaveService.saveGameToSlot(slotIndex, state, characterName, floor);
      }
    } catch {
      // Cloud save is best-effort
    }
  }
}

export const gameManager = new GameManager();
