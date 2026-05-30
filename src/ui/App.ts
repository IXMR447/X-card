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
import { createUiConfigPanel, applyUiConfig } from './components/UiConfigPanel';

export class GameApp {
  private root: HTMLElement;

  constructor(root: HTMLElement) {
    this.root = root;
    gameManager.subscribe((state) => this.render(state));
  }

  init(): void {
    applyUiConfig();
    this.render(gameManager.getState());
  }

  private render(state: GameState): void {
    this.root.innerHTML = '';

    const screenRoot = document.createElement('div');
    screenRoot.className = 'screen-root';

    switch (state.phase) {
      case 'main_menu':
        renderMainMenu(screenRoot);
        break;
      case 'character_select':
        renderCharacterSelect(screenRoot, getAllCharacters());
        break;
      case 'map':
        renderMapScreen(screenRoot, state);
        break;
      case 'combat':
        renderCombatScreen(screenRoot, state);
        break;
      case 'reward':
        renderRewardScreen(screenRoot, state);
        break;
      case 'shop':
        renderShopScreen(screenRoot, state, gameManager.shopInventory);
        break;
      case 'campfire':
        renderCampfireScreen(screenRoot, state);
        break;
      case 'event':
        renderEventScreen(screenRoot, state);
        break;
      case 'treasure':
        this.renderTreasure(state, screenRoot);
        break;
      case 'game_over':
      case 'victory':
        renderGameOverScreen(screenRoot, state);
        break;
      default:
        renderMainMenu(screenRoot);
    }

    this.root.appendChild(screenRoot);
    this.root.appendChild(createUiConfigPanel());
  }

  private renderTreasure(_state: GameState, root: HTMLElement): void {
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
    root.appendChild(panel);
  }
}
