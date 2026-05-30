export type RelicTrigger =
  | 'passive'
  | 'battle_start'
  | 'turn_start'
  | 'turn_end'
  | 'on_play_card'
  | 'on_draw'
  | 'on_discard'
  | 'on_damage_taken'
  | 'on_damage_dealt'
  | 'on_kill'
  | 'on_enter_shop'
  | 'on_reward';

export type RelicRarity = 'starter' | 'common' | 'uncommon' | 'rare' | 'boss';

export interface RelicEffectParams {
  value?: number;
  target?: string;
  custom?: string;
}

export interface RelicDefinition {
  id: string;
  name: string;
  rarity: RelicRarity;
  description: string;
  trigger: RelicTrigger;
  effect: RelicEffectParams;
  handler?: string;
  _design?: {
    purpose?: string;
    archetype?: string;
    risks?: string;
    balance?: string;
  };
}

export interface RelicInstance {
  definitionId: string;
}
