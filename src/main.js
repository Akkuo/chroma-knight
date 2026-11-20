import { PHASE, STATE } from './constants.js';
import { SoundEngine } from './audio.js';
import { createSpriteAtlas } from './sprites.js';
import { Renderer } from './renderer.js';
import { WebGLPostProcessor } from './webgl-post.js';
import { LevelEditor } from './editor.js';
import { Game } from './game.js';

const displayCanvas = document.getElementById('game');
const canvasWrap = document.getElementById('canvas-wrap');
const crtOverlay = document.getElementById('crt-overlay');
const phasePill = document.getElementById('phase-pill');
const editorRoot = document.getElementById('editor-ui');

const sound = new SoundEngine();
const atlas = createSpriteAtlas();

// Initialize WebGL Post-Processing Pipeline (with graceful Canvas2D fallback)
const post = new WebGLPostProcessor(displayCanvas);
const renderCanvas = post.supported ? document.createElement('canvas') : displayCanvas;
const renderer = new Renderer(renderCanvas, atlas, displayCanvas);
window.addEventListener('resize', () => renderer.resize());

function syncPhaseUI(phase) {
  const isLunar = phase === PHASE.LUNAR;
  canvasWrap.classList.toggle('phase-lunar', isLunar);
  canvasWrap.classList.toggle('phase-solar', !isLunar);
  phasePill.className = `badge ${isLunar ? 'lunar' : 'solar'}`;
  phasePill.textContent = isLunar ? 'LUNAR 星月' : 'SOLAR 熾陽';
}

const game = new Game(atlas, sound, syncPhaseUI, (strength) => {
  post.triggerAberration(strength);
});
const editor = new LevelEditor(displayCanvas, game, editorRoot);
game.editor = editor;

// --- INPUT MANAGER (Keyboard + Gamepad) ---
const keys = new Set();
const justPressed = new Set();

const PREVENT_KEYS = new Set([
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'F2', 'F3',
]);

window.addEventListener('keydown', (e) => {
  sound.unlock();
  if (PREVENT_KEYS.has(e.code)) e.preventDefault();
  if (!keys.has(e.code)) {
    justPressed.add(e.code);
  }
  keys.add(e.code);

  if (e.code === 'KeyM') {
    sound.toggleMute();
  } else if (e.code === 'KeyV') {
    crtOverlay.classList.toggle('crt-on');
  } else if (e.code === 'KeyG') {
    post.enabled = !post.enabled;
    game.particles.spawnText(
      game.player.cx,
      game.player.y - 8,
      post.enabled ? 'SHADER ON' : 'SHADER OFF',
      '#7eeeff'
    );
  } else if (e.code === 'KeyT') {
    game.ghost.enabled = !game.ghost.enabled;
    game.particles.spawnText(
      game.player.cx,
      game.player.y - 8,
      game.ghost.enabled ? 'GHOST ON' : 'GHOST OFF',
      '#4af7c8'
    );
  } else if (e.code === 'F2') {
    if (game.state === STATE.TITLE) {
      game.loadStage(0, true);
    }
    editor.toggle();
  } else if (e.code === 'F3') {
    game.showDebug = !game.showDebug;
  }
});

window.addEventListener('keyup', (e) => {
  keys.delete(e.code);
});

window.addEventListener('blur', () => {
  keys.clear();
});

displayCanvas.addEventListener('pointerdown', () => {
  sound.unlock();
});

let prevPadButtons = [];
function readInput() {
  const anyDown = (...codes) => codes.some((c) => keys.has(c));
  const anyPressed = (...codes) => codes.some((c) => justPressed.has(c));

  const input = {
    left: anyDown('ArrowLeft', 'KeyA'),
    right: anyDown('ArrowRight', 'KeyD'),
    up: anyDown('ArrowUp', 'KeyW'),
    down: anyDown('ArrowDown', 'KeyS'),
    downPressed: anyPressed('ArrowDown', 'KeyS'),
    jump: anyDown('Space', 'KeyZ', 'KeyW', 'ArrowUp'),
    jumpPressed: anyPressed('Space', 'KeyZ', 'KeyW', 'ArrowUp'),
    dashPressed: anyPressed('KeyX', 'KeyJ'),
    phasePressed: anyPressed('ShiftLeft', 'ShiftRight', 'KeyK', 'KeyE'),
    startPressed: anyPressed('Enter'),
    pausePressed: anyPressed('Escape', 'KeyP'),
    restartPressed: anyPressed('KeyR'),
    stage1: anyPressed('Digit1'),
    stage2: anyPressed('Digit2'),
    stage3: anyPressed('Digit3'),
    stage4: anyPressed('Digit4'),
    stage5: anyPressed('Digit5'),
    stage6: anyPressed('Digit6'),
  };

  // Optional Gamepad support
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  const gp = pads[0];
  if (gp) {
    const btn = (i) => Boolean(gp.buttons[i] && gp.buttons[i].pressed);
    const btnPressed = (i) => btn(i) && !prevPadButtons[i];

    if (gp.axes[0] < -0.35 || btn(14)) input.left = true;
    if (gp.axes[0] > 0.35 || btn(15)) input.right = true;
    if (gp.axes[1] < -0.45 || btn(12)) input.up = true;
    if (gp.axes[1] > 0.55 || btn(13)) input.down = true;

    if (btn(0)) input.jump = true;
    if (btnPressed(0)) input.jumpPressed = true;
    if (btnPressed(2) || btnPressed(1)) input.dashPressed = true;
    if (btnPressed(3) || btnPressed(4) || btnPressed(5)) input.phasePressed = true;
    if (btnPressed(9)) input.startPressed = true;

    prevPadButtons = gp.buttons.map((b) => Boolean(b.pressed));
  }

  justPressed.clear();
  return input;
}

// --- FIXED TIMESTEP GAME LOOP (60Hz physics, smooth RAF render) ---
const STEP = 1 / 60;
let accumulator = 0;
let lastTime = performance.now();
let frames = 0;
let fpsTimer = 0;

function loop(now) {
  const rawDt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;

  frames += 1;
  fpsTimer += rawDt;
  if (fpsTimer >= 0.5) {
    game.fps = Math.round(frames / fpsTimer);
    frames = 0;
    fpsTimer = 0;
  }

  accumulator += rawDt;
  let stepped = false;
  while (accumulator >= STEP) {
    const input = readInput();
    game.update(STEP, input);
    post.update(STEP, game.phase === PHASE.LUNAR);
    accumulator -= STEP;
    stepped = true;
  }
  if (!stepped) {
    // Keep title / responsive visual state clean
  }

  renderer.render(game);
  if (post.supported) {
    post.render(renderCanvas, game.time);
  }
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
