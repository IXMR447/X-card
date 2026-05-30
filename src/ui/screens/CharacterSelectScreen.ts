import type { CharacterDefinition } from '@/entities';
import { gameManager } from '@/core/GameManager';
import { resolveAssetUrl } from '@/utils/assets';

export function renderCharacterSelect(root: HTMLElement, characters: CharacterDefinition[]): void {
  const screen = document.createElement('div');
  screen.className = 'screen character-select';
  screen.innerHTML = `
    <div class="screen-header">
      <div>
        <h2>选择角色</h2>
        <p class="screen-subtitle">每个英雄拥有独特起始卡组和能力</p>
      </div>
    </div>
    <div class="character-list" id="char-list"></div>
  `;

  const list = screen.querySelector('#char-list')!;
  for (const char of characters) {
    const card = document.createElement('button');
    card.className = 'character-card';
    card.type = 'button';
    card.style.border = `1px solid ${char.color}`;
    const portraitHtml = char.portrait
      ? `<img class="char-portrait" src="${resolveAssetUrl(char.portrait)}" alt="${char.name}" />`
      : '';
    card.innerHTML = `
      ${portraitHtml}
      <h3>${char.name}</h3>
      <p class="char-title">${char.title}</p>
      <p>${char.description}</p>
      <p class="char-stats">HP ${char.maxHp} · 金币 ${char.startingGold}</p>
    `;
    card.addEventListener('click', () => gameManager.startRun(char.id));
    list.appendChild(card);
  }

  root.appendChild(screen);
}
