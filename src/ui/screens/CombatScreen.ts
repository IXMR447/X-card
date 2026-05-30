import type { CardDefinition, CardInstance, GameState } from '@/entities';
import { gameManager } from '@/core/GameManager';
import { playCard, endPlayerTurn } from '@/systems/combat/CombatSystem';
import { getCard, getCardCost, getCardEffects } from '@/core/registries/CardRegistry';
import { getCharacter } from '@/core/registries/CharacterRegistry';
import { getEnemy } from '@/core/registries/EnemyRegistry';
import { renderHud } from '@/ui/components/Hud';
import { createCardElement } from '@/ui/components/CardView';
import { resolveAssetUrl } from '@/utils/assets';

interface DragState {
  cardInst: CardInstance;
  originX: number;
  originY: number;
  wrapper: HTMLElement;
  target: HTMLElement | null;
}

const TIER_LABEL: Record<string, string> = {
  normal: '普通',
  elite: '精英',
  boss: '首领',
};

const INTENT_LABEL: Record<string, string> = {
  attack: '攻击',
  defend: '防御',
  buff: '强化',
  debuff: '削弱',
  summon: '召唤',
  unknown: '未知',
};

const INTENT_ICON: Record<string, string> = {
  attack: '!',
  defend: '◆',
  buff: '↑',
  debuff: '↓',
  summon: '+',
  unknown: '?',
};

function cardNeedsEnemyTarget(def: CardDefinition, upgraded: boolean): boolean {
  return Boolean(getCardEffects(def, upgraded).damage);
}

function canDropCardOnTarget(cardInst: CardInstance, target: HTMLElement | null): boolean {
  if (!target) return false;
  const def = getCard(cardInst.definitionId);
  if (!def) return false;
  const needsEnemy = cardNeedsEnemyTarget(def, cardInst.upgraded);
  return needsEnemy ? Boolean(target.dataset.enemyId) : target.dataset.dropTarget === 'player';
}

function getCardPlayReason(def: CardDefinition, cardInst: CardInstance, state: GameState): string {
  const cost = getCardCost(def, cardInst.upgraded);
  if (state.energy < cost) return `能量不足：需要 ${cost} 点能量`;
  return cardNeedsEnemyTarget(def, cardInst.upgraded) ? '拖到敌人身上打出' : '拖到角色身上打出';
}

function placeEffect(screen: HTMLElement, className: string, target: HTMLElement): HTMLElement {
  const screenRect = screen.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const effect = document.createElement('div');
  effect.className = `combat-effect ${className}`;
  effect.style.left = `${targetRect.left - screenRect.left + targetRect.width / 2}px`;
  effect.style.top = `${targetRect.top - screenRect.top + targetRect.height / 2}px`;
  screen.appendChild(effect);
  window.setTimeout(() => effect.remove(), 620);
  return effect;
}

function playCardWithFeedback(
  screen: HTMLElement,
  cardInst: CardInstance,
  target: HTMLElement,
  commit: () => void,
): void {
  const def = getCard(cardInst.definitionId);
  const isAttack = def ? cardNeedsEnemyTarget(def, cardInst.upgraded) : Boolean(target.dataset.enemyId);
  target.classList.add(isAttack ? 'impact-target' : 'buff-target');
  screen.classList.add(isAttack ? 'screen-impact' : 'screen-guard');
  placeEffect(screen, isAttack ? 'combat-effect-slash' : 'combat-effect-shield', target);

  window.setTimeout(() => {
    target.classList.remove('impact-target', 'buff-target');
    screen.classList.remove('screen-impact', 'screen-guard');
    commit();
  }, isAttack ? 270 : 230);
}

export function renderCombatScreen(root: HTMLElement, state: GameState): void {
  if (!state.combat) return;

  const screen = document.createElement('div');
  screen.className = 'screen combat-screen';
  const character = getCharacter(state.characterId);
  screen.innerHTML = `
    <div class="combat-topbar">
      <div>
        <p class="combat-kicker">第 ${state.combat.turn} 回合</p>
        <h2>战斗中</h2>
      </div>
      <div class="combat-piles" aria-label="牌堆信息">
        <span>抽牌 ${state.combat.drawPile.length}</span>
        <span>弃牌 ${state.combat.discardPile.length}</span>
        <span>消耗 ${state.combat.exhaustPile.length}</span>
      </div>
    </div>
  `;
  screen.appendChild(renderHud(state));

  const dragOverlay = document.createElement('div');
  dragOverlay.className = 'drag-overlay';
  const dragArrow = document.createElement('div');
  dragArrow.className = 'drag-arrow';
  const dragGhost = document.createElement('div');
  dragGhost.className = 'drag-ghost';
  dragOverlay.appendChild(dragArrow);
  dragOverlay.appendChild(dragGhost);
  screen.appendChild(dragOverlay);

  const arena = document.createElement('section');
  arena.className = 'combat-arena';

  const enemyArea = document.createElement('div');
  enemyArea.className = 'enemy-area';
  for (const enemy of state.combat.enemies) {
    const def = getEnemy(enemy.definitionId);
    const move = def?.moves[enemy.moveIndex % def.moves.length];
    const firstIntent = move?.intents[0];
    const intentType = firstIntent?.type ?? 'unknown';
    const intentValue = firstIntent?.value !== undefined ? ` ${firstIntent.value}` : '';
    const intentText = `${firstIntent?.label ?? INTENT_LABEL[intentType] ?? '未知'}${intentValue}`;
    const maxHp = def?.maxHp ?? enemy.hp;
    const hpPct = maxHp > 0 ? Math.max(0, Math.min(100, (enemy.hp / maxHp) * 100)) : 0;

    const el = document.createElement('div');
    el.className = `enemy-card enemy-tier-${def?.tier ?? 'normal'}`;
    el.dataset.enemyId = enemy.instanceId;
    el.innerHTML = `
      <div class="enemy-intent-token intent-${intentType}">
        <strong>${INTENT_ICON[intentType] ?? '?'}</strong>
        <span>${intentText}</span>
      </div>
      <div class="enemy-portrait" aria-hidden="true">
        <img class="enemy-sprite" src="${resolveAssetUrl(`assets/enemies/${enemy.definitionId}.svg`)}" alt="${def?.name ?? enemy.definitionId}" />
        <span class="enemy-sprite-fallback">${(def?.name ?? enemy.definitionId).slice(0, 1)}</span>
      </div>
      <div class="enemy-name-row">
        <strong>${def?.name ?? enemy.definitionId}</strong>
        <span>${TIER_LABEL[def?.tier ?? 'normal'] ?? '敌人'}</span>
      </div>
      <div class="enemy-hpbar" aria-label="敌人生命">
        <span style="width: ${hpPct}%"></span>
      </div>
      <div class="enemy-stats">
        <span>HP ${enemy.hp}/${maxHp}</span>
        <span class="${enemy.block ? '' : 'is-empty'}">格挡 ${enemy.block}</span>
      </div>
    `;
    enemyArea.appendChild(el);
  }

  const playerArea = document.createElement('div');
  playerArea.className = 'player-combat-info player-drop-target';
  playerArea.dataset.dropTarget = 'player';
  const hpPct = Math.max(0, Math.min(100, (state.hp / state.maxHp) * 100));
  playerArea.innerHTML = `
    <div class="player-avatar">
      ${
        character?.portrait
          ? `<img class="player-portrait-img" src="${resolveAssetUrl(character.portrait)}" alt="${character.name}" />`
          : '<span>你</span>'
      }
    </div>
    <div class="player-panel-body">
      <div class="player-name-row">
        <strong>${character?.name ?? '探索者'}</strong>
        <span>可将技能/能力牌拖到这里</span>
      </div>
      <div class="player-hpbar"><span style="width: ${hpPct}%"></span></div>
      <div class="player-stats">
        <span>HP ${state.hp}/${state.maxHp}</span>
        <span>格挡 ${state.combat.playerBlock}</span>
        <span>能量 ${state.energy}/${state.maxEnergy}</span>
      </div>
    </div>
  `;

  arena.appendChild(enemyArea);
  arena.appendChild(playerArea);
  screen.appendChild(arena);

  const playHint = document.createElement('div');
  playHint.className = 'play-hint';
  playHint.textContent = '拖动攻击牌到敌人，拖动技能/能力牌到自己。敌人头顶会显示本回合意图。';
  screen.appendChild(playHint);

  const hand = document.createElement('div');
  hand.className = 'hand fan-hand';
  const handCount = state.combat.hand.length;
  const midIndex = (handCount - 1) / 2;
  const spacing = handCount <= 4 ? 12.2 : handCount <= 6 ? 10.7 : handCount <= 8 ? 9.2 : 7.8;
  const spreadAngle = handCount <= 1 ? 0 : Math.min(34, Math.max(14, handCount * 4.4));

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
      target.classList.remove('active-target', 'invalid-target');
    }
  };

  const cleanupDrag = (): void => {
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
    dragOverlay.classList.remove('active');
    dragGhost.classList.remove('visible');
    dragArrow.style.width = '0';
    screen.classList.remove('dragging-card');
    if (activeDrag) {
      activeDrag.wrapper.classList.remove('drag-source');
      clearActiveTarget(activeDrag.target);
    }
    activeDrag = null;
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
    }
    if (activeDrag.target) {
      const valid = canDropCardOnTarget(activeDrag.cardInst, activeDrag.target);
      activeDrag.target.classList.toggle('active-target', valid);
      activeDrag.target.classList.toggle('invalid-target', !valid);
    }
  };

  const onPointerMove = (event: PointerEvent): void => {
    event.preventDefault();
    updateDrag(event.clientX, event.clientY);
  };

  const onPointerUp = (event: PointerEvent): void => {
    event.preventDefault();
    if (!activeDrag) return;
    const droppedTarget = activeDrag.target;
    const cardInst = activeDrag.cardInst;
    const validTarget = canDropCardOnTarget(cardInst, droppedTarget);
    cleanupDrag();

    if (!validTarget || !droppedTarget) return;

    playCardWithFeedback(screen, cardInst, droppedTarget, () => {
      if (droppedTarget.dataset.enemyId) {
        gameManager.updateState((s) => playCard(s, cardInst.instanceId, droppedTarget.dataset.enemyId!));
      } else {
        gameManager.updateState((s) => playCard(s, cardInst.instanceId));
      }
    });
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
    screen.classList.add('dragging-card');
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
    if (disabled) wrapper.classList.add('is-disabled');
    const normalized = index - midIndex;
    const angle = handCount === 1 ? 0 : (normalized / Math.max(handCount - 1, 1)) * spreadAngle;
    wrapper.style.setProperty('--hand-card-angle', `${angle}deg`);
    wrapper.style.setProperty('--hand-card-x', `${normalized * spacing}rem`);
    wrapper.style.setProperty('--hand-card-lift', `${Math.abs(normalized) * -0.28}rem`);
    wrapper.style.zIndex = String(index + 1);

    const cardEl = createCardElement({
      def,
      upgraded: cardInst.upgraded,
      variant: 'hand',
      disabled,
      reason: getCardPlayReason(def, cardInst, state),
    });

    cardEl.addEventListener('pointerenter', () => {
      cardEl.classList.add('card-hovered');
      wrapper.style.zIndex = '50';
    });
    cardEl.addEventListener('pointerleave', () => {
      cardEl.classList.remove('card-hovered');
      wrapper.style.zIndex = String(index + 1);
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
  actions.innerHTML = `
    <div class="energy-orb" aria-label="当前能量">
      <strong>${state.energy}</strong>
      <span>/${state.maxEnergy}</span>
    </div>
  `;
  const endBtn = document.createElement('button');
  endBtn.className = 'btn btn-primary btn-end-turn';
  endBtn.textContent = '结束回合';
  endBtn.addEventListener('click', () => {
    gameManager.updateState((s) => endPlayerTurn(s));
  });
  actions.appendChild(endBtn);
  screen.appendChild(actions);

  root.appendChild(screen);
}
