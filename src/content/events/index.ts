/** 事件内容目录 — 本最小版本包含 2 个事件 */

import { registerEvents, registerOutcomes } from '@/core/registries/EventRegistry';

registerOutcomes([
  { id: 'event_gain_gold_20', type: 'gain_gold', value: 20, description: '获得 20 金币' },
  { id: 'event_lose_hp_6', type: 'lose_hp', value: 6, description: '失去 6 点生命' },
  { id: 'event_gain_hp_10', type: 'gain_hp', value: 10, description: '恢复 10 点生命' },
  { id: 'event_upgrade_random_card', type: 'upgrade_random_card', description: '升级你的一张随机卡牌' },
  { id: 'event_gain_relic', type: 'gain_relic', value: 'spark_capacitor', description: '获得火焰电容' },
]);

registerEvents([
  {
    id: 'rusted_cache',
    title: '生锈的补给箱',
    description: '路边发现一个半埋的补给箱，里面有些古旧道具。',
    choices: [
      { id: 'open', text: '打开补给箱，拿走金币', outcomes: ['event_gain_gold_20'] },
      { id: 'leave', text: '谨慎离开，吸收余温', outcomes: ['event_gain_hp_10'] },
    ],
    _design: {
      purpose: '提供直接收益与安全选择，缓和前期资源紧张',
      tension: '金币与生命之间的权衡',
      risks: '收益过高会使该事件成为必选点',
      balance: '调整金币与恢复值，让两种选择都具备价值',
    },
  },
  {
    id: 'frozen_fount',
    title: '冰封圣泉',
    description: '一处圣泉被冰霜覆盖，喝下后仿佛能唤醒某种潜能。',
    choices: [
      { id: 'upgrade', text: '将一张卡牌升阶', outcomes: ['event_upgrade_random_card'] },
      { id: 'relic', text: '牺牲一些生命，获得遗物', outcomes: ['event_lose_hp_6', 'event_gain_relic'] },
    ],
    _design: {
      purpose: '构建风险与奖励并存的事件体验',
      tension: '短期生命与长期卡组提升之间的抉择',
      risks: '若生命代价过低，会削弱选择平衡',
      balance: '让升级与遗物各有适合场景',
    },
  },
]);
