import type { GameState } from '@/entities';
import { gameManager } from '@/core/GameManager';
import { getCurrentEvent, resolveEventChoice, leaveEvent } from '@/systems/events/EventSystem';
import { renderHud } from '@/ui/components/Hud';

export function renderEventScreen(root: HTMLElement, state: GameState): void {
  const event = getCurrentEvent(state);
  const screen = document.createElement('div');
  screen.className = 'screen event-screen';
  screen.appendChild(renderHud(state));

  if (!event) {
    screen.innerHTML += '<p>未知事件</p>';
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.textContent = '离开';
    btn.addEventListener('click', () => gameManager.updateState((s) => leaveEvent(s)));
    screen.appendChild(btn);
    root.appendChild(screen);
    return;
  }

  screen.innerHTML += `
    <h2>${event.title}</h2>
    <p class="event-desc">${event.description}</p>
  `;

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
}
