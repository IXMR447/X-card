# X-card

Roguelike 卡牌构筑游戏 Demo — 选择路线、构筑牌组、击败 Boss。

**在线游玩（部署后）：** `https://<你的用户名>.github.io/X-card/`

## 快速开始

```bash
npm install
npm run dev
```

浏览器打开终端提示的地址（本地开发路径含 `/X-card/` 前缀）。

## 我要设计内容，文件放哪？

| 内容 | 目录 |
|------|------|
| 角色（1） | `src/content/characters/` |
| 卡牌（~30） | `src/content/cards/` |
| 遗物（20） | `src/content/relics/` |
| 敌人（10+3+3） | `src/content/enemies/` |
| 事件（20） | `src/content/events/` |
| 药水 | `src/content/potions/` |
| 地图配置 | `src/content/map/config.ts` |
| 数值平衡 | `src/core/constants.ts` |

完整搭建说明、数据格式、部署步骤见 **[docs/SETUP.md](./docs/SETUP.md)**。

## 部署到 GitHub Pages

1. 确认 `vite.config.ts` 中 `REPO_NAME` 与 GitHub 仓库名一致
2. 推送 `main` 分支
3. 仓库 **Settings → Pages → Source** 选 **GitHub Actions**
4. 等待 CI 完成即可访问

## 脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 本地开发 |
| `npm run build` | 生产构建 |
| `npm run preview` | 预览构建结果 |
| `npm run typecheck` | TypeScript 检查 |

## 架构概览

```
content/（你填内容） → registries/（注册表） → systems/（逻辑） → ui/（界面）
                              ↑
                        GameManager（状态机）
```

引擎已实现：地图、战斗、奖励、商店、篝火、事件、遗物触发总线。卡牌/敌人/事件等具体数值与文案由你在 `src/content/` 中填充。
