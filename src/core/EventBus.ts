/** 轻量事件总线 — 遗物/能力等在特定时机触发 */

type Listener = (...args: unknown[]) => void;

export class EventBus {
  private listeners = new Map<string, Set<Listener>>();

  on(event: string, listener: Listener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    return () => this.listeners.get(event)?.delete(listener);
  }

  emit(event: string, ...args: unknown[]): void {
    this.listeners.get(event)?.forEach((fn) => fn(...args));
  }

  clear(): void {
    this.listeners.clear();
  }
}

/** 遗物/卡牌等可订阅的游戏时机 */
export const GameEvents = {
  BATTLE_START: 'battle_start',
  BATTLE_END: 'battle_end',
  TURN_START: 'turn_start',
  TURN_END: 'turn_end',
  CARD_PLAYED: 'card_played',
  CARD_DRAWN: 'card_drawn',
  CARD_DISCARDED: 'card_discarded',
  DAMAGE_TAKEN: 'damage_taken',
  DAMAGE_DEALT: 'damage_dealt',
  ENEMY_KILLED: 'enemy_killed',
  HEAL: 'heal',
  ENTER_SHOP: 'enter_shop',
  LEAVE_SHOP: 'leave_shop',
  REWARD_GAINED: 'reward_gained',
  POTION_USED: 'potion_used',
} as const;

export type GameEventName = (typeof GameEvents)[keyof typeof GameEvents];

export const eventBus = new EventBus();
