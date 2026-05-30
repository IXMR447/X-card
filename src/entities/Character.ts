export interface CharacterDefinition {
  id: string;
  name: string;
  title: string;
  maxHp: number;
  startingGold: number;
  startingDeck: string[];
  startingRelics: string[];
  description: string;
  color: string;
  /** 角色头像/立绘，相对 public/，如 `assets/characters/wanderer.png` */
  portrait?: string;
  _design?: {
    purpose?: string;
    archetypes?: string[];
    risks?: string;
    balance?: string;
  };
}
