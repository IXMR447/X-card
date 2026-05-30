export interface EventChoice {
  id: string;
  text: string;
  condition?: string;
  outcomes: string[];
}

export interface EventDefinition {
  id: string;
  title: string;
  description: string;
  image?: string;
  choices: EventChoice[];
  _design?: {
    purpose?: string;
    tension?: string;
    risks?: string;
    balance?: string;
  };
}

export interface EventOutcome {
  id: string;
  type:
    | 'gain_gold'
    | 'lose_gold'
    | 'gain_hp'
    | 'lose_hp'
    | 'gain_card'
    | 'lose_card'
    | 'gain_relic'
    | 'gain_potion'
    | 'upgrade_random_card'
    | 'custom';
  value?: number | string;
  description: string;
}
