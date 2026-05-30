import type { GameState } from '@/entities';

export function renderHud(state: GameState): HTMLElement {
  const hud = document.createElement('div');
  hud.className = 'hud';
  hud.innerHTML = `
    <span class="hud-hp">❤ ${state.hp}/${state.maxHp}</span>
    <span class="hud-gold">💰 ${state.gold}</span>
    <span class="hud-energy">⚡ ${state.energy}/${state.maxEnergy}</span>
    <span class="hud-deck">🃏 ${state.deck.length}</span>
    <span class="hud-relics">✦ ${state.relics.length}</span>
  `;
  return hud;
}
