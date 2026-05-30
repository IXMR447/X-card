import type { CardDefinition } from '@/entities';
import {
  getCardArt,
  getCardCost,
  getCardDescription,
  getCardEffects,
  getCardImagePath,
} from '@/core/registries/CardRegistry';
import { resolveAssetUrl } from '@/utils/assets';

export type CardViewVariant = 'hand' | 'reward' | 'shop' | 'compact';

export interface CardViewOptions {
  def: CardDefinition;
  upgraded?: boolean;
  disabled?: boolean;
  variant?: CardViewVariant;
  reason?: string;
  onClick?: () => void;
}

const TYPE_LABEL: Record<CardDefinition['type'], string> = {
  attack: '攻击',
  skill: '技能',
  power: '能力',
};

const RARITY_LABEL: Record<CardDefinition['rarity'], string> = {
  basic: '基础',
  common: '普通',
  uncommon: '罕见',
  rare: '稀有',
};

const TYPE_GLYPH: Record<CardDefinition['type'], string> = {
  attack: '剑',
  skill: '盾',
  power: '星',
};

function renderEffectBadges(def: CardDefinition, upgraded: boolean): string {
  const effects = getCardEffects(def, upgraded);
  const badges = [
    effects.damage ? `<span class="card-effect-badge card-effect-damage">伤害 ${effects.damage}</span>` : '',
    effects.block ? `<span class="card-effect-badge card-effect-block">格挡 ${effects.block}</span>` : '',
    effects.draw ? `<span class="card-effect-badge card-effect-draw">抽牌 ${effects.draw}</span>` : '',
    effects.energy ? `<span class="card-effect-badge card-effect-energy">能量 +${effects.energy}</span>` : '',
    def.exhaust ? '<span class="card-effect-badge">消耗</span>' : '',
    def.innate ? '<span class="card-effect-badge">固有</span>' : '',
  ];
  return badges.filter(Boolean).join('');
}

/** 创建带立绘的卡牌 DOM 元素，供战斗/奖励/商店等界面复用 */
export function createCardElement(options: CardViewOptions): HTMLElement {
  const { def, upgraded = false, disabled = false, variant = 'hand', reason, onClick } = options;
  const tag = onClick ? 'button' : 'div';
  const el = document.createElement(tag);
  const art = getCardArt(def, upgraded);
  const cost = getCardCost(def, upgraded);
  const desc = getCardDescription(def, upgraded);
  const imagePath = getCardImagePath(def, upgraded);
  const effectBadges = renderEffectBadges(def, upgraded);

  el.className = [
    'card',
    `card-${def.type}`,
    `card-${variant}`,
    `card-rarity-${def.rarity}`,
    disabled ? 'card-disabled' : '',
    art.frame ? `card-frame-${art.frame}` : '',
  ]
    .filter(Boolean)
    .join(' ');
  el.dataset.cardType = def.type;
  el.dataset.cardRarity = def.rarity;
  if (reason) el.title = reason;
  if (disabled) el.setAttribute('aria-disabled', 'true');

  if (onClick) {
    (el as HTMLButtonElement).type = 'button';
    (el as HTMLButtonElement).disabled = disabled;
    el.addEventListener('click', onClick);
  }

  if (art.background && !imagePath) {
    el.style.background = art.background;
  }

  const artEl = document.createElement('div');
  artEl.className = 'card-art';
  if (imagePath) {
    const img = document.createElement('img');
    img.className = 'card-art-img';
    img.src = resolveAssetUrl(imagePath);
    img.alt = def.name;
    img.loading = 'lazy';
    img.style.objectFit = art.imageFit ?? 'cover';
    if (art.imagePosition) {
      img.style.objectPosition = art.imagePosition;
    }
    img.addEventListener('error', () => {
      artEl.classList.add('card-art-missing');
      img.remove();
      artEl.textContent = TYPE_GLYPH[def.type];
    });
    artEl.appendChild(img);
  } else {
    artEl.classList.add('card-art-placeholder');
    artEl.textContent = TYPE_GLYPH[def.type];
  }

  const costEl = document.createElement('span');
  costEl.className = 'card-cost';
  costEl.textContent = String(cost);

  const bodyEl = document.createElement('div');
  bodyEl.className = 'card-body';
  bodyEl.innerHTML = `
    <div class="card-header">
      <span class="card-name">${def.name}${upgraded ? '+' : ''}</span>
      <span class="card-type">${TYPE_LABEL[def.type]}</span>
    </div>
    <div class="card-meta">
      <span class="card-rarity">${RARITY_LABEL[def.rarity]}</span>
      <span class="card-target">${def.type === 'attack' ? '指向敌人' : '指向自身'}</span>
    </div>
    <span class="card-desc">${desc}</span>
    <div class="card-effects">${effectBadges}</div>
  `;

  el.appendChild(artEl);
  el.appendChild(bodyEl);
  el.appendChild(costEl);
  return el;
}
