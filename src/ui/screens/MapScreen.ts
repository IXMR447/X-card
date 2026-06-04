import type { GameState, MapNode, MapNodeType } from '@/entities';
import { gameManager } from '@/core/GameManager';
import { getCharacter } from '@/core/registries/CharacterRegistry';
import { getAvailableNodes, getCurrentNode, getNodeIcon } from '@/systems/map/MapSystem';
import { resolveAssetUrl } from '@/utils/assets';

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

const MAP_FLOOR_GAP = 260;
const MAP_BOTTOM_PADDING = 150;
const MAP_TOP_PADDING = 260;

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
  const width = Math.max(1320, maxPerFloor * 260 + 420);
  const height = Math.max(2500, maxFloor * MAP_FLOOR_GAP + MAP_TOP_PADDING + MAP_BOTTOM_PADDING);
  const positions = new Map<string, NodePosition>();

  for (const [floor, nodes] of sortedFloors) {
    const y = height - MAP_BOTTOM_PADDING - floor * MAP_FLOOR_GAP;
    const gap = width / (nodes.length + 1);
    nodes.forEach((node, index) => {
      const wave = Math.sin((floor + index) * 1.35) * 30;
      const x = gap * (index + 1) + wave;
      positions.set(node.id, { node, x, y });
    });
  }

  return { positions, width, height, maxFloor };
}

function getNodeStateClass(node: MapNode, availableIds: Set<string>, currentFloor: number): string {
  if (node.current) return 'current';
  if (availableIds.has(node.id)) return 'available';
  if (node.visited) return 'visited';
  if (node.floor < currentFloor) return 'bypassed';
  return 'locked';
}

export function renderMapScreen(root: HTMLElement, state: GameState): void {
  if (!state.map) return;

  const character = getCharacter(state.characterId);
  const portrait = character?.portrait ? resolveAssetUrl(character.portrait) : '';
  const heroName = character?.name ?? '未知旅者';
  const heroTitle = character?.title ?? '远征者';

  const screen = document.createElement('div');
  screen.className = 'screen map-screen';
  screen.innerHTML = `
    <div class="screen-header map-header">
      <div>
        <p class="map-kicker">The Fated Chart</p>
        <h2>命运航图</h2>
        <p class="screen-subtitle">沿着远征箭路选择下一场遭遇，未选择的旧路线会逐渐褪色。</p>
      </div>
      <button class="btn btn-secondary" id="btn-end-run">退出远征</button>
    </div>
  `;

  const currentNode = getCurrentNode(state.map);
  const available = getAvailableNodes(state.map);
  const availableIds = new Set(available.map((n) => n.id));
  const currentFloor = currentNode?.floor ?? 0;

  const heroPanel = document.createElement('div');
  heroPanel.className = 'map-hero-panel';
  heroPanel.innerHTML = `
    <div class="map-hero-portrait" style="${portrait ? `background-image: url('${portrait}')` : ''}">
      ${portrait ? '' : heroName.slice(0, 1)}
    </div>
    <div class="map-hero-copy">
      <span>当前探索者</span>
      <strong>${heroName}</strong>
      <small>${heroTitle}</small>
    </div>
    <div class="map-hero-stats">
      <span><b>HP</b>${state.hp}/${state.maxHp}</span>
      <span><b>金钱</b>${state.gold}</span>
      <span><b>能量</b>${state.energy}/${state.maxEnergy}</span>
      <span><b>卡组</b>${state.deck.length}</span>
      <span><b>遗物</b>${state.relics.length}</span>
    </div>
  `;
  screen.appendChild(heroPanel);

  const infoPanel = document.createElement('div');
  infoPanel.className = 'map-info-panel';
  infoPanel.innerHTML = `
    <div class="panel map-info-card">
      <h3>当前航点</h3>
      <p>层级：${currentNode?.floor ?? '-'} · 类型：${currentNode ? NODE_LABELS[currentNode.type] : '-'}</p>
      <p>下一步可选：${available.length} 个节点</p>
    </div>
  `;
  screen.appendChild(infoPanel);

  const { positions, width, height, maxFloor } = buildNodePositions(state.map.nodes);
  const treeViewport = document.createElement('div');
  treeViewport.className = 'map-tree-viewport';
  treeViewport.style.backgroundImage = `linear-gradient(rgba(38, 23, 12, 0.18), rgba(10, 5, 2, 0.36)), url("${resolveAssetUrl('assets/map/aged-route-map.png')}")`;

  const mapEl = document.createElement('div');
  mapEl.className = 'map-tree';
  mapEl.style.width = `${width}px`;
  mapEl.style.height = `${height}px`;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('map-link-layer');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('aria-hidden', 'true');

  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  defs.innerHTML = `
    <marker id="map-arrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" class="map-arrow-head"></path>
    </marker>
    <marker id="map-arrow-active" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" class="map-arrow-head-active"></path>
    </marker>
  `;
  svg.appendChild(defs);

  for (const node of state.map.nodes) {
    const from = positions.get(node.id);
    if (!from) continue;
    for (const targetId of node.connections) {
      const to = positions.get(targetId);
      if (!to) continue;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      line.setAttribute(
        'd',
        `M ${from.x} ${from.y - 54} C ${from.x} ${from.y - 126}, ${to.x} ${to.y + 126}, ${to.x} ${to.y + 54}`,
      );
      line.classList.add('map-link');
      line.setAttribute('marker-end', 'url(#map-arrow)');
      if (node.visited || node.current) line.classList.add('map-link-seen');
      if (node.current && availableIds.has(targetId)) {
        line.classList.add('map-link-available');
        line.setAttribute('marker-end', 'url(#map-arrow-active)');
      }
      svg.appendChild(line);
    }
  }
  mapEl.appendChild(svg);

  for (let floor = 0; floor <= maxFloor; floor += 1) {
    const y = height - MAP_BOTTOM_PADDING - floor * MAP_FLOOR_GAP;
    const label = document.createElement('span');
    label.className = 'map-floor-label';
    label.style.top = `${y}px`;
    label.textContent = floor === maxFloor ? '首领区域' : `第 ${floor} 层`;
    mapEl.appendChild(label);
  }

  for (const { node, x, y } of positions.values()) {
    const btn = availableIds.has(node.id)
      ? document.createElement('a')
      : document.createElement('span');
    const nodeState = getNodeStateClass(node, availableIds, currentFloor);
    btn.className = `map-node map-node-${node.type} ${nodeState}`;
    btn.style.left = `${x}px`;
    btn.style.top = `${y}px`;
    if (availableIds.has(node.id)) {
      btn.setAttribute('href', `#map-node-${node.id}`);
    } else {
      btn.setAttribute('aria-disabled', 'true');
    }
    btn.title = `${NODE_LABELS[node.type]} · 第 ${node.floor} 层`;
    btn.innerHTML = `
      <span class="map-node-frame" aria-hidden="true"></span>
      <span class="map-node-icon">${getNodeIcon(node.type)}</span>
      <span class="map-node-label">${NODE_LABELS[node.type]}</span>
    `;
    if (availableIds.has(node.id)) {
      btn.addEventListener('click', () => gameManager.selectMapNode(node.id));
    }
    mapEl.appendChild(btn);
  }

  treeViewport.appendChild(mapEl);
  screen.appendChild(treeViewport);
  root.appendChild(screen);

  window.setTimeout(() => {
    treeViewport.scrollTop = treeViewport.scrollHeight;
  }, 0);

  screen.querySelector('#btn-end-run')?.addEventListener('click', () => gameManager.returnToMenu());
}
