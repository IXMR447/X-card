import { registerEnemies } from '@/core/registries/EnemyRegistry';
import type { EnemyDefinition } from '@/entities';

const MINIMAL_ENEMIES: EnemyDefinition[] = [
  {
    id: 'scrap_walker',
    name: '废铁行者',
    tier: 'normal',
    maxHp: 32,
    moves: [
      { intents: [{ type: 'attack', label: '钢爪', value: 6 }], actions: { damage: 6 } },
      { intents: [{ type: 'defend', label: '铁甲', value: 6 }], actions: { block: 6 } },
      { intents: [{ type: 'attack', label: '重踏', value: 8 }], actions: { damage: 8 } },
    ],
  },
  {
    id: 'cinder_scout',
    name: '炽焰侦察',
    tier: 'normal',
    maxHp: 26,
    moves: [
      { intents: [{ type: 'attack', label: '连射', value: 4, hits: 2 }], actions: { damage: 4, hits: 2 } },
      {
        intents: [{ type: 'debuff', label: '灼烧', statusId: 'burn', statusStacks: 2 }],
        actions: { applyStatus: { id: 'burn', stacks: 2, target: 'player' } },
      },
      {
        intents: [{ type: 'debuff', label: '烟幕', statusId: 'weak', statusStacks: 1 }],
        actions: { applyStatus: { id: 'weak', stacks: 1, target: 'player' } },
      },
    ],
  },
  {
    id: 'iron_pillager',
    name: '铁甲掠夺者',
    tier: 'elite',
    maxHp: 72,
    moves: [
      { intents: [{ type: 'defend', label: '屹立', value: 12 }], actions: { block: 12 } },
      { intents: [{ type: 'attack', label: '破甲重击', value: 14 }], actions: { damage: 14 } },
      {
        intents: [{ type: 'buff', label: '强化', statusId: 'strength', statusStacks: 2 }],
        actions: { applyStatus: { id: 'strength', stacks: 2, target: 'self' } },
      },
      { intents: [{ type: 'attack', label: '碾压', value: 9, hits: 2 }], actions: { damage: 9, hits: 2 } },
    ],
  },
  {
    id: 'storm_colossus',
    name: '风暴巨像',
    tier: 'boss',
    maxHp: 128,
    initialStatuses: [{ id: 'strength', stacks: 1 }],
    moves: [
      {
        intents: [
          { type: 'defend', label: '雷盾', value: 12 },
          { type: 'buff', label: '充能', statusId: 'strength', statusStacks: 1 },
        ],
        actions: {
          block: 12,
          applyStatus: { id: 'strength', stacks: 1, target: 'self' },
        },
      },
      { intents: [{ type: 'attack', label: '冲击波', value: 18 }], actions: { damage: 18 } },
      {
        intents: [
          { type: 'attack', label: '连环重击', value: 7, hits: 3 },
          { type: 'debuff', label: '震荡', statusId: 'vulnerable', statusStacks: 1 },
        ],
        actions: {
          damage: 7,
          hits: 3,
          applyStatus: { id: 'vulnerable', stacks: 1, target: 'player' },
        },
      },
    ],
  },
];

registerEnemies(MINIMAL_ENEMIES);
