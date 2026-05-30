export type MapNodeType =
  | 'start'
  | 'combat'
  | 'elite'
  | 'boss'
  | 'event'
  | 'shop'
  | 'campfire'
  | 'treasure';

export interface MapNode {
  id: string;
  type: MapNodeType;
  floor: number;
  connections: string[];
  visited: boolean;
  current: boolean;
  enemyId?: string;
  eventId?: string;
}

export interface GameMap {
  act: number;
  nodes: MapNode[];
  currentNodeId: string;
}

export interface MapGenerationConfig {
  floors: number;
  pathsPerFloor: number;
  nodeWeights: Partial<Record<MapNodeType, number>>;
  guaranteedNodes: Partial<Record<number, MapNodeType[]>>;
  eliteFloors: number[];
  bossFloor: number;
}
