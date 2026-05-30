import type { GameState } from '@/entities';
import { gameManager } from '@/core/GameManager';
import { claimReward, skipCardReward } from '@/systems/rewards/RewardSystem';
import { getCard } from '@/core/registries/CardRegistry';
import { renderHud } from '@/ui/components/Hud';
import { createCardElement } from '@/ui/components/CardView';

export function renderRewardScreen(root: HTMLElement, state: GameState): void {
  if (!state.pendingReward) return;

  const screen = document.createElement('div');
  screen.className = 'screen reward-screen';
  screen.innerHTML = `
    <div class="screen-header">
      <div>
        <h2>战斗奖励</h2>
        <p class="screen-subtitle">领取奖励后继续冒险</p>
      </div>
    </div>
  `;
  screen.appendChild(renderHud(state));

  const reward = state.pendingReward;
  screen.insertAdjacentHTML('beforeend', `
    <div class="reward-summary panel">
      <p>获得金币：<strong>${reward.gold}</strong></p>
      ${reward.potionDrop ? `<p>获得药水：<strong>${reward.potionDrop}</strong></p>` : ''}
      ${reward.relicDrop ? `<p>获得遗物：<strong>${reward.relicDrop}</strong></p>` : ''}
    </div>
  `);

  const cardList = document.createElement('div');
  cardList.className = 'reward-cards panel';
  cardList.innerHTML = '<h3>选择一张卡牌</h3>';

  for (const cardId of reward.cardChoices) {
    const def = getCard(cardId);
    if (!def) continue;
    const btn = createCardElement({
      def,
      variant: 'reward',
      onClick: () => {
        gameManager.updateState((s) => claimReward(s, cardId));
      },
    });
    cardList.appendChild(btn);
  }

  screen.appendChild(cardList);

  const actionPanel = document.createElement('div');
  actionPanel.className = 'reward-actions';
  const skipBtn = document.createElement('button');
  skipBtn.className = 'btn btn-secondary';
  skipBtn.textContent = '跳过卡牌';
  skipBtn.addEventListener('click', () => {
    gameManager.updateState((s) => skipCardReward(s));
  });
  actionPanel.appendChild(skipBtn);
  screen.appendChild(actionPanel);
  root.appendChild(screen);
}
