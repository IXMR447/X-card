import type { GameState, CardInstance } from '@/entities';
import { gameManager } from '@/core/GameManager';
import { playCard, endPlayerTurn, getEnemyIntents } from '@/systems/combat/CombatSystem';
import { getCard, getCardCost } from '@/core/registries/CardRegistry';
import { getEnemy } from '@/core/registries/EnemyRegistry';
import { renderHud } from '@/ui/components/Hud';
import { createCardElement } from '@/ui/components/CardView';

interface DragState {
  cardInst: CardInstance;
  originX: number;
  originY: number;
  wrapper: HTMLElement;
  target: HTMLElement | null;
}

export function renderCombatScreen(root: HTMLElement, state: GameState): void {
  if (!state.combat) return;

  const screen = document.createElement('div');
  screen.className = 'screen combat-screen';

  screen.innerHTML = `
    <div class="screen-header">
      <div>
        <h2>战斗中</h2>
        <p class="screen-subtitle">选择卡牌，观察敌人意图并结束回合</p>
      </div>
    </div>
  `;
  screen.appendChild(renderHud(state));

  const battleSummary = document.createElement('div');
  battleSummary.className = 'battle-summary panel';
  battleSummary.innerHTML = `
    <p><strong>敌人数量：</strong>${state.combat.enemies.length}</p>
    <p><strong>当前格挡：</strong>${state.combat.playerBlock}</p>
    <p><strong>能量剩余：</strong>${state.energy}/${state.maxEnergy}</p>
  `;
  screen.appendChild(battleSummary);

  const intents = getEnemyIntents(state);

  const enemyArea = document.createElement('div');
  enemyArea.className = 'enemy-area';
  for (const enemy of state.combat.enemies) {
    const def = getEnemy(enemy.definitionId);
    const intent = intents.get(enemy.instanceId) ?? '?';
    const el = document.createElement('div');
    el.className = 'card enemy-card';
    el.dataset.enemyId = enemy.instanceId;
    el.innerHTML = `
      <div class="card-body">
        <div class="card-header">
          <span class="card-name">${def?.name ?? enemy.definitionId}</span>
          <span class="card-type">${def?.tier?.toUpperCase() ?? 'ENEMY'}</span>
        </div>
        <div class="enemy-stats">
          <div class="enemy-hp">HP: ${enemy.hp}${def ? ` / ${def.maxHp}` : ''}</div>
          <div class="enemy-intent">意图: ${intent}</div>
          <div class="enemy-block" ${enemy.block ? '' : 'style="display:none"'}>🛡 ${enemy.block}</div>
        </div>
      </div>
    `;
    enemyArea.appendChild(el);
  }
  screen.appendChild(enemyArea);

  const playerArea = document.createElement('div');
  playerArea.className = 'player-combat-info panel player-drop-target';
  playerArea.innerHTML = `
    <div class="player-block">格挡: ${state.combat.playerBlock}</div>
    <p>拖动卡牌到这里以对自身施放非伤害效果</p>
  `;
  playerArea.dataset.dropTarget = 'player';
  screen.appendChild(playerArea);

  const hand = document.createElement('div');
  hand.className = 'hand fan-hand';
  const handCount = state.combat.hand.length;
  const spreadAngle = 56;
  const midIndex = (handCount - 1) / 2;

  const dragOverlay = document.createElement('div');
  dragOverlay.className = 'drag-overlay';
  const dragArrow = document.createElement('div');
  dragArrow.className = 'drag-arrow';
  const dragGhost = document.createElement('div');
  dragGhost.className = 'drag-ghost';
  dragOverlay.appendChild(dragArrow);
  dragOverlay.appendChild(dragGhost);
  screen.appendChild(dragOverlay);

  let activeDrag: DragState | null = null;

  const findDropTarget = (element: Element | null): HTMLElement | null => {
    while (element && element !== screen) {
      if (element.classList.contains('enemy-card') || element.classList.contains('player-drop-target')) {
        return element as HTMLElement;
      }
      element = element.parentElement;
    }
    return null;
  };

  const clearActiveTarget = (target: HTMLElement | null): void => {
    if (target) {
      target.classList.remove('active-target');
    }
  };

  const cleanupDrag = (): void => {
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
    dragOverlay.classList.remove('active');
    dragGhost.classList.remove('visible');
    dragArrow.style.width = '0';
    if (activeDrag) {
      activeDrag.wrapper.classList.remove('drag-source');
      clearActiveTarget(activeDrag.target);
    }
    activeDrag = null;
  };

  const onPointerMove = (event: PointerEvent): void => {
    event.preventDefault();
    if (!activeDrag) return;
    updateDrag(event.clientX, event.clientY);
  };

  const onPointerUp = (event: PointerEvent): void => {
    event.preventDefault();
    if (!activeDrag) return;
    const droppedTarget = activeDrag.target;
    const cardInst = activeDrag.cardInst;
    cleanupDrag();

    if (!droppedTarget) return;

    if (droppedTarget.dataset.enemyId) {
      gameManager.updateState((s) => playCard(s, cardInst.instanceId, droppedTarget.dataset.enemyId!));
    } else if (droppedTarget.dataset.dropTarget === 'player') {
      gameManager.updateState((s) => playCard(s, cardInst.instanceId));
    }
  };

  const updateDrag = (clientX: number, clientY: number): void => {
    if (!activeDrag) return;
    const screenRect = screen.getBoundingClientRect();
    const x = clientX - screenRect.left;
    const y = clientY - screenRect.top;

    dragGhost.style.left = `${x}px`;
    dragGhost.style.top = `${y}px`;

    const dx = clientX - activeDrag.originX;
    const dy = clientY - activeDrag.originY;
    const distance = Math.max(18, Math.hypot(dx, dy));
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

    dragArrow.style.left = `${activeDrag.originX - screenRect.left}px`;
    dragArrow.style.top = `${activeDrag.originY - screenRect.top}px`;
    dragArrow.style.width = `${distance}px`;
    dragArrow.style.transform = `rotate(${angle}deg)`;

    const pointed = document.elementFromPoint(clientX, clientY) as Element | null;
    const newTarget = findDropTarget(pointed);
    if (newTarget !== activeDrag.target) {
      clearActiveTarget(activeDrag.target);
      activeDrag.target = newTarget;
      if (newTarget) newTarget.classList.add('active-target');
    }
  };

  const startDrag = (
    cardInst: CardInstance,
    cardEl: HTMLElement,
    wrapper: HTMLElement,
    disabled: boolean,
    event: PointerEvent,
  ): void => {
    if (disabled) return;
    event.preventDefault();
    event.stopPropagation();

    const cardRect = cardEl.getBoundingClientRect();
    const originX = cardRect.left + cardRect.width / 2;
    const originY = cardRect.top + cardRect.height / 2;

    dragGhost.innerHTML = '';
    const clone = cardEl.cloneNode(true) as HTMLElement;
    clone.classList.add('dragging-clone');
    clone.style.width = `${cardRect.width}px`;
    clone.style.height = `${cardRect.height}px`;
    clone.style.margin = '0';
    dragGhost.appendChild(clone);

    dragGhost.style.width = `${cardRect.width}px`;
    dragGhost.style.height = `${cardRect.height}px`;
    dragGhost.classList.add('visible');
    dragOverlay.classList.add('active');
    wrapper.classList.add('drag-source');

    activeDrag = {
      cardInst,
      originX,
      originY,
      wrapper,
      target: null,
    };

    updateDrag(event.clientX, event.clientY);
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
  };

  for (const [index, cardInst] of state.combat.hand.entries()) {
    const def = getCard(cardInst.definitionId);
    if (!def) continue;

    const disabled = state.energy < getCardCost(def, cardInst.upgraded);
    const wrapper = document.createElement('div');
    wrapper.className = 'hand-card-slot';
    const angle = handCount === 1 ? 0 : ((index - midIndex) / Math.max(handCount - 1, 1)) * spreadAngle;
    wrapper.style.setProperty('--hand-card-angle', `${angle}deg`);

    const cardEl = createCardElement({
      def,
      upgraded: cardInst.upgraded,
      variant: 'hand',
      disabled,
    });

    cardEl.addEventListener('pointerenter', () => {
      cardEl.classList.add('card-hovered');
    });
    cardEl.addEventListener('pointerleave', () => {
      cardEl.classList.remove('card-hovered');
    });
    cardEl.addEventListener('pointerdown', (event) => {
      startDrag(cardInst, cardEl, wrapper, disabled, event as PointerEvent);
    });

    wrapper.appendChild(cardEl);
    hand.appendChild(wrapper);
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
