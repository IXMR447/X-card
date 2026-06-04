import type { GameState } from '@/entities';
import { gameManager } from '@/core/GameManager';
import { authService } from '@/services/AuthService';
import { cloudSaveService } from '@/services/CloudSaveService';

export function renderGameOverScreen(root: HTMLElement, state: GameState): void {
  const screen = document.createElement('div');
  screen.className = 'screen game-over-screen panel';
  const won = state.phase === 'victory';
  screen.innerHTML = `
    <div class="screen-header">
      <div>
        <h2>${won ? '胜利！' : '游戏结束'}</h2>
        <p class="screen-subtitle">你的冒险已结束，感谢挑战。</p>
      </div>
    </div>
    <div class="panel">
      <p>战斗胜利: <strong>${state.stats.combatsWon}</strong></p>
      <p>打出卡牌: <strong>${state.stats.cardsPlayed}</strong></p>
    </div>
  `;
  const btn = document.createElement('button');
  btn.className = 'btn btn-primary';
  btn.textContent = '返回主菜单';
  btn.addEventListener('click', () => gameManager.returnToMenu());
  screen.appendChild(btn);
  root.appendChild(screen);

  // Clean up save slot for finished run (slot 0)
  (async () => {
    try {
      const saves = (() => {
        try {
          const raw = localStorage.getItem('x-card-save-slots');
          const arr = raw ? JSON.parse(raw) : [];
          return Array.isArray(arr) ? arr : [];
        } catch {
          return [];
        }
      })();
      const filtered = saves.filter((s: { slotIndex: number }) => s.slotIndex !== 0);
      localStorage.setItem('x-card-save-slots', JSON.stringify(filtered));
    } catch {
      // ignore
    }
    if (authService.isLoggedIn()) {
      try {
        await cloudSaveService.deleteSaveSlot(0);
      } catch {
        // ignore
      }
    }
  })();
}
