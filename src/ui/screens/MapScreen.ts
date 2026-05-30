import type { GameState, MapNode, MapNodeType } from '@/entities';
import { gameManager } from '@/core/GameManager';
import { getAvailableNodes, getCurrentNode, getNodeIcon } from '@/systems/map/MapSystem';
import { renderHud } from '@/ui/components/Hud';

const NODE_LABELS: Record<MapNodeType, string> = {
  start: '起点',
  combat: '战斗',
  elite: '精英',
  boss: '首领',
  event: '事件',
  shop: '商店',
  campfire: '篝火',
  treasure: '宝箱',
};

interface NodePosition {
  node: MapNode;
  x: number;
  y: number;
}

function getFloorMap(nodes: MapNode[]): Map<number, MapNode[]> {
  const floors = new Map<number, MapNode[]>();
  for (const node of nodes) {
    if (!floors.has(node.floor)) floors.set(node.floor, []);
    floors.get(node.floor)!.push(node);
  }
  return floors;
}

function buildNodePositions(mapNodes: MapNode[]): {
  positions: Map<string, NodePosition>;
  width: number;
  height: number;
  maxFloor: number;
} {
  const floors = getFloorMap(mapNodes);
  const sortedFloors = [...floors.entries()].sort((a, b) => a[0] - b[0]);
  const maxPerFloor = Math.max(...sortedFloors.map(([, nodes]) => nodes.length), 1);
  const maxFloor = Math.max(...sortedFloors.map(([floor]) => floor), 0);
  const width = Math.max(760, maxPerFloor * 170 + 220);
  const height = Math.max(680, (maxFloor + 1) * 106 + 120);
  const positions = new Map<string, NodePosition>();

  for (const [floor, nodes] of sortedFloors) {
    const y = height - 70 - floor * 96;
    const gap = width / (nodes.length + 1);
    nodes.forEach((node, index) => {
      const x = gap * (index + 1);
      positions.set(node.id, { node, x, y });
    });
  }

  return { positions, width, height, maxFloor };
}

export function renderMapScreen(root: HTMLElement, state: GameState): void {
  if (!state.map) return;

  const screen = document.createElement('div');
  screen.className = 'screen map-screen';

  screen.innerHTML = `
    <div class="screen-header">
      <div>
        <h2>路线地图</h2>
        <p class="screen-subtitle">沿着分支路线选择下一场遭遇</p>
      </div>
      <button class="btn btn-secondary" id="btn-end-run">退出跑图</button>
    </div>
  `;

  screen.appendChild(renderHud(state));

  const currentNode = getCurrentNode(state.map);
  const available = getAvailableNodes(state.map);
  const availableIds = new Set(available.map((n) => n.id));

  const infoPanel = document.createElement('div');
  infoPanel.className = 'map-info-panel';
  infoPanel.innerHTML = `
    <div class="panel map-info-card">
      <h3>当前节点</h3>
      <p>层级：${currentNode?.floor ?? '-'} · 类型：${currentNode ? NODE_LABELS[currentNode.type] : '-'}</p>
      <p>下一步可选：${available.length} 个节点</p>
    </div>
    <div class="map-legend panel">
      <div><span class="map-legend-marker current"></span> 当前节点</div>
      <div><span class="map-legend-marker available"></span> 可选节点</div>
      <div><span class="map-legend-marker visited"></span> 已访问</div>
      <div><span class="map-legend-line"></span> 路线连接</div>
    </div>
  `;
  screen.appendChild(infoPanel);

  const { positions, width, height, maxFloor } = buildNodePositions(state.map.nodes);
  const treeViewport = document.createElement('div');
  treeViewport.className = 'map-tree-viewport';

  const mapEl = document.createElement('div');
  mapEl.className = 'map-tree';
  mapEl.style.width = `${width}px`;
  mapEl.style.height = `${height}px`;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('map-link-layer');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('aria-hidden', 'true');

  for (const node of state.map.nodes) {
    const from = positions.get(node.id);
    if (!from) continue;
    for (const targetId of node.connections) {
      const to = positions.get(targetId);
      if (!to) continue;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const midY = (from.y + to.y) / 2;
      line.setAttribute('d', `M ${from.x} ${from.y - 28} C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${to.y + 28}`);
      line.classList.add('map-link');
      if (node.visited || node.current) line.classList.add('map-link-seen');
      if (node.current && availableIds.has(targetId)) line.classList.add('map-link-available');
      svg.appendChild(line);
    }
  }
  mapEl.appendChild(svg);

  for (let floor = 0; floor <= maxFloor; floor += 1) {
    const y = height - 70 - floor * 96;
    const label = document.createElement('span');
    label.className = 'map-floor-label';
    label.style.top = `${y}px`;
    label.textContent = floor === maxFloor ? '首领' : `第 ${floor} 层`;
    mapEl.appendChild(label);
  }

  for (const { node, x, y } of positions.values()) {
    const btn = document.createElement('button');
    btn.className = `map-node map-node-${node.type}`;
    btn.style.left = `${x}px`;
    btn.style.top = `${y}px`;
    if (node.current) btn.classList.add('current');
    if (node.visited) btn.classList.add('visited');
    if (availableIds.has(node.id)) btn.classList.add('available');
    btn.disabled = !availableIds.has(node.id);
    btn.title = `节点类型：${NODE_LABELS[node.type]}`;
    btn.innerHTML = `
      <span class="map-node-icon">${getNodeIcon(node.type)}</span>
      <span class="map-node-label">${NODE_LABELS[node.type]}</span>
    `;
    btn.addEventListener('click', () => gameManager.selectMapNode(node.id));
    mapEl.appendChild(btn);
  }

  treeViewport.appendChild(mapEl);
  screen.appendChild(treeViewport);
  root.appendChild(screen);

  screen.querySelector('#btn-end-run')?.addEventListener('click', () => gameManager.returnToMenu());
}
