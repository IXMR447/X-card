/**
 * 角色内容目录 — 本最小版本包含 2 个角色
 */

import { registerCharacter } from '@/core/registries/CharacterRegistry';
import type { CharacterDefinition } from '@/entities';

export const FLUXBREAKER: CharacterDefinition = {
  id: 'fluxbreaker',
  name: '破流者',
  title: '断流者',
  maxHp: 72,
  startingGold: 80,
  startingDeck: [
    'strike',
    'strike',
    'defend',
    'defend',
    'spark_dash',
    'battery_shield',
    'overcharge',
    'conduit_strike',
  ],
  startingRelics: ['flux_core'],
  description: '擅长将能量凝聚成快速打击，擅长在战斗中借势反击。',
  color: '#d97632',
  portrait: 'assets/characters/fluxbreaker.png',
  _design: {
    purpose: '提供节奏型输出与能量循环体验',
    archetypes: ['能量回血', '连击', '快攻'],
    risks: '若过多依赖技能或弱化能量增益，前期手牌可能被锁死',
    balance: '起手两张攻击两张防御保证基础稳定，独特技能略强于基础卡但不要过早失衡',
  },
};

export const FROSTSEEKER: CharacterDefinition = {
  id: 'frostseeker',
  name: '霜寻者',
  title: '寒冰贤者',
  maxHp: 68,
  startingGold: 90,
  startingDeck: [
    'strike',
    'strike',
    'defend',
    'defend',
    'frost_bolt',
    'ice_barrier',
    'chill_mine',
    'glacial_focus',
  ],
  startingRelics: ['glacial_globe'],
  description: '借助寒冰构筑战场节奏，以控制和循环资源压制对手。',
  color: '#3c81c9',
  portrait: 'assets/characters/frostseeker.png',
  _design: {
    purpose: '构建慢热控制流，利用冰霜效果保命与过牌',
    archetypes: ['控制', '过牌', '防御反击'],
    risks: '早期单体输出较弱，需要合理防御与抽牌',
    balance: '初期卡牌应能在前几层提供稳定控制，避免过度依赖特定组合',
  },
};

registerCharacter(FLUXBREAKER);
registerCharacter(FROSTSEEKER);
