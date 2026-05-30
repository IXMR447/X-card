import type { GameState } from '@/entities';
import { gameManager } from '@/core/GameManager';
import { restAtCampfire, upgradeCardAtCampfire, getUpgradeableCards } from '@/systems/campfire/CampfireSystem';
import { getCard } from '@/core/registries/CardRegistry';
import { renderHud } from '@/ui/components/Hud';
import { createCardElement } from '@/ui/components/CardView';

export function renderCampfireScreen(root: HTMLElement, state: GameState): void {
  const screen = document.createElement('div');
  screen.className = 'screen campfire-screen';
  screen.innerHTML = `
    <div class="screen-header">
      <div>
        <h2>篝火</h2>
        <p class="screen-subtitle">休息或升级一张卡牌</p>
      </div>
      <button class="btn btn-secondary" id="btn-leave-campfire">离开篝火</button>
    </div>
  `;

  screen.appendChild(renderHud(state));

  screen.insertAdjacentHTML('beforeend', `
    <div class="panel campfire-actions">
      <button class="btn btn-primary" id="btn-rest">休息 — 恢复 30% 最大生命</button>
    </div>
  `);

  const restBtn = screen.querySelector('#btn-rest') as HTMLButtonElement;
  restBtn.addEventListener('click', () => {
    gameManager.updateState((s) => restAtCampfire(s));
  });

  screen.querySelector('#btn-leave-campfire')?.addEventListener('click', () => {
    gameManager.updateState((s) => ({ ...s, phase: 'map' }));
  });

  const upgradeable = getUpgradeableCards(state);
  if (upgradeable.length > 0) {
    const upgradeSection = document.createElement('div');
    upgradeSection.innerHTML = '<h3>升级卡牌</h3>';
    for (const instanceId of upgradeable) {
      const inst = state.deck.find((c) => c.instanceId === instanceId);
      const def = inst ? getCard(inst.definitionId) : undefined;
      if (!def || !inst) continue;
      const wrap = document.createElement('div');
      wrap.className = 'campfire-upgrade-item';
      const preview = createCardElement({ def, upgraded: false, variant: 'compact' });
      preview.classList.add('campfire-card-preview');
      wrap.appendChild(preview);
      const btn = document.createElement('button');
      btn.className = 'btn';
      btn.textContent = `升级 → ${def.name}+`;
      btn.addEventListener('click', () => {
        gameManager.updateState((s) => upgradeCardAtCampfire(s, instanceId));
      });
      wrap.appendChild(btn);
      upgradeSection.appendChild(wrap);
    }
    screen.appendChild(upgradeSection);
  }

  root.appendChild(screen);
}
