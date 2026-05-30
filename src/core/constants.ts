/** 游戏全局常量 — 数值平衡在此调整 */

export const GAME = {
  /** 每回合基础能量 */
  BASE_ENERGY: 3,
  /** 初始手牌上限（抽牌数） */
  DRAW_PER_TURN: 5,
  /** 初始最大生命 */
  DEFAULT_MAX_HP: 70,
  /** 初始金币 */
  STARTING_GOLD: 99,
  /** 普通战斗卡牌奖励数量 */
  CARD_REWARD_COUNT: 3,
  /** 药水掉落概率 (0-1) */
  POTION_DROP_CHANCE: 0.4,
  /** 商店移除卡牌基础价格 */
  REMOVE_CARD_COST: 75,
} as const;

/** 地图层数（Act 数，Demo 默认 1 层） */
export const MAP = {
  FLOORS: 15,
  /** 每层 Boss 前精英数量 */
  ELITE_COUNT: 2,
  /** 问号事件节点比例上限 */
  MAX_EVENT_RATIO: 0.25,
} as const;

/** 战斗奖励金币范围 */
export const REWARD_GOLD = {
  normal: { min: 10, max: 20 },
  elite: { min: 25, max: 35 },
  boss: { min: 95, max: 105 },
} as const;

/** 商店价格基准 */
export const SHOP_PRICES = {
  card: { min: 50, max: 80 },
  relic: { min: 150, max: 250 },
  potion: { min: 50, max: 75 },
} as const;

/** 篝火恢复生命比例 */
export const CAMPFIRE = {
  HEAL_RATIO: 0.3,
} as const;

/** GitHub Pages 仓库名 — 需与 vite.config.ts 中 REPO_NAME 一致 */
export const GITHUB_REPO_NAME = 'X-card';
