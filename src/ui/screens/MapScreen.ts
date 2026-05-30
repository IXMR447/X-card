import type { GameState } from '@/entities';
import { gameManager } from '@/core/GameManager';
import { getAvailableNodes, getNodeIcon } from '@/systems/map/MapSystem';
import { renderHud } from '@/ui/components/Hud';

export function renderMapScreen(root: HTMLElement, state: GameState): void {
  if (!state.map) return;

  const screen = document.createElement('div');
  screen.className = 'screen map-screen';

  const hud = renderHud(state);
  screen.appendChild(hud);

  const mapEl = document.createElement('div');
  mapEl.className = 'map-container';
  mapEl.innerHTML = '<h2>路线地图</h2>';

  const floors = new Map<number, typeof state.map.nodes>();
  for (const node of state.map.nodes) {
    if (!floors.has(node.floor)) floors.set(node.floor, []);
    floors.get(node.floor)!.push(node);
  }

  const available = getAvailableNodes(state.map);
  const availableIds = new Set(available.map((n) => n.id));

  for (const [floor, nodes] of [...floors.entries()].sort((a, b) => a[0] - b[0])) {
    const row = document.createElement('div');
    row.className = 'map-row';
    row.innerHTML = `<span class="floor-label">层 ${floor}</span>`;

    for (const node of nodes) {
      const btn = document.createElement('button');
      btn.className = 'map-node';
      if (node.current) btn.classList.add('current');
      if (node.visited) btn.classList.add('visited');
      if (availableIds.has(node.id)) btn.classList.add('available');
      btn.disabled = !availableIds.has(node.id);
      btn.textContent = getNodeIcon(node.type);
      btn.title = node.type;
      btn.addEventListener('click', () => gameManager.selectMapNode(node.id));
      row.appendChild(btn);
    }
    mapEl.appendChild(row);
  }

  screen.appendChild(mapEl);
  root.appendChild(screen);
}
