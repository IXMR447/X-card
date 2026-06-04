import { getAllCards } from '@/core/registries/CardRegistry';
import { authService } from '@/services/AuthService';
import { cloudSaveService } from '@/services/CloudSaveService';
import type { SaveSlotSummary } from '@/services/CloudSaveService';
import { renderLoginPanel } from '@/ui/components/LoginPanel';
import { gameManager } from '@/core/GameManager';
import { unpackSaveSlot } from '@/services/serialization';
import type { SerializedSaveSlot } from '@/services/serialization';

type MenuPanel = 'continue' | 'cards' | 'cloud' | 'settings' | 'exit';

const SAVE_SLOT_KEY = 'x-card-save-slots';
const SETTINGS_KEY = 'x-card-menu-settings';

interface MenuSettings {
  motion: boolean;
  enhancedRender: boolean;
}

interface LocalSaveEntry {
  slotIndex: number;
  data: SerializedSaveSlot;
}

function readSettings(): MenuSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { motion: true, enhancedRender: true, ...JSON.parse(raw) } : defaultSettings();
  } catch {
    return defaultSettings();
  }
}

function defaultSettings(): MenuSettings {
  return { motion: true, enhancedRender: true };
}

function saveSettings(settings: MenuSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function readLocalSaves(): LocalSaveEntry[] {
  try {
    const raw = localStorage.getItem(SAVE_SLOT_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((e: unknown) => e && typeof e === 'object') : [];
  } catch {
    return [];
  }
}

function deleteLocalSave(slotIndex: number): void {
  const saves = readLocalSaves().filter((s) => s.slotIndex !== slotIndex);
  localStorage.setItem(SAVE_SLOT_KEY, JSON.stringify(saves));
}

function renderSaveSlotRow(slot: SaveSlotSummary, source: 'cloud' | 'local'): string {
  const sourceLabel = source === 'cloud' ? '云端' : '本地';
  const dateStr = new Date(slot.updatedAt).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  return `
    <div class="menu-save-slot-row" data-slot="${slot.slotIndex}" data-source="${source}">
      <div class="menu-save-slot-info">
        <strong>存档 ${slot.slotIndex + 1}</strong>
        <span class="save-slot-meta">${slot.characterName} · 第 ${slot.floor} 层 · HP ${slot.hp}/${slot.maxHp}</span>
        <span class="save-slot-date">${sourceLabel} · ${dateStr}</span>
      </div>
      <div class="menu-save-slot-actions">
        <button class="btn btn-primary btn-save-load" type="button" data-slot="${slot.slotIndex}" data-source="${source}">加载</button>
        <button class="btn btn-secondary btn-save-delete" type="button" data-slot="${slot.slotIndex}" data-source="${source}">删除</button>
      </div>
    </div>
  `;
}

function getMenuPanel(panel: MenuPanel, settings: MenuSettings): string {
  switch (panel) {
    case 'continue':
      return renderContinuePanel();
    case 'cards':
      return renderCardsPanel();
    case 'cloud':
      return renderCloudPanel();
    case 'settings':
      return renderSettingsPanel(settings);
    case 'exit':
      return renderExitPanel();
  }
}

function getAllMenuPanels(settings: MenuSettings): string {
  return `
    <section class="menu-panel-section menu-panel-default" id="menu-continue" aria-label="继续游戏">
      ${getMenuPanel('continue', settings)}
    </section>
    <section class="menu-panel-section" id="menu-cards" aria-label="卡牌收集">
      ${getMenuPanel('cards', settings)}
    </section>
    <section class="menu-panel-section" id="menu-cloud" aria-label="云存档">
      ${getMenuPanel('cloud', settings)}
    </section>
    <section class="menu-panel-section" id="menu-settings" aria-label="设置">
      ${getMenuPanel('settings', settings)}
    </section>
    <section class="menu-panel-section" id="menu-exit" aria-label="退出游戏">
      ${getMenuPanel('exit', settings)}
    </section>
  `;
}

function renderContinuePanel(): string {
  return `
    <div class="menu-panel-copy">
      <p class="menu-panel-kicker">Continue</p>
      <h2>继续游戏</h2>
      <p>加载存档，继续之前的冒险。</p>
    </div>
    <div class="menu-save-list" id="save-slot-list">
      <div class="menu-empty-state">
        <span>正在检查存档...</span>
      </div>
    </div>
  `;
}

function renderCloudPanel(): string {
  const user = authService.getUser();
  return `
    <div class="menu-panel-copy">
      <p class="menu-panel-kicker">Cloud Save</p>
      <h2>云存档</h2>
      <p>登录 GitHub 同步存档与收集进度到云端。</p>
    </div>
    ${renderLoginPanel(user)}
  `;
}

function renderCardsPanel(): string {
  const cards = getAllCards();
  const cardsByType = cards.reduce<Record<string, number>>((counts, card) => {
    counts[card.type] = (counts[card.type] ?? 0) + 1;
    return counts;
  }, {});

  return `
    <div class="menu-panel-copy">
      <p class="menu-panel-kicker">Collection</p>
      <h2>卡牌收集</h2>
      <p>浏览当前内容库中的卡牌类型与数量。</p>
    </div>
    <div class="menu-collection-stats">
      <div><strong>${cards.length}</strong><span>总卡牌</span></div>
      <div><strong>${cardsByType.attack ?? 0}</strong><span>攻击</span></div>
      <div><strong>${cardsByType.skill ?? 0}</strong><span>技能</span></div>
      <div><strong>${cardsByType.power ?? 0}</strong><span>能力</span></div>
    </div>
    <div class="menu-card-strip">
      ${cards
        .slice(0, 8)
        .map(
          (card) => `
            <span class="menu-card-chip card-chip-${card.type}">
              <strong>${card.name}</strong>
              <small>${card.rarity}</small>
            </span>
          `,
        )
        .join('')}
    </div>
  `;
}

function renderSettingsPanel(settings: MenuSettings): string {
  return `
    <div class="menu-panel-copy">
      <p class="menu-panel-kicker">Settings</p>
      <h2>设置</h2>
      <p>调整开始界面的动效和渲染强度，设置会保存在本地浏览器。</p>
    </div>
    <div class="menu-settings-list">
      <button class="menu-setting-row" type="button" data-setting="motion" aria-pressed="${settings.motion}">
        <span>
          <strong>动态 UI</strong>
          <small>背景扫描线、按钮高光和浮动粒子</small>
        </span>
        <em>${settings.motion ? '开启' : '关闭'}</em>
      </button>
      <button class="menu-setting-row" type="button" data-setting="enhancedRender" aria-pressed="${settings.enhancedRender}">
        <span>
          <strong>增强渲染</strong>
          <small>玻璃质感、发光边框和更高对比度</small>
        </span>
        <em>${settings.enhancedRender ? '开启' : '关闭'}</em>
      </button>
    </div>
  `;
}

function renderExitPanel(): string {
  return `
    <div class="menu-panel-copy">
      <p class="menu-panel-kicker">Exit</p>
      <h2>退出游戏</h2>
      <p>网页版本无法强制关闭浏览器标签页。你可以返回菜单、关闭当前标签页，或在 GitHub Pages 中离开页面。</p>
    </div>
    <button class="btn btn-secondary menu-exit-button" type="button" id="btn-exit-tab">尝试关闭标签页</button>
  `;
}

function applyMenuSettings(screen: HTMLElement, settings: MenuSettings): void {
  screen.classList.toggle('menu-motion-off', !settings.motion);
  screen.classList.toggle('menu-enhanced-off', !settings.enhancedRender);
}

async function refreshSaveSlotList(container: HTMLElement): Promise<void> {
  const isLoggedIn = authService.isLoggedIn();
  let slots: SaveSlotSummary[] = [];
  let source: 'cloud' | 'local' = 'local';

  if (isLoggedIn) {
    try {
      slots = await cloudSaveService.listSaveSlots();
      source = 'cloud';
    } catch {
      console.warn('[X-card] Failed to load cloud saves, falling back to local.');
      slots = readLocalSaves().map(toSummary);
      source = 'local';
    }
  } else {
    slots = readLocalSaves().map(toSummary);
  }

  // Fill empty slots 0-2
  const slotMap = new Map(slots.map((s) => [s.slotIndex, s]));
  const allSlots: (SaveSlotSummary | null)[] = [0, 1, 2].map((i) => slotMap.get(i) ?? null);

  container.innerHTML = allSlots
    .map((slot) => {
      if (slot) return renderSaveSlotRow(slot, source);
      return `
        <div class="menu-save-slot-row menu-save-slot-empty">
          <div class="menu-save-slot-info">
            <strong>存档 ${(allSlots.indexOf(slot)) + 1}</strong>
            <span class="save-slot-meta">空槽位</span>
          </div>
        </div>
      `;
    })
    .join('');
}

function toSummary(entry: LocalSaveEntry): SaveSlotSummary {
  return {
    slotIndex: entry.slotIndex,
    characterName: entry.data.characterName,
    floor: entry.data.floor,
    hp: entry.data.gameState.hp,
    maxHp: entry.data.gameState.maxHp,
    updatedAt: new Date(entry.data.timestamp).toISOString(),
  };
}

async function loadSaveSlot(slotIndex: number, source: 'cloud' | 'local'): Promise<boolean> {
  if (source === 'cloud' && authService.isLoggedIn()) {
    const saved = await cloudSaveService.loadGameFromSlot(slotIndex);
    if (saved) {
      gameManager.loadState(unpackSaveSlot(saved));
      return true;
    }
  } else {
    const local = readLocalSaves().find((s) => s.slotIndex === slotIndex);
    if (local) {
      gameManager.loadState(unpackSaveSlot(local.data));
      return true;
    }
  }
  return false;
}

async function deleteSaveSlot(slotIndex: number, source: 'cloud' | 'local'): Promise<void> {
  if (source === 'cloud' && authService.isLoggedIn()) {
    await cloudSaveService.deleteSaveSlot(slotIndex);
  } else {
    deleteLocalSave(slotIndex);
  }
}

export function renderMainMenu(root: HTMLElement): void {
  let settings = readSettings();

  const screen = document.createElement('div');
  screen.className = 'screen main-menu';
  screen.innerHTML = `
    <div class="main-menu-ambient" aria-hidden="true">
      <span></span>
      <span></span>
      <span></span>
      <span></span>
    </div>
    <div class="main-menu-shell">
      <section class="main-menu-copy" aria-label="游戏介绍">
        <div class="main-menu-banner">
          <h1 class="game-title">X-card</h1>
          <p class="subtitle">Roguelike 卡牌构筑 Demo</p>
        </div>
        <p class="main-menu-desc">选择你的英雄，探索未知节点，构建独特牌组并挑战风暴巨像。</p>
      </section>

      <nav class="main-menu-nav" aria-label="开始菜单">
        <a class="menu-option menu-option-primary" href="#character-select" id="btn-start">
          <span>开始游戏</span>
          <small>新建一局探索</small>
        </a>
        <a class="menu-option" href="#menu-continue">
          <span>继续游戏</span>
          <small>查看存档槽</small>
        </a>
        <a class="menu-option" href="#collection">
          <span>卡牌收集</span>
          <small>浏览卡牌库</small>
        </a>
        <a class="menu-option" href="#menu-cloud">
          <span>云存档</span>
          <small>登录与同步</small>
        </a>
        <a class="menu-option" href="#menu-settings">
          <span>设置</span>
          <small>调整 UI 效果</small>
        </a>
        <a class="menu-option" href="#menu-exit">
          <span>退出游戏</span>
          <small>离开网页版本</small>
        </a>
      </nav>

      <aside class="main-menu-panel" aria-live="polite">
        ${getAllMenuPanels(settings)}
      </aside>
    </div>
  `;

  const panel = screen.querySelector<HTMLElement>('.main-menu-panel');

  const refreshSettingsPanel = (): void => {
    if (!panel) return;
    const settingsPanel = panel.querySelector<HTMLElement>('#menu-settings');
    if (settingsPanel) settingsPanel.innerHTML = getMenuPanel('settings', settings);
  };

  const refreshCloudPanel = (): void => {
    if (!panel) return;
    const cloudPanel = panel.querySelector<HTMLElement>('#menu-cloud');
    if (cloudPanel) cloudPanel.innerHTML = getMenuPanel('cloud', settings);
  };

  const refreshSaveList = (): void => {
    const container = screen.querySelector<HTMLElement>('#save-slot-list');
    if (container) refreshSaveSlotList(container);
  };

  // Initial save slot load
  const saveList = screen.querySelector<HTMLElement>('#save-slot-list');
  if (saveList) refreshSaveSlotList(saveList);

  // Auth state subscription
  const unsubAuth = authService.subscribe(() => {
    refreshCloudPanel();
    refreshSaveList();
  });

  // Clean up when screen is removed
  const observer = new MutationObserver(() => {
    if (!screen.isConnected) {
      unsubAuth();
      observer.disconnect();
    }
  });
  observer.observe(screen.parentElement ?? document.body, { childList: true });

  screen.addEventListener('click', async (event) => {
    const target = event.target as HTMLElement | null;
    const button = target?.closest<HTMLButtonElement>('button');
    if (!button) return;

    if (button.dataset.setting) {
      const key = button.dataset.setting as keyof MenuSettings;
      settings = { ...settings, [key]: !settings[key] };
      saveSettings(settings);
      applyMenuSettings(screen, settings);
      refreshSettingsPanel();
      return;
    }

    if (button.id === 'btn-login-github') {
      authService.loginWithGithub();
      return;
    }

    if (button.id === 'btn-logout') {
      authService.logout();
      return;
    }

    if (button.id === 'btn-exit-tab') {
      window.close();
      return;
    }

    if (button.classList.contains('btn-save-load')) {
      const slotIndex = parseInt(button.dataset.slot ?? '0', 10);
      const source = (button.dataset.source as 'cloud' | 'local') || 'local';
      const loaded = await loadSaveSlot(slotIndex, source);
      if (!loaded) {
        alert('加载存档失败，存档可能已损坏或不存在。');
      }
      return;
    }

    if (button.classList.contains('btn-save-delete')) {
      const slotIndex = parseInt(button.dataset.slot ?? '0', 10);
      const source = (button.dataset.source as 'cloud' | 'local') || 'local';
      await deleteSaveSlot(slotIndex, source);
      refreshSaveList();
      return;
    }
  });

  applyMenuSettings(screen, settings);
  root.appendChild(screen);
}
