import type { GameState } from '@/entities';
import { gameManager } from '@/core/GameManager';
import { leaveShop, buyCard, buyRelic, buyPotion } from '@/systems/shop/ShopSystem';
import type { ShopInventory } from '@/systems/shop/ShopSystem';
import { getCard } from '@/core/registries/CardRegistry';
import { getRelic } from '@/core/registries/RelicRegistry';
import { getPotion } from '@/core/registries/PotionRegistry';
import { renderHud } from '@/ui/components/Hud';
import { createCardElement } from '@/ui/components/CardView';

export function renderShopScreen(
  root: HTMLElement,
  state: GameState,
  inventory: ShopInventory | null
): void {
  const screen = document.createElement('div');
  screen.className = 'screen shop-screen';
  screen.appendChild(renderHud(state));

  if (!inventory) {
    screen.innerHTML += '<p>商店加载中...</p>';
    root.appendChild(screen);
    return;
  }

  screen.innerHTML += '<h2>商店</h2>';

  const addSection = (
    title: string,
    items: { id: string; price: number }[],
    onBuy: (s: GameState, id: string, price: number) => GameState,
    getName: (id: string) => string
  ) => {
    const section = document.createElement('div');
    section.className = 'shop-section';
    section.innerHTML = `<h3>${title}</h3>`;
    for (const item of items) {
      const btn = document.createElement('button');
      btn.className = 'shop-item btn';
      btn.textContent = `${getName(item.id)} — ${item.price} 金`;
      btn.disabled = state.gold < item.price;
      btn.addEventListener('click', () => {
        gameManager.updateState((s) => onBuy(s, item.id, item.price));
      });
      section.appendChild(btn);
    }
    screen.appendChild(section);
  };

  const addCardSection = () => {
    const section = document.createElement('div');
    section.className = 'shop-section';
    section.innerHTML = '<h3>卡牌</h3>';
    for (const item of inventory!.cards) {
      const def = getCard(item.id);
      if (!def) continue;
      const row = document.createElement('button');
      row.className = 'shop-card-row btn';
      row.type = 'button';
      row.disabled = state.gold < item.price;
      const thumb = createCardElement({ def, variant: 'compact' });
      thumb.classList.add('shop-card-thumb');
      row.appendChild(thumb);
      const label = document.createElement('span');
      label.className = 'shop-card-label';
      label.textContent = `${def.name} — ${item.price} 金`;
      row.appendChild(label);
      row.addEventListener('click', () => {
        gameManager.updateState((s) => buyCard(s, item.id, item.price));
      });
      section.appendChild(row);
    }
    screen.appendChild(section);
  };

  addCardSection();
  addSection('遗物', inventory.relics, (s, id, p) => buyRelic(s, id, p), (id) => getRelic(id)?.name ?? id);
  addSection('药水', inventory.potions, (s, id, p) => buyPotion(s, id, p), (id) => getPotion(id)?.name ?? id);

  const leaveBtn = document.createElement('button');
  leaveBtn.className = 'btn btn-primary';
  leaveBtn.textContent = '离开商店';
  leaveBtn.addEventListener('click', () => {
    gameManager.updateState((s) => leaveShop(s));
  });
  screen.appendChild(leaveBtn);

  root.appendChild(screen);
}
