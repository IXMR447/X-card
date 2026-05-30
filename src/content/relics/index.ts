/** 遗物内容目录 — 本最小版本包含 5 个遗物 */

import { registerRelics } from '@/core/registries/RelicRegistry';
import type { RelicDefinition } from '@/entities';

const MINIMAL_RELICS: RelicDefinition[] = [
  {
    id: 'flux_core',
    name: '能量核心',
    rarity: 'starter',
    description: '战斗开始时，获得 1 点能量。',
    trigger: 'battle_start',
    effect: { value: 1, target: 'energy' },
    _design: {
      purpose: '让破流者在首回合就能展开核心节奏',
      archetype: '能量循环',
      risks: '过高起手能量可能降低初始手牌挑战',
      balance: '只在战斗开始触发一次，保持早期优势而不至于失衡',
    },
  },
  {
    id: 'glacial_globe',
    name: '冰晶球',
    rarity: 'starter',
    description: '战斗开始时，获得 4 点格挡。',
    trigger: 'battle_start',
    effect: { value: 4, target: 'block' },
    _design: {
      purpose: '让霜寻者稳健度过第一张手牌',
      archetype: '防御开局',
      risks: '数值过高会让低费防御卡失去使用价值',
      balance: '仅在战斗第一回合生效，兼顾容错与成长空间',
    },
  },
  {
    id: 'spark_capacitor',
    name: '火焰电容',
    rarity: 'common',
    description: '每回合打出 2 张技能牌时，获得 1 点能量。',
    trigger: 'on_play_card',
    effect: { value: 1, target: 'energy', custom: 'skill_threshold' },
    _design: {
      purpose: '鼓励技能牌与能量循环组合',
      archetype: '节奏加速',
      risks: '依赖计数逻辑，如果回合卡牌数量偏低则效果冷门',
      balance: '提供额外收益但需要卡组搭配',
    },
  },
  {
    id: 'frozen_amulet',
    name: '寒霜护符',
    rarity: 'common',
    description: '回合开始时，获得 2 点格挡。',
    trigger: 'turn_start',
    effect: { value: 2, target: 'block' },
    _design: {
      purpose: '稳定提供额外防御，适合控制与慢热流',
      archetype: '被动防御',
      risks: '数值太高会使防御牌边缘化',
      balance: '小量持续收益，适合作为防御体系补充',
    },
  },
  {
    id: 'treasure_compass',
    name: '寻宝指南针',
    rarity: 'rare',
    description: '每次获得奖励后，额外获得 10 金币。',
    trigger: 'on_reward',
    effect: { value: 10, target: 'gold' },
    _design: {
      purpose: '增加探索收益，让玩家更愿意选择高风险节点',
      archetype: '收益增强',
      risks: '如果金币收益过高，会降低商店决策价值',
      balance: '只触发奖励节点，避免直接增加战斗输出',
    },
  },
];

registerRelics(MINIMAL_RELICS);
