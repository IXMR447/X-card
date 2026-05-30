import { gameManager } from '@/core/GameManager';

export function renderMainMenu(root: HTMLElement): void {
  const screen = document.createElement('div');
  screen.className = 'screen main-menu';
  screen.innerHTML = `
    <div class="main-menu-panel">
      <div class="main-menu-banner">
        <h1 class="game-title">X-card</h1>
        <p class="subtitle">Roguelike 卡牌构筑 Demo</p>
      </div>
      <div class="main-menu-info">
        <p>选择你的英雄，探索未知节点，构建独特牌组并挑战风暴巨像。</p>
        <ul>
          <li>角色选择：两位不同风格英雄</li>
          <li>卡组构筑：攻击、技能、能力</li>
          <li>地图探索：普通战、精英、商店、篝火、事件</li>
        </ul>
        <button class="btn btn-primary btn-large" id="btn-start">开始冒险</button>
      </div>
    </div>
  `;
  screen.querySelector('#btn-start')?.addEventListener('click', () => {
    gameManager.goToCharacterSelect();
  });
  root.appendChild(screen);
}
