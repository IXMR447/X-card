import type { GameState } from '@/entities';
import { gameManager } from '@/core/GameManager';
import { getCurrentEvent, resolveEventChoice, leaveEvent } from '@/systems/events/EventSystem';
import { renderHud } from '@/ui/components/Hud';

export function renderEventScreen(root: HTMLElement, state: GameState): void {
  const event = getCurrentEvent(state);
  const screen = document.createElement('div');
  screen.className = 'screen event-screen';
  screen.innerHTML = `
    <div class="screen-header">
      <div>
        <h2>事件</h2>
        <p class="screen-subtitle">选择你的命运</p>
      </div>
      <button class="btn btn-secondary" id="btn-leave-event">离开事件</button>
    </div>
  `;

  screen.appendChild(renderHud(state));

  if (!event) {
    screen.insertAdjacentHTML('beforeend', '<div class="panel"><p>未知事件。</p></div>');
    const btn = document.createElement('button');
    btn.className = 'btn btn-primary';
    btn.textContent = '返回地图';
    btn.addEventListener('click', () => gameManager.updateState((s) => leaveEvent(s)));
    screen.appendChild(btn);
    root.appendChild(screen);
    return;
  }

  screen.insertAdjacentHTML('beforeend', `
    <div class="panel event-panel">
      <h3>${event.title}</h3>
      <p class="event-desc">${event.description}</p>
    </div>
  `);

  for (const choice of event.choices) {
    const btn = document.createElement('button');
    btn.className = 'btn event-choice';
    btn.textContent = choice.text;
    btn.addEventListener('click', () => {
      gameManager.updateState((s) => resolveEventChoice(s, choice.outcomes));
    });
    screen.appendChild(btn);
  }

  root.appendChild(screen);

  screen.querySelector('#btn-leave-event')?.addEventListener('click', () =>
    gameManager.updateState((s) => leaveEvent(s))
  );
}
