import type { GameState } from '@/entities';
import { gameManager } from '@/core/GameManager';
import { playCard, endPlayerTurn, getEnemyIntents } from '@/systems/combat/CombatSystem';
import { getCard, getCardCost } from '@/core/registries/CardRegistry';
import { getEnemy } from '@/core/registries/EnemyRegistry';
import { renderHud } from '@/ui/components/Hud';
import { createCardElement } from '@/ui/components/CardView';

export function renderCombatScreen(root: HTMLElement, state: GameState): void {
  if (!state.combat) return;

  const screen = document.createElement('div');
  screen.className = 'screen combat-screen';

  screen.appendChild(renderHud(state));

  const intents = getEnemyIntents(state);

  const enemyArea = document.createElement('div');
  enemyArea.className = 'enemy-area';
  for (const enemy of state.combat.enemies) {
    const def = getEnemy(enemy.definitionId);
    const intent = intents.get(enemy.instanceId) ?? '?';
    const el = document.createElement('div');
    el.className = 'enemy-unit';
    el.dataset.enemyId = enemy.instanceId;
    el.innerHTML = `
      <div class="enemy-name">${def?.name ?? enemy.definitionId}</div>
      <div class="enemy-hp">${enemy.hp}${def ? ` / ${def.maxHp}` : ''} HP</div>
      <div class="enemy-block" ${enemy.block ? '' : 'style="display:none"'}>🛡 ${enemy.block}</div>
      <div class="enemy-intent">意图: ${intent}</div>
    `;
    enemyArea.appendChild(el);
  }
  screen.appendChild(enemyArea);

  const playerArea = document.createElement('div');
  playerArea.className = 'player-combat-info';
  playerArea.innerHTML = `<div class="player-block">格挡: ${state.combat.playerBlock}</div>`;
  screen.appendChild(playerArea);

  const hand = document.createElement('div');
  hand.className = 'hand';
  for (const cardInst of state.combat.hand) {
    const def = getCard(cardInst.definitionId);
    if (!def) continue;
    const btn = createCardElement({
      def,
      upgraded: cardInst.upgraded,
      variant: 'hand',
      disabled: state.energy < getCardCost(def, cardInst.upgraded),
      onClick: () => {
        const targetEnemy = state.combat!.enemies[0];
        if (def.type === 'attack' && targetEnemy) {
          gameManager.updateState((s) => playCard(s, cardInst.instanceId, targetEnemy.instanceId));
        } else {
          gameManager.updateState((s) => playCard(s, cardInst.instanceId));
        }
      },
    });
    hand.appendChild(btn);
  }
  screen.appendChild(hand);

  const actions = document.createElement('div');
  actions.className = 'combat-actions';
  const endBtn = document.createElement('button');
  endBtn.className = 'btn btn-primary';
  endBtn.textContent = '结束回合';
  endBtn.addEventListener('click', () => {
    gameManager.updateState((s) => endPlayerTurn(s));
  });
  actions.appendChild(endBtn);
  screen.appendChild(actions);

  root.appendChild(screen);
}
