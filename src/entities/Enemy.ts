export type IntentType =
  | 'attack'
  | 'defend'
  | 'buff'
  | 'debuff'
  | 'summon'
  | 'unknown';

export interface EnemyIntent {
  type: IntentType;
  label: string;
  value?: number;
  statusId?: string;
  statusStacks?: number;
}

export interface EnemyMove {
  intents: EnemyIntent[];
  actions?: {
    damage?: number;
    block?: number;
    summonEnemyId?: string;
    applyStatus?: { id: string; stacks: number; target: 'player' };
  };
}

export type EnemyTier = 'normal' | 'elite' | 'boss';

export interface EnemyDefinition {
  id: string;
  name: string;
  tier: EnemyTier;
  maxHp: number;
  moves: EnemyMove[];
  initialStatuses?: { id: string; stacks: number }[];
  _design?: {
    purpose?: string;
    counterplay?: string;
    risks?: string;
    balance?: string;
  };
}

export interface EnemyInstance {
  instanceId: string;
  definitionId: string;
  hp: number;
  block: number;
  moveIndex: number;
  statuses: Map<string, number>;
}
