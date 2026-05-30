export interface UiConfigState {
  cardSpacing: number;
  hoverScale: number;
  hoverLift: number;
  hoverRotation: number;
  disabledAlpha: number;
}

export const uiConfig: UiConfigState = {
  cardSpacing: 0.95,
  hoverScale: 1.08,
  hoverLift: 1,
  hoverRotation: 0,
  disabledAlpha: 0.45,
};

function updateCssVariable(name: string, value: string): void {
  document.documentElement.style.setProperty(name, value);
}

export function applyUiConfig(): void {
  updateCssVariable('--hand-card-spacing', `${uiConfig.cardSpacing}rem`);
  updateCssVariable('--card-hover-scale', `${uiConfig.hoverScale}`);
  updateCssVariable('--card-hover-lift', `${-uiConfig.hoverLift}rem`);
  updateCssVariable('--card-hover-rotation', `${uiConfig.hoverRotation}deg`);
  updateCssVariable('--card-disabled-opacity', `${uiConfig.disabledAlpha}`);
}

function createConfigRow(
  label: string,
  name: string,
  min: number,
  max: number,
  step: number,
  value: number,
  unit: string,
  onChange: (value: number) => void,
): HTMLElement {
  const row = document.createElement('div');
  row.className = 'config-row';

  const labelEl = document.createElement('label');
  labelEl.htmlFor = `ui-config-${name}`;
  labelEl.textContent = label;

  const input = document.createElement('input');
  input.type = 'range';
  input.id = `ui-config-${name}`;
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.value = String(value);
  input.addEventListener('input', () => {
    const numeric = Number(input.value);
    valueEl.textContent = `${numeric}${unit}`;
    onChange(numeric);
    applyUiConfig();
  });

  const valueEl = document.createElement('span');
  valueEl.className = 'config-value';
  valueEl.textContent = `${value}${unit}`;

  row.appendChild(labelEl);
  row.appendChild(input);
  row.appendChild(valueEl);
  return row;
}

export function createUiConfigPanel(): HTMLElement {
  const panel = document.createElement('section');
  panel.className = 'ui-config-panel panel';
  panel.innerHTML = `
    <div class="config-header">
      <h3>UI 配置</h3>
      <p>参考 ycarowr/UiCard：调整卡牌手牌布局与悬停交互。</p>
    </div>
  `;

  panel.appendChild(
    createConfigRow('卡牌间距', 'spacing', 0.5, 1.8, 0.05, uiConfig.cardSpacing, 'rem', (value) => {
      uiConfig.cardSpacing = value;
    }),
  );
  panel.appendChild(
    createConfigRow('悬停缩放', 'scale', 1, 1.2, 0.01, uiConfig.hoverScale, '', (value) => {
      uiConfig.hoverScale = value;
    }),
  );
  panel.appendChild(
    createConfigRow('悬停抬起', 'lift', 0, 2, 0.1, uiConfig.hoverLift, 'rem', (value) => {
      uiConfig.hoverLift = value;
    }),
  );
  panel.appendChild(
    createConfigRow('悬停旋转', 'rotation', -8, 8, 0.5, uiConfig.hoverRotation, '°', (value) => {
      uiConfig.hoverRotation = value;
    }),
  );
  panel.appendChild(
    createConfigRow('禁用透明度', 'disabledAlpha', 0.2, 1, 0.05, uiConfig.disabledAlpha, '', (value) => {
      uiConfig.disabledAlpha = value;
    }),
  );

  return panel;
}
