import type { MapGenerationConfig } from '@/entities';

/** 地图生成配置 — 短 Act，保持路线选择但避免树状图过密 */
export const mapConfig: MapGenerationConfig = {
  floors: 6,
  pathsPerFloor: 2,
  nodeWeights: {
    combat: 45,
    event: 15,
    shop: 10,
    campfire: 12,
    treasure: 8,
    elite: 10,
  },
  guaranteedNodes: {
    2: ['campfire'],
    4: ['shop'],
  },
  eliteFloors: [3, 5],
  bossFloor: 6,
};
