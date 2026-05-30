/** 卡牌类型 */
export type CardType = 'attack' | 'skill' | 'power';

/** 卡牌稀有度 */
export type CardRarity = 'basic' | 'common' | 'uncommon' | 'rare';

/** 卡牌升级标记 */
export interface CardUpgrade {
  cost?: number;
  damage?: number;
  block?: number;
  description?: string;
}

/** 卡牌美术资源 — 图片路径相对 public/ 目录，或使用完整 URL */
export interface CardArt {
  /** 卡牌立绘/插图，如 `assets/cards/strike.png` */
  image?: string;
  /** 升级后立绘；未设置时沿用 image */
  imageUpgraded?: string;
  /** 卡框样式 id，对应 CSS `.card-frame-{id}`（可选） */
  frame?: string;
  /** 无图片时的背景色/渐变，如 `#2a3f5f` 或 `linear-gradient(...)` */
  background?: string;
  /** 立绘裁剪焦点，CSS object-position，如 `center top`、`50% 30%` */
  imagePosition?: string;
  /** 立绘缩放方式，默认 cover */
  imageFit?: 'cover' | 'contain' | 'fill';
}

/** 卡牌效果 — 由你在 content 中定义具体数值，引擎按 type 执行 */
export interface CardEffect {
  damage?: number;
  block?: number;
  draw?: number;
  energy?: number;
  applyStatus?: { id: string; stacks: number; target: 'enemy' | 'self' | 'all_enemies' };
  custom?: string;
}

/** 卡牌定义（静态数据） */
export interface CardDefinition {
  id: string;
  name: string;
  type: CardType;
  rarity: CardRarity;
  cost: number;
  description: string;
  exhaust?: boolean;
  innate?: boolean;
  upgrade?: CardUpgrade & { effects?: CardEffect };
  effects: CardEffect;
  /** 卡牌美术；也可简写为顶层 image / imageUpgraded（见 CardRegistry 解析） */
  art?: CardArt;
  /** 简写：卡牌立绘路径，等价于 art.image */
  image?: string;
  /** 简写：升级立绘，等价于 art.imageUpgraded */
  imageUpgraded?: string;
  characterId?: string | null;
  _design?: {
    purpose?: string;
    archetype?: string;
    risks?: string;
    balance?: string;
  };
}

/** 运行时卡牌实例 */
export interface CardInstance {
  instanceId: string;
  definitionId: string;
  upgraded: boolean;
}
