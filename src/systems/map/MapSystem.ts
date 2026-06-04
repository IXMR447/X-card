import type { GameMap, MapGenerationConfig, MapNode, MapNodeType } from '@/entities';
import { pickRandomEnemy } from '@/core/registries/EnemyRegistry';
import { pickRandomEvent } from '@/core/registries/EventRegistry';
import { randomInt } from '@/utils/random';

const NODE_ICONS: Record<MapNodeType, string> = {
  start: '⌂',
  combat: '⚔',
  elite: '✦',
  boss: '♛',
  event: '✧',
  shop: '◆',
  campfire: '☄',
  treasure: '◇',
};

export function getNodeIcon(type: MapNodeType): string {
  return NODE_ICONS[type];
}

export function generateMap(config: MapGenerationConfig, act = 1): GameMap {
  const nodes: MapNode[] = [];
  let nodeCounter = 0;

  const createNode = (floor: number, type: MapNodeType): MapNode => {
    nodeCounter += 1;
    const node: MapNode = {
      id: `n_${floor}_${nodeCounter}`,
      type,
      floor,
      connections: [],
      visited: false,
      current: false,
    };
    if (type === 'combat' || type === 'elite' || type === 'boss') {
      const tier = type === 'boss' ? 'boss' : type === 'elite' ? 'elite' : 'normal';
      const enemy = pickRandomEnemy(tier);
      if (enemy) node.enemyId = enemy.id;
    }
    if (type === 'event') {
      const event = pickRandomEvent();
      if (event) node.eventId = event.id;
    }
    return node;
  };

  const start = createNode(0, 'start');
  start.current = true;
  nodes.push(start);

  for (let floor = 1; floor < config.bossFloor; floor++) {
    const guaranteed = config.guaranteedNodes[floor] ?? [];
    const nodeCount = config.pathsPerFloor + randomInt(0, 2);

    for (let i = 0; i < nodeCount; i++) {
      let type: MapNodeType;
      if (guaranteed[i]) {
        type = guaranteed[i];
      } else if (config.eliteFloors.includes(floor)) {
        type =
          Math.random() < 0.35
            ? 'elite'
            : weightedPick(config.nodeWeights, ['combat', 'event', 'shop', 'campfire', 'treasure']);
      } else {
        type = weightedPick(config.nodeWeights, ['combat', 'event', 'shop', 'campfire', 'treasure']);
      }
      nodes.push(createNode(floor, type));
    }
  }

  const boss = createNode(config.bossFloor, 'boss');
  nodes.push(boss);

  connectLayers(nodes, config.bossFloor);

  return {
    act,
    nodes,
    currentNodeId: start.id,
  };
}

function weightedPick(
  weights: Partial<Record<MapNodeType, number>>,
  fallback: MapNodeType[],
): MapNodeType {
  const entries = Object.entries(weights).filter(([, w]) => (w ?? 0) > 0) as [MapNodeType, number][];
  if (entries.length === 0) {
    return fallback[randomInt(0, fallback.length - 1)];
  }
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let roll = Math.random() * total;
  for (const [type, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return type;
  }
  return entries[entries.length - 1][0];
}

function connectLayers(nodes: MapNode[], bossFloor: number): void {
  const byFloor = new Map<number, MapNode[]>();
  for (const node of nodes) {
    if (!byFloor.has(node.floor)) byFloor.set(node.floor, []);
    byFloor.get(node.floor)!.push(node);
  }

  for (let floor = 0; floor < bossFloor; floor++) {
    const current = byFloor.get(floor) ?? [];
    const next = byFloor.get(floor + 1) ?? [];
    if (next.length === 0) continue;

    for (const node of current) {
      const targets = pickConnections(next);
      node.connections = targets.map((t) => t.id);
    }

    ensureIncomingConnections(current, next);
  }
}

function pickConnections(nextLayer: MapNode[]): MapNode[] {
  const shuffled = [...nextLayer].sort(() => Math.random() - 0.5);
  const count = Math.min(shuffled.length, randomInt(2, 3));
  return shuffled.slice(0, count);
}

function ensureIncomingConnections(previousLayer: MapNode[], nextLayer: MapNode[]): void {
  if (previousLayer.length === 0) return;

  for (const target of nextLayer) {
    const hasIncoming = previousLayer.some((node) => node.connections.includes(target.id));
    if (hasIncoming) continue;

    const source = previousLayer[randomInt(0, previousLayer.length - 1)];
    source.connections.push(target.id);
  }
}

export function getAvailableNodes(map: GameMap): MapNode[] {
  const current = map.nodes.find((n) => n.id === map.currentNodeId);
  if (!current) return [];
  return map.nodes.filter((n) => current.connections.includes(n.id));
}

export function moveToNode(map: GameMap, nodeId: string): GameMap {
  const current = map.nodes.find((n) => n.id === map.currentNodeId);
  const target = map.nodes.find((n) => n.id === nodeId);
  if (!current || !target || !current.connections.includes(nodeId)) {
    return map;
  }
  current.current = false;
  current.visited = true;
  target.current = true;
  return { ...map, currentNodeId: nodeId };
}

export function getCurrentNode(map: GameMap): MapNode | undefined {
  return map.nodes.find((n) => n.id === map.currentNodeId);
}
