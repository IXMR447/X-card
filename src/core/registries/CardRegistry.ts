import type { CardArt, CardDefinition } from '@/entities';

/** 卡牌注册表 — 在此导入并注册你设计的所有卡牌 */
const registry = new Map<string, CardDefinition>();

export function registerCard(card: CardDefinition): void {
  if (registry.has(card.id)) {
    console.warn(`[CardRegistry] 重复注册: ${card.id}`);
  }
  registry.set(card.id, card);
}

export function registerCards(cards: CardDefinition[]): void {
  cards.forEach(registerCard);
}

export function getCard(id: string): CardDefinition | undefined {
  return registry.get(id);
}

export function getAllCards(): CardDefinition[] {
  return Array.from(registry.values());
}

export function getCardsByCharacter(characterId: string | null): CardDefinition[] {
  return getAllCards().filter(
    (c) => c.characterId === characterId || c.characterId === null || c.characterId === undefined
  );
}

export function getCardRewardPool(characterId: string, excludeIds: string[] = []): CardDefinition[] {
  return getCardsByCharacter(characterId).filter(
    (c) => c.rarity !== 'basic' && !excludeIds.includes(c.id)
  );
}

/** 加载所有卡牌 — 在 content/cards/index.ts 中实现 */
export function loadAllCards(): void {
  // 动态导入由 content/cards/index.ts 调用 registerCards
}

export function getCardEffects(card: CardDefinition, upgraded: boolean) {
  if (upgraded && card.upgrade?.effects) {
    return { ...card.effects, ...card.upgrade.effects };
  }
  return card.effects;
}

export function getCardCost(card: CardDefinition, upgraded: boolean): number {
  if (upgraded && card.upgrade?.cost !== undefined) {
    return card.upgrade.cost;
  }
  return card.cost;
}

export function getCardDescription(card: CardDefinition, upgraded: boolean): string {
  if (upgraded && card.upgrade?.description) {
    return card.upgrade.description;
  }
  return card.description;
}

/** 合并 art 对象与顶层 image 简写字段 */
export function getCardArt(card: CardDefinition, upgraded = false): CardArt {
  const art: CardArt = { ...card.art };
  if (card.image) art.image ??= card.image;
  if (card.imageUpgraded) art.imageUpgraded ??= card.imageUpgraded;
  if (upgraded && art.imageUpgraded) {
    art.image = art.imageUpgraded;
  }
  return art;
}

/** 当前应显示的立绘路径（已考虑升级） */
export function getCardImagePath(card: CardDefinition, upgraded = false): string | undefined {
  const art = getCardArt(card, upgraded);
  return art.image;
}
