/** 敌人内容目录 — 本最小版本包含 2 个普通敌人、1 个精英、1 个 Boss */

import { registerEnemies } from '@/core/registries/EnemyRegistry';
import type { EnemyDefinition } from '@/entities';

const MINIMAL_ENEMIES: EnemyDefinition[] = [
  {
    id: 'scrap_walker',
    name: '废铁行者',
    tier: 'normal',
    maxHp: 28,
    moves: [
      { intents: [{ type: 'attack', label: '钢爪', value: 6 }], actions: { damage: 6 } },
      { intents: [{ type: 'defend', label: '铁甲', value: 5 }], actions: { block: 5 } },
    ],
    _design: {
      purpose: '基础近战敌人，帮助玩家熟悉意图提示',
      counterplay: '适合使用基础格挡与低耗攻击',
      risks: '生命与伤害过高会让前期普通战变得过于枯燥',
      balance: '保持简单模式，适合作为第一类对手',
    },
  },
  {
    id: 'cinder_scout',
    name: '炽焰侦察',
    tier: 'normal',
    maxHp: 24,
    moves: [
      { intents: [{ type: 'attack', label: '灼烧弹', value: 5 }], actions: { damage: 5 } },
      {
        intents: [{ type: 'buff', label: '点燃' }],
        actions: { applyStatus: { id: 'burn', stacks: 2, target: 'player' } },
      },
    ],
    _design: {
      purpose: '引导玩家关注非单纯伤害的敌人意图',
      counterplay: '通过优先击杀或防御应对灼烧效果',
      risks: '若灼烧效果过强，会使控制卡牌不必要',
      balance: '灼烧应为轻度持续压力，而非瞬间爆发',
    },
  },
  {
    id: 'iron_pillager',
    name: '铁甲掠夺者',
    tier: 'elite',
    maxHp: 68,
    moves: [
      { intents: [{ type: 'defend', label: '屹立', value: 12 }], actions: { block: 12 } },
      { intents: [{ type: 'attack', label: '破甲重击', value: 14 }], actions: { damage: 14 } },
      {
        intents: [{ type: 'buff', label: '强化' }],
        actions: { applyStatus: { id: 'strength', stacks: 2, target: 'player' } },
      },
    ],
    _design: {
      purpose: '精英敌人兼具防御与爆发，考验玩家决策',
      counterplay: '用有限格挡与先发制人消耗其防御',
      risks: '如果强化过强，会让精英难度失衡',
      balance: '防御和攻击之间保持可预测循环',
    },
  },
  {
    id: 'storm_colossus',
    name: '风暴巨像',
    tier: 'boss',
    maxHp: 120,
    moves: [
      {
        intents: [{ type: 'buff', label: '雷霆回响' }],
        actions: { block: 10 },
      },
      { intents: [{ type: 'attack', label: '冲击波', value: 18 }], actions: { damage: 18 } },
      {
        intents: [{ type: 'attack', label: '连环重击', value: 10 }],
        actions: { damage: 10 },
      },
    ],
    _design: {
      purpose: 'Boss 应提供持续输出与周期防御',
      counterplay: '管理好回合节奏并根据意图选择进攻或防御',
      risks: '若过早进入强力攻击，会削弱玩家探索动力',
      balance: '让战斗在第三阶段仍保留可控性',
    },
  },
];

registerEnemies(MINIMAL_ENEMIES);
