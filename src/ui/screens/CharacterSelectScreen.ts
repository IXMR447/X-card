import type { CharacterDefinition } from '@/entities';
import { gameManager } from '@/core/GameManager';
import { resolveAssetUrl } from '@/utils/assets';

function renderPortrait(char: CharacterDefinition): string {
  if (char.portrait) {
    return `<img class="char-portrait-img" src="${resolveAssetUrl(char.portrait)}" alt="${char.name}" />`;
  }
  return `<span class="char-portrait-fallback">${char.name.slice(0, 1)}</span>`;
}

function renderCharacterDetails(char: CharacterDefinition): string {
  const archetypes = char._design?.archetypes ?? [];
  return `
    <div class="character-focus-card" style="--character-accent: ${char.color}">
      <div class="character-focus-portrait">${renderPortrait(char)}</div>
      <div class="character-focus-copy">
        <p class="character-kicker">Selected Hero</p>
        <h3>${char.name}</h3>
        <span class="char-title">${char.title}</span>
        <p>${char.description}</p>
      </div>
      <div class="character-focus-stats">
        <span><strong>${char.maxHp}</strong> HP</span>
        <span><strong>${char.startingGold}</strong> 金币</span>
        <span><strong>${char.startingDeck.length}</strong> 起始牌</span>
      </div>
      ${
        archetypes.length
          ? `<div class="character-tags">${archetypes.map((tag) => `<span>${tag}</span>`).join('')}</div>`
          : ''
      }
      <a class="btn btn-primary btn-large character-start-button" href="#start-run-${char.id}">开始探索</a>
    </div>
  `;
}

export function renderCharacterSelect(root: HTMLElement, characters: CharacterDefinition[]): void {
  const selected = characters[0];
  const screen = document.createElement('div');
  screen.className = 'screen character-select';
  screen.innerHTML = `
    <div class="screen-header character-select-header">
      <div>
        <h2>选择角色</h2>
        <p class="screen-subtitle">从英雄卡池中选择本次探索的起始角色</p>
      </div>
      <a class="btn btn-secondary" id="btn-back-menu" href="#main-menu">返回主页面</a>
    </div>

    <div class="character-select-layout">
      <section class="character-detail-panel" id="character-detail">
        ${selected ? renderCharacterDetails(selected) : ''}
      </section>

      <section class="character-pool-panel" aria-label="英雄卡池">
        <div class="character-pool-topline">
          <span>英雄卡池</span>
          <strong>${characters.length} 位角色</strong>
        </div>
        <div class="character-wheel" id="char-list"></div>
      </section>
    </div>
  `;

  const detail = screen.querySelector<HTMLElement>('#character-detail');
  const list = screen.querySelector<HTMLElement>('#char-list');

  const selectCharacter = (char: CharacterDefinition, card: HTMLElement): void => {
    if (detail) detail.innerHTML = renderCharacterDetails(char);
    screen.querySelectorAll('.character-card').forEach((item) => item.classList.remove('selected'));
    card.classList.add('selected');
    card.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  };

  for (const [index, char] of characters.entries()) {
    const card = document.createElement('button');
    card.className = `character-card${index === 0 ? ' selected' : ''}`;
    card.type = 'button';
    card.style.setProperty('--character-accent', char.color);
    card.innerHTML = `
      <div class="char-card-portrait">${renderPortrait(char)}</div>
      <div class="char-card-body">
        <h3>${char.name}</h3>
        <p class="char-title">${char.title}</p>
        <p>${char.description}</p>
        <p class="char-stats">HP ${char.maxHp} · 金币 ${char.startingGold}</p>
      </div>
      <span class="char-card-action">选择</span>
    `;
    card.addEventListener('click', () => selectCharacter(char, card));
    card.addEventListener('dblclick', () => gameManager.startRun(char.id));
    list?.appendChild(card);
  }

  root.appendChild(screen);
}
