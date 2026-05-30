import { gameManager } from '@/core/GameManager';

export function renderMainMenu(root: HTMLElement): void {
  const screen = document.createElement('div');
  screen.className = 'screen main-menu';
  screen.innerHTML = `
    <h1 class="game-title">X-card</h1>
    <p class="subtitle">Roguelike 卡牌构筑 Demo</p>
    <button class="btn btn-primary btn-large" id="btn-start">开始游戏</button>
  `;
  screen.querySelector('#btn-start')?.addEventListener('click', () => {
    gameManager.goToCharacterSelect();
  });
  root.appendChild(screen);
}
