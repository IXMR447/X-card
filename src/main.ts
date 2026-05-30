import '@/styles/main.css';
import { loadGameContent } from '@/content/loader';
import { GameApp } from '@/ui/App';

loadGameContent();

const root = document.getElementById('app');
if (root) {
  const app = new GameApp(root);
  app.init();
} else {
  console.error('[X-card] 找不到 #app 根节点');
}
