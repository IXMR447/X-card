import type { GameState } from '@/entities';
import { getRelic } from '@/core/registries/RelicRegistry';

export function renderHud(state: GameState): HTMLElement {
  const hud = document.createElement('div');
  hud.className = 'hud';
  const relicNames = state.relics
    .map((relic) => getRelic(relic.definitionId)?.name ?? relic.definitionId)
    .join(', ');
  const activations = state.recentRelicActivations
    .slice(0, 3)
    .map((activation) => `<span class="relic-activation">${activation.message}</span>`)
    .join('');

  hud.innerHTML = `
    <span class="hud-item hud-hp"><strong>HP</strong> ${state.hp}/${state.maxHp}</span>
    <span class="hud-item hud-gold"><strong>金钱</strong> ${state.gold}</span>
    <span class="hud-item hud-energy"><strong>能量</strong> ${state.energy}/${state.maxEnergy}</span>
    <span class="hud-item hud-deck"><strong>卡组</strong> ${state.deck.length}</span>
    <span class="hud-item hud-relics" title="${relicNames}"><strong>遗物</strong> ${state.relics.length}</span>
    ${activations ? `<span class="hud-relic-feed">${activations}</span>` : ''}
  `;
  return hud;
}
