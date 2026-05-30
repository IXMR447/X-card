import type { GameState } from '@/entities';
import { SHOP_PRICES, GAME } from '@/core/constants';
import { eventBus, GameEvents } from '@/core/EventBus';
import { getCard } from '@/core/registries/CardRegistry';
import { getRelic } from '@/core/registries/RelicRegistry';
import { getPotion } from '@/core/registries/PotionRegistry';
import { pickRandom } from '@/utils/random';
import { getCardRewardPool } from '@/core/registries/CardRegistry';
import { getRelicRewardPool } from '@/core/registries/RelicRegistry';
import { getAllPotions } from '@/core/registries/PotionRegistry';
import { addCardToDeck, addRelic, addPotion, removeCardFromDeck } from '@/systems/rewards/RewardSystem';

export interface ShopInventory {
  cards: { id: string; price: number }[];
  relics: { id: string; price: number }[];
  potions: { id: string; price: number }[];
  removeCardPrice: number;
}

export function generateShopInventory(characterId: string): ShopInventory {
  const cardPool = pickRandom(getCardRewardPool(characterId), 5);
  const relicPool = pickRandom(getRelicRewardPool(), 2);
  const potionPool = pickRandom(getAllPotions(), 3);

  return {
    cards: cardPool.map((c) => ({
      id: c.id,
      price: randPrice(SHOP_PRICES.card.min, SHOP_PRICES.card.max),
    })),
    relics: relicPool.map((r) => ({
      id: r.id,
      price: randPrice(SHOP_PRICES.relic.min, SHOP_PRICES.relic.max),
    })),
    potions: potionPool.map((p) => ({
      id: p.id,
      price: randPrice(SHOP_PRICES.potion.min, SHOP_PRICES.potion.max),
    })),
    removeCardPrice: GAME.REMOVE_CARD_COST,
  };
}

function randPrice(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function enterShop(state: GameState): { state: GameState; inventory: ShopInventory } {
  eventBus.emit(GameEvents.ENTER_SHOP);
  const inventory = generateShopInventory(state.characterId);
  return { state: { ...state, phase: 'shop' }, inventory };
}

export function leaveShop(state: GameState): GameState {
  eventBus.emit(GameEvents.LEAVE_SHOP);
  return { ...state, phase: 'map' };
}

export function buyCard(state: GameState, cardId: string, price: number): GameState {
  if (state.gold < price || !getCard(cardId)) return state;
  return addCardToDeck({ ...state, gold: state.gold - price }, cardId);
}

export function buyRelic(state: GameState, relicId: string, price: number): GameState {
  if (state.gold < price || !getRelic(relicId)) return state;
  return addRelic({ ...state, gold: state.gold - price }, relicId);
}

export function buyPotion(state: GameState, potionId: string, price: number): GameState {
  if (state.gold < price || !getPotion(potionId) || state.potions.length >= 3) return state;
  return addPotion({ ...state, gold: state.gold - price }, potionId);
}

export function removeCard(state: GameState, instanceId: string, price: number): GameState {
  if (state.gold < price) return state;
  return removeCardFromDeck({ ...state, gold: state.gold - price }, instanceId);
}
