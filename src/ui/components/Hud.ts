import type { GameState } from '@/entities';

export function renderHud(state: GameState): HTMLElement {
  const hud = document.createElement('div');
  hud.className = 'hud';
  hud.innerHTML = `
    <span class="hud-item hud-hp"><strong>HP</strong> ${state.hp}/${state.maxHp}</span>
    <span class="hud-item hud-gold"><strong>金钱</strong> ${state.gold}</span>
    <span class="hud-item hud-energy"><strong>能量</strong> ${state.energy}/${state.maxEnergy}</span>
    <span class="hud-item hud-deck"><strong>卡组</strong> ${state.deck.length}</span>
    <span class="hud-item hud-relics"><strong>遗物</strong> ${state.relics.length}</span>
  `;
  return hud;
}
