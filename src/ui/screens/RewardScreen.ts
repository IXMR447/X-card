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
  screen.appendChild(renderHud(state));

  const reward = state.pendingReward;
  screen.innerHTML += `
    <h2>战斗奖励</h2>
    <p>获得 ${reward.gold} 金币</p>
    ${reward.potionDrop ? `<p>获得药水: ${reward.potionDrop}</p>` : ''}
    ${reward.relicDrop ? `<p>获得遗物: ${reward.relicDrop}</p>` : ''}
  `;

  const cardList = document.createElement('div');
  cardList.className = 'reward-cards';
  cardList.innerHTML = '<h3>选择一张卡牌（或跳过）</h3>';

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

  const skipBtn = document.createElement('button');
  skipBtn.className = 'btn';
  skipBtn.textContent = '跳过卡牌';
  skipBtn.addEventListener('click', () => {
    gameManager.updateState((s) => skipCardReward(s));
  });
  cardList.appendChild(skipBtn);

  screen.appendChild(cardList);
  root.appendChild(screen);
}
