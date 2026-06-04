import { getAllCards, getCardDescription } from '@/core/registries/CardRegistry';
import { getAllCharacters } from '@/core/registries/CharacterRegistry';
import { getAllEnemies } from '@/core/registries/EnemyRegistry';
import { getAllPotions } from '@/core/registries/PotionRegistry';
import { getAllRelics } from '@/core/registries/RelicRegistry';
import { readCollectionProgress } from '@/systems/collection/CollectionSystem';
import type { CardDefinition, CharacterDefinition, EnemyDefinition, PotionDefinition, RelicDefinition } from '@/entities';
import { resolveAssetUrl } from '@/utils/assets';

type CollectionTab = 'characters' | 'cards' | 'enemies' | 'items';

const TAB_HASH: Record<CollectionTab, string> = {
  characters: '#collection-characters',
  cards: '#collection-cards',
  enemies: '#collection-enemies',
  items: '#collection-items',
};

function getActiveTab(): CollectionTab {
  const hash = window.location.hash;
  if (hash === TAB_HASH.cards) return 'cards';
  if (hash === TAB_HASH.enemies) return 'enemies';
  if (hash === TAB_HASH.items) return 'items';
  return 'characters';
}

function isKnown(kind: keyof ReturnType<typeof readCollectionProgress>, id: string): boolean {
  return readCollectionProgress()[kind].includes(id);
}

function maskText(value: string, known: boolean): string {
  return known ? value : '????';
}

function maskNumber(value: number, known: boolean): string {
  return known ? String(value) : '?';
}

function renderVisual(src: string | undefined, alt: string, known: boolean, fallback: string): string {
  if (!known) {
    return '<div class="collection-card-visual visual-locked"><span>?</span></div>';
  }

  if (!src) {
    return `<div class="collection-card-visual visual-fallback"><span>${fallback}</span></div>`;
  }

  return `
    <div class="collection-card-visual has-image">
      <img src="${resolveAssetUrl(src)}" alt="${alt}" loading="lazy" />
    </div>
  `;
}

function renderCharacterCard(character: CharacterDefinition): string {
  const known = isKnown('characters', character.id);
  return `
    <article class="collection-card collection-character ${known ? 'collected' : 'locked'}" style="--collection-accent: ${character.color}">
      ${renderVisual(character.portrait, character.name, known, character.name.slice(0, 1))}
      <div class="collection-card-top">
        <span>${known ? '人物卡' : '未解锁'}</span>
        <strong>${maskText(character.name, known)}</strong>
      </div>
      <p>${maskText(character.title, known)}</p>
      <dl>
        <div><dt>HP</dt><dd>${maskNumber(character.maxHp, known)}</dd></div>
        <div><dt>金币</dt><dd>${maskNumber(character.startingGold, known)}</dd></div>
        <div><dt>起始牌</dt><dd>${maskNumber(character.startingDeck.length, known)}</dd></div>
      </dl>
      <small>${known ? character.description : '尚未选择过该角色。'}</small>
    </article>
  `;
}

function renderBattleCard(card: CardDefinition): string {
  const known = isKnown('cards', card.id);
  return `
    <article class="collection-card collection-battle-card card-${card.type} ${known ? 'collected' : 'locked'}">
      ${renderVisual(card.image ?? card.art?.image, card.name, known, card.type.slice(0, 1).toUpperCase())}
      <div class="collection-card-top">
        <span>${known ? card.type : '未解锁'}</span>
        <strong>${maskText(card.name, known)}</strong>
      </div>
      <p>${known ? card.rarity : '????'}</p>
      <dl>
        <div><dt>费用</dt><dd>${maskNumber(card.cost, known)}</dd></div>
        <div><dt>类型</dt><dd>${known ? card.type : '?'}</dd></div>
      </dl>
      <small>${known ? getCardDescription(card, false) : '尚未获得或使用过该卡牌。'}</small>
    </article>
  `;
}

function renderEnemyCard(enemy: EnemyDefinition): string {
  const known = isKnown('enemies', enemy.id);
  const moveCount = enemy.moves.length;
  return `
    <article class="collection-card collection-enemy ${known ? 'collected' : 'locked'}">
      ${renderVisual(`assets/enemies/${enemy.id}.svg`, enemy.name, known, enemy.tier.slice(0, 1).toUpperCase())}
      <div class="collection-card-top">
        <span>${known ? enemy.tier : '未遭遇'}</span>
        <strong>${maskText(enemy.name, known)}</strong>
      </div>
      <p>${known ? '敌人卡' : '????'}</p>
      <dl>
        <div><dt>HP</dt><dd>${maskNumber(enemy.maxHp, known)}</dd></div>
        <div><dt>行动</dt><dd>${maskNumber(moveCount, known)}</dd></div>
      </dl>
      <small>${known ? enemy.moves.map((move) => move.intents.map((intent) => intent.label).join('/')).join(' · ') : '尚未在地图中遇到。'}</small>
    </article>
  `;
}

function renderPotionCard(potion: PotionDefinition): string {
  const known = isKnown('potions', potion.id);
  return `
    <article class="collection-card collection-item ${known ? 'collected' : 'locked'}">
      ${renderVisual(undefined, potion.name, known, '✦')}
      <div class="collection-card-top">
        <span>${known ? '药水' : '未解锁'}</span>
        <strong>${maskText(potion.name, known)}</strong>
      </div>
      <p>${known ? '道具卡' : '????'}</p>
      <small>${known ? potion.description : '尚未获得过该药水。'}</small>
    </article>
  `;
}

function renderRelicCard(relic: RelicDefinition): string {
  const known = isKnown('relics', relic.id);
  return `
    <article class="collection-card collection-item ${known ? 'collected' : 'locked'}">
      ${renderVisual(undefined, relic.name, known, '◇')}
      <div class="collection-card-top">
        <span>${known ? relic.rarity : '未解锁'}</span>
        <strong>${maskText(relic.name, known)}</strong>
      </div>
      <p>${known ? '遗物卡' : '????'}</p>
      <dl>
        <div><dt>触发</dt><dd>${known ? relic.trigger : '?'}</dd></div>
      </dl>
      <small>${known ? relic.description : '尚未获得过该遗物。'}</small>
    </article>
  `;
}

function tabCount(tab: CollectionTab): string {
  const progress = readCollectionProgress();
  switch (tab) {
    case 'characters':
      return `${progress.characters.length}/${getAllCharacters().length}`;
    case 'cards':
      return `${progress.cards.length}/${getAllCards().length}`;
    case 'enemies':
      return `${progress.enemies.length}/${getAllEnemies().length}`;
    case 'items':
      return `${progress.potions.length + progress.relics.length}/${getAllPotions().length + getAllRelics().length}`;
  }
}

function tabClass(tab: CollectionTab, activeTab: CollectionTab): string {
  return tab === activeTab ? 'is-active' : '';
}

function sectionClass(tab: CollectionTab, activeTab: CollectionTab): string {
  return `collection-section ${tab === activeTab ? 'is-active' : ''}`;
}

export function renderCollectionScreen(root: HTMLElement): void {
  const activeTab = getActiveTab();
  const total =
    getAllCharacters().length + getAllCards().length + getAllEnemies().length + getAllPotions().length + getAllRelics().length;
  const progress = readCollectionProgress();
  const unlocked =
    progress.characters.length + progress.cards.length + progress.enemies.length + progress.potions.length + progress.relics.length;

  const screen = document.createElement('div');
  screen.className = 'screen collection-screen';
  screen.innerHTML = `
    <div class="collection-header">
      <div>
        <p class="collection-kicker">Archive</p>
        <h2>卡牌收集册</h2>
        <p>查看人物卡、战斗卡、敌人卡、道具卡和遗物卡的收集进度。</p>
      </div>
      <a class="btn btn-secondary" href="#main-menu">返回主页面</a>
    </div>

    <div class="collection-progress-panel">
      <strong>${unlocked}/${total}</strong>
      <span>已点亮收藏</span>
      <div class="collection-progress-bar"><i style="width: ${(unlocked / Math.max(total, 1)) * 100}%"></i></div>
    </div>

    <nav class="collection-tabs" aria-label="收藏分类">
      <a class="${tabClass('characters', activeTab)}" href="${TAB_HASH.characters}">人物卡 <span>${tabCount('characters')}</span></a>
      <a class="${tabClass('cards', activeTab)}" href="${TAB_HASH.cards}">战斗卡 <span>${tabCount('cards')}</span></a>
      <a class="${tabClass('enemies', activeTab)}" href="${TAB_HASH.enemies}">敌人卡 <span>${tabCount('enemies')}</span></a>
      <a class="${tabClass('items', activeTab)}" href="${TAB_HASH.items}">道具/遗物 <span>${tabCount('items')}</span></a>
    </nav>

    <section class="${sectionClass('characters', activeTab)}" id="collection-characters">
      <div class="collection-grid">${getAllCharacters().map(renderCharacterCard).join('')}</div>
    </section>
    <section class="${sectionClass('cards', activeTab)}" id="collection-cards">
      <div class="collection-grid">${getAllCards().map(renderBattleCard).join('')}</div>
    </section>
    <section class="${sectionClass('enemies', activeTab)}" id="collection-enemies">
      <div class="collection-grid">${getAllEnemies().map(renderEnemyCard).join('')}</div>
    </section>
    <section class="${sectionClass('items', activeTab)}" id="collection-items">
      <div class="collection-grid">${[...getAllPotions().map(renderPotionCard), ...getAllRelics().map(renderRelicCard)].join('')}</div>
    </section>
  `;

  root.appendChild(screen);
}
