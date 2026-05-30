import type { MapGenerationConfig } from '@/entities';

/** 地图生成配置 — 本最小版本为 12 层 Act，包含精英与 Boss 节点 */
export const mapConfig: MapGenerationConfig = {
  floors: 12,
  pathsPerFloor: 3,
  nodeWeights: {
    combat: 45,
    event: 15,
    shop: 10,
    campfire: 12,
    treasure: 8,
    elite: 10,
  },
  guaranteedNodes: {
    3: ['campfire'],
    6: ['shop'],
  },
  eliteFloors: [4, 8],
  bossFloor: 12,
};
