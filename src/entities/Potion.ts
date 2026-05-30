export interface PotionDefinition {
  id: string;
  name: string;
  description: string;
  effect: {
    heal?: number;
    block?: number;
    draw?: number;
    energy?: number;
    custom?: string;
  };
  _design?: {
    purpose?: string;
    archetype?: string;
  };
}

export interface PotionInstance {
  definitionId: string;
}
