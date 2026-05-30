import type { CardDefinition } from '@/entities';
import {
  getCardArt,
  getCardCost,
  getCardDescription,
  getCardImagePath,
} from '@/core/registries/CardRegistry';
import { resolveAssetUrl } from '@/utils/assets';

export type CardViewVariant = 'hand' | 'reward' | 'shop' | 'compact';

export interface CardViewOptions {
  def: CardDefinition;
  upgraded?: boolean;
  disabled?: boolean;
  variant?: CardViewVariant;
  onClick?: () => void;
}

/** 创建带立绘的卡牌 DOM 元素，供战斗/奖励/商店等界面复用 */
export function createCardElement(options: CardViewOptions): HTMLElement {
  const { def, upgraded = false, disabled = false, variant = 'hand', onClick } = options;
  const tag = onClick ? 'button' : 'div';
  const el = document.createElement(tag);
  const art = getCardArt(def, upgraded);
  const cost = getCardCost(def, upgraded);
  const desc = getCardDescription(def, upgraded);
  const imagePath = getCardImagePath(def, upgraded);

  el.className = [
    'card',
    `card-${def.type}`,
    `card-${variant}`,
    art.frame ? `card-frame-${art.frame}` : '',
  ]
    .filter(Boolean)
    .join(' ');

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
    });
    artEl.appendChild(img);
  } else {
    artEl.classList.add('card-art-placeholder');
    artEl.textContent = def.type === 'attack' ? '⚔' : def.type === 'skill' ? '🛡' : '✦';
  }

  const costEl = document.createElement('span');
  costEl.className = 'card-cost';
  costEl.textContent = String(cost);

  const bodyEl = document.createElement('div');
  bodyEl.className = 'card-body';
  bodyEl.innerHTML = `
    <div class="card-header">
      <span class="card-name">${def.name}${upgraded ? '+' : ''}</span>
      <span class="card-type">${def.type.toUpperCase()}</span>
    </div>
    <span class="card-desc">${desc}</span>
  `;

  el.appendChild(artEl);
  el.appendChild(bodyEl);
  el.appendChild(costEl);
  return el;
}
