import './index.css';
import { initGame } from './game.ts';

const rootEl = document.getElementById('root');
if (rootEl) {
  initGame(rootEl);
}

