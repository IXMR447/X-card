import type { GameState } from '@/entities';
import { gameManager } from '@/core/GameManager';
import { getAllCharacters } from '@/core/registries/CharacterRegistry';
import { renderMainMenu } from './screens/MainMenuScreen';
import { renderCharacterSelect } from './screens/CharacterSelectScreen';
import { renderMapScreen } from './screens/MapScreen';
import { renderCombatScreen } from './screens/CombatScreen';
import { renderRewardScreen } from './screens/RewardScreen';
import { renderShopScreen } from './screens/ShopScreen';
import { renderCampfireScreen } from './screens/CampfireScreen';
import { renderEventScreen } from './screens/EventScreen';
import { renderGameOverScreen } from './screens/GameOverScreen';

export class GameApp {
  private root: HTMLElement;

  constructor(root: HTMLElement) {
    this.root = root;
    gameManager.subscribe((state) => this.render(state));
  }

  init(): void {
    this.render(gameManager.getState());
  }

  private render(state: GameState): void {
    this.root.innerHTML = '';

    switch (state.phase) {
      case 'main_menu':
        renderMainMenu(this.root);
        break;
      case 'character_select':
        renderCharacterSelect(this.root, getAllCharacters());
        break;
      case 'map':
        renderMapScreen(this.root, state);
        break;
      case 'combat':
        renderCombatScreen(this.root, state);
        break;
      case 'reward':
        renderRewardScreen(this.root, state);
        break;
      case 'shop':
        renderShopScreen(this.root, state, gameManager.shopInventory);
        break;
      case 'campfire':
        renderCampfireScreen(this.root, state);
        break;
      case 'event':
        renderEventScreen(this.root, state);
        break;
      case 'treasure':
        this.renderTreasure(state);
        break;
      case 'game_over':
      case 'victory':
        renderGameOverScreen(this.root, state);
        break;
      default:
        renderMainMenu(this.root);
    }
  }

  private renderTreasure(_state: GameState): void {
    const panel = document.createElement('div');
    panel.className = 'screen panel';
    panel.innerHTML = `
      <h2>宝箱</h2>
      <p>你发现了一个宝箱！（奖励逻辑可在此扩展）</p>
      <button class="btn btn-primary" id="btn-leave">继续</button>
    `;
    panel.querySelector('#btn-leave')?.addEventListener('click', () => {
      gameManager.updateState((s) => ({ ...s, phase: 'map' }));
    });
    this.root.appendChild(panel);
  }
}
