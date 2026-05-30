import type { GameState } from '@/entities';
import { gameManager } from '@/core/GameManager';
import { getAvailableNodes, getCurrentNode, getNodeIcon } from '@/systems/map/MapSystem';
import { renderHud } from '@/ui/components/Hud';

export function renderMapScreen(root: HTMLElement, state: GameState): void {
  if (!state.map) return;

  const screen = document.createElement('div');
  screen.className = 'screen map-screen';

  screen.innerHTML = `
    <div class="screen-header">
      <div>
        <h2>路线地图</h2>
        <p class="screen-subtitle">选择一个节点继续冒险</p>
      </div>
      <button class="btn btn-secondary" id="btn-end-run">退出跑图</button>
    </div>
  `;

  screen.appendChild(renderHud(state));

  const currentNode = getCurrentNode(state.map);
  const available = getAvailableNodes(state.map);

  const infoPanel = document.createElement('div');
  infoPanel.className = 'map-info-panel';
  infoPanel.innerHTML = `
    <div class="panel map-info-card">
      <h3>当前节点</h3>
      <p>层级：${currentNode?.floor ?? '-'} · 类型：${currentNode?.type ?? '-'}</p>
      <p>下一步可选：${available.length} 个节点</p>
    </div>
  `;
  screen.appendChild(infoPanel);

  const mapEl = document.createElement('div');
  mapEl.className = 'map-container';

  const floors = new Map<number, typeof state.map.nodes>();
  for (const node of state.map.nodes) {
    if (!floors.has(node.floor)) floors.set(node.floor, []);
    floors.get(node.floor)!.push(node);
  }

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
      btn.textContent = `${getNodeIcon(node.type)} ${node.type}`;
      btn.title = `节点类型：${node.type}`;
      btn.addEventListener('click', () => gameManager.selectMapNode(node.id));
      row.appendChild(btn);
    }
    mapEl.appendChild(row);
  }

  screen.appendChild(mapEl);
  root.appendChild(screen);

  screen.querySelector('#btn-end-run')?.addEventListener('click', () => gameManager.returnToMenu());
}
