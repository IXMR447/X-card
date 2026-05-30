import { registerPotions } from '@/core/registries/PotionRegistry';

registerPotions([
  {
    id: 'healing_draught',
    name: '治疗饮剂',
    description: '立即恢复 18 点生命。',
    effect: { heal: 18 },
    _design: {
      purpose: '提供稳定的生命回复道具',
      archetype: '生存',
    },
  },
  {
    id: 'clarity_tea',
    name: '澄明茶',
    description: '抽 2 张牌。',
    effect: { draw: 2 },
    _design: {
      purpose: '增强卡组循环与手牌活力',
      archetype: '过牌',
    },
  },
]);
