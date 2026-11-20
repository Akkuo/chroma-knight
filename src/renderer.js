import { GAME_WIDTH, GAME_HEIGHT, TILE, TILE_SIZE, PHASE, PALETTES, STATE } from './constants.js';

export class Renderer {
  constructor(canvas, atlas, displayCanvas = null) {
    this.canvas = canvas;
    this.displayCanvas = displayCanvas || canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.atlas = atlas;
    this.scale = 2;
    this.dpr = 1;
    this.resize();

    // Pre-generate starfield for Lunar sky
    this.stars = [];
    for (let i = 0; i < 64; i++) {
      this.stars.push({
        x: Math.random() * GAME_WIDTH,
        y: Math.random() * (GAME_HEIGHT * 0.65),
        size: Math.random() < 0.25 ? 2 : 1,
        speed: 1.5 + Math.random() * 3,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  resize() {
    const rect = this.displayCanvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const targetW = Math.max(960, Math.round((rect.width || 960) * dpr));
    const targetH = Math.max(540, Math.round((rect.height || 540) * dpr));
    if (this.canvas.width !== targetW || this.canvas.height !== targetH) {
      this.canvas.width = targetW;
      this.canvas.height = targetH;
    }
    this.dpr = dpr;
    this.scale = this.canvas.width / GAME_WIDTH;
  }

  render(game) {
    const ctx = this.ctx;
    const { phase, time, level, player, particles, camera } = game;
    const pal = PALETTES[phase];

    // --- PASS 1: CRISP PIXEL-ART WORLD (scaled cleanly to native HiDPI) ---
    ctx.save();
    ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    ctx.imageSmoothingEnabled = false;

    // 1. Sky & Parallax Background
    this._drawBackground(ctx, pal, phase, time, camera.x);

    // World Space Transform (with camera + micro-shake)
    const camX = Math.round(camera.x + camera.shakeX);
    const camY = Math.round(camera.y + camera.shakeY);

    ctx.save();
    ctx.translate(-camX, -camY);

    // 2. Tilemap
    if (level) {
      this._drawTiles(ctx, level, phase, time, camX);
      this._drawInteractiveGrass(ctx, particles.grass, phase);
    }

    // 3. Entities (Platforms, Springs, Checkpoints, Coins, Crystals, Enemies, Boss)
    if (level) {
      this._drawPlatforms(ctx, game.platforms, phase);
      this._drawSprings(ctx, game.springs);
      this._drawCheckpoints(ctx, game.checkpoints, time, phase);
      this._drawPickups(ctx, game.coinsList, game.hearts, game.dashCrystals, time);
      this._drawEnemies(ctx, game.enemies, phase, time);
      if (game.boss && game.boss.alive) {
        this._drawBoss(ctx, game.boss, time);
      }
      this._drawProjectiles(ctx, game.projectiles, phase, time);
    }

    // 4. Ghost Replay + Player Afterimages + Cape + Player Sprite
    if (game.state === STATE.PLAYING && !(game.editor && game.editor.active)) {
      this._drawGhost(ctx, game, time);
    }
    if (player && !player.dead && game.state !== STATE.TITLE) {
      this._drawAfterimages(ctx, particles.afterimages);
      this._drawCape(ctx, player, pal);
      this._drawPlayer(ctx, player, phase, time);
    }

    // 4b. Real-Time Water Surface Reflections
    if (level) {
      this._drawWaterReflections(ctx, game, camX, time);
    }

    // 5. Particles & Ripples
    this._drawAmbient(ctx, particles.ambient, phase, time);
    this._drawParticles(ctx, particles.particles);
    this._drawRipples(ctx, particles.ripples);

    // 6. Dynamic 2D Additive Lighting Pass
    if (level) {
      this._drawDynamicLights(ctx, game, phase, time);
    }

    // 6b. Live Level Editor Grid & Cursor
    if (game.editor && game.editor.active) {
      this._drawEditorOverlay(ctx, game.editor, camX);
    }

    ctx.restore();

    // 7. Subtle Phase Ambient Tint
    ctx.fillStyle = pal.ambient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    ctx.restore();

    // --- PASS 2: NATIVE HI-RES UI, FLOATING TEXT & OVERLAYS (960x540 logical) ---
    const uiScale = this.canvas.width / 960;
    ctx.save();
    ctx.setTransform(uiScale, 0, 0, uiScale, 0, 0);
    ctx.imageSmoothingEnabled = false;

    // Floating combat/score texts rendered in crisp Hi-Res
    this._drawTextsHD(ctx, particles.texts, camX, camY);

    if (game.state === STATE.TITLE) {
      this._drawTitleScreen(ctx, game, time);
    } else {
      this._drawHUD(ctx, game, time);
      if (game.showDebug) this._drawDebug(ctx, game);
      if (game.state === STATE.PAUSED) this._drawPauseOverlay(ctx);
      else if (game.state === STATE.STAGE_CLEAR) this._drawStageClear(ctx, game);
      else if (game.state === STATE.VICTORY) this._drawVictory(ctx, game, time);
      else if (game.state === STATE.GAME_OVER) this._drawGameOver(ctx, game);
    }
    ctx.restore();
  }

  _drawBackground(ctx, pal, phase, time, camX) {
    const grad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    grad.addColorStop(0, pal.skyTop);
    grad.addColorStop(0.55, pal.skyMid);
    grad.addColorStop(1, pal.skyBot);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Stars (brighter in lunar, faint high-altitude stars in solar)
    const starAlpha = phase === PHASE.LUNAR ? 0.92 : 0.25;
    for (const s of this.stars) {
      const tw = 0.4 + 0.6 * Math.sin(time * s.speed + s.phase);
      ctx.fillStyle = `rgba(235, 248, 255, ${(tw * starAlpha).toFixed(2)})`;
      ctx.fillRect(Math.floor(s.x), Math.floor(s.y), s.size, s.size);
    }

    // Sun / Crescent Moon
    const orbX = 365 - ((camX * 0.03) % 80);
    const orbY = 58;
    const glow = ctx.createRadialGradient(orbX, orbY, 4, orbX, orbY, 54);
    glow.addColorStop(0, pal.sunGlow);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(orbX - 54, orbY - 54, 108, 108);

    ctx.fillStyle = pal.sunColor;
    ctx.beginPath();
    ctx.arc(orbX, orbY, 16, 0, Math.PI * 2);
    ctx.fill();
    if (phase === PHASE.LUNAR) {
      ctx.fillStyle = pal.skyTop;
      ctx.beginPath();
      ctx.arc(orbX + 6, orbY - 3, 13, 0, Math.PI * 2);
      ctx.fill();
    }

    // Parallax Clouds
    ctx.fillStyle = phase === PHASE.SOLAR ? 'rgba(255, 212, 168, 0.16)' : 'rgba(120, 210, 255, 0.11)';
    for (let i = 0; i < 6; i++) {
      const cx = ((i * 110 - camX * 0.08 - time * 6) % (GAME_WIDTH + 120) + GAME_WIDTH + 120) % (GAME_WIDTH + 120) - 60;
      const cy = 34 + (i % 3) * 26;
      ctx.fillRect(Math.floor(cx), cy, 46, 8);
      ctx.fillRect(Math.floor(cx) + 10, cy - 5, 24, 5);
    }

    // Far Mountains
    this._drawMountainLayer(ctx, camX * 0.14, 168, 52, 72, pal.mountainFar);
    // Mid Mountains + Ruin silhouettes
    this._drawMountainLayer(ctx, camX * 0.3, 196, 36, 54, pal.mountainMid);

    // Distant Ruins Arches
    ctx.fillStyle = pal.ruinsFar;
    const archSpacing = 96;
    const startArch = Math.floor((camX * 0.42) / archSpacing) - 1;
    for (let i = startArch; i < startArch + 7; i++) {
      const ax = Math.floor(i * archSpacing - camX * 0.42);
      const h = 36 + ((Math.abs(i * 17) % 3) * 14);
      ctx.fillRect(ax, GAME_HEIGHT - h - 22, 10, h + 22);
      ctx.fillRect(ax + 24, GAME_HEIGHT - h - 22, 10, h + 22);
      ctx.fillRect(ax - 2, GAME_HEIGHT - h - 26, 38, 6);
    }
  }

  _drawMountainLayer(ctx, offset, baseY, amp, step, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, GAME_HEIGHT);
    const startIdx = Math.floor(offset / step) - 1;
    for (let i = startIdx; i <= startIdx + Math.ceil(GAME_WIDTH / step) + 2; i++) {
      const x = i * step - offset;
      const h = Math.abs(Math.sin(i * 1.7 + 0.5)) * amp;
      ctx.lineTo(x, baseY - h);
    }
    ctx.lineTo(GAME_WIDTH, GAME_HEIGHT);
    ctx.closePath();
    ctx.fill();
  }

  _drawTiles(ctx, level, phase, time, camX) {
    const startTx = Math.max(0, Math.floor(camX / TILE_SIZE) - 1);
    const endTx = Math.min(level.width - 1, Math.ceil((camX + GAME_WIDTH) / TILE_SIZE) + 1);
    const t = this.atlas.tiles;
    const isLunar = phase === PHASE.LUNAR;
    const qTile = Math.floor(time * 4) % 2 === 0 ? t.question : t.questionGlow;

    for (let ty = 0; ty < level.height; ty++) {
      for (let tx = startTx; tx <= endTx; tx++) {
        const idx = ty * level.width + tx;
        const tile = level.tiles[idx];
        if (tile === TILE.EMPTY) continue;

        const px = tx * TILE_SIZE;
        let py = ty * TILE_SIZE + level.bumpOffsets[idx];

        switch (tile) {
          case TILE.GROUND:
            ctx.drawImage(isLunar ? t.groundLunar : t.groundSolar, px, py);
            break;
          case TILE.DIRT:
            ctx.drawImage(isLunar ? t.dirtLunar : t.dirtSolar, px, py);
            break;
          case TILE.BRICK:
            ctx.drawImage(t.brick, px, py);
            break;
          case TILE.QUESTION:
            ctx.drawImage(qTile, px, py);
            break;
          case TILE.USED:
            ctx.drawImage(t.used, px, py);
            break;
          case TILE.CRACKED:
            ctx.drawImage(t.cracked, px, py);
            break;
          case TILE.ONE_WAY:
            ctx.drawImage(t.oneWay, px, py);
            break;
          case TILE.SPIKE:
            ctx.drawImage(t.spike, px, py);
            break;
          case TILE.PILLAR:
            ctx.drawImage(t.pillar, px, py);
            break;
          case TILE.SOLAR_BLOCK:
            ctx.drawImage(phase === PHASE.SOLAR ? t.solarSolid : t.solarGhost, px, py);
            break;
          case TILE.LUNAR_BLOCK:
            ctx.drawImage(phase === PHASE.LUNAR ? t.lunarSolid : t.lunarGhost, px, py);
            break;
          case TILE.CRUMBLE: {
            const c = level.crumbleTimers.get(idx);
            if (!c) {
              ctx.drawImage(t.crumble, px, py);
            } else if (c.state === 'shaking') {
              const jitter = (Math.random() - 0.5) * 3;
              ctx.drawImage(t.crumble, px + jitter, py);
            } else {
              // Faint ghost outline while regenerating
              ctx.strokeStyle = 'rgba(214, 188, 165, 0.25)';
              ctx.strokeRect(px + 2, py + 2, 12, 12);
            }
            break;
          }
          case TILE.WATER: {
            const wave = Math.sin(time * 4 + tx * 0.9) * 1.5;
            ctx.fillStyle = isLunar ? 'rgba(42, 168, 224, 0.68)' : 'rgba(54, 180, 210, 0.62)';
            ctx.fillRect(px, py + 3 + wave, 16, 13 - wave);
            ctx.fillStyle = 'rgba(210, 250, 255, 0.72)';
            ctx.fillRect(px, py + 3 + wave, 16, 2);
            break;
          }
          case TILE.LAVA: {
            const wave = Math.sin(time * 5 + tx * 1.1) * 1.6;
            ctx.fillStyle = '#d9342b';
            ctx.fillRect(px, py + 3 + wave, 16, 13 - wave);
            ctx.fillStyle = '#ff9838';
            ctx.fillRect(px, py + 3 + wave, 16, 3);
            ctx.fillStyle = '#fff099';
            ctx.fillRect(px + ((tx * 5 + Math.floor(time * 12)) % 12), py + 4 + wave, 4, 1);
            break;
          }
          case TILE.GOAL_GATE: {
            this._drawGoalPortal(ctx, px, py, time);
            break;
          }
        }
      }
    }
  }

  _drawGoalPortal(ctx, px, py, time) {
    const cx = px + 8;
    const cy = py - 4;
    // Stone arch
    ctx.fillStyle = '#333652';
    ctx.fillRect(px - 2, py - 20, 20, 36);
    ctx.fillStyle = '#5c628a';
    ctx.fillRect(px, py - 18, 16, 34);
    // Swirling chroma vortex
    const pulse = 1 + Math.sin(time * 6) * 0.12;
    ctx.fillStyle = '#1b1433';
    ctx.fillRect(px + 2, py - 15, 12, 31);
    ctx.fillStyle = '#ffbe44';
    ctx.fillRect(cx - 4 * pulse, cy - 8 * pulse, 8 * pulse, 20 * pulse);
    ctx.fillStyle = '#4ae3ff';
    ctx.fillRect(cx - 2.5 * pulse, cy - 5 * pulse, 5 * pulse, 14 * pulse);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx - 1, cy - 2, 2, 8);
  }

  _drawInteractiveGrass(ctx, grass, phase) {
    const color = phase === PHASE.LUNAR ? '#6ef7e8' : '#74e86b';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < grass.length; i++) {
      const g = grass[i];
      const tipX = g.x + Math.sin(g.angle) * g.h;
      const tipY = g.y - Math.cos(g.angle) * g.h;
      ctx.moveTo(g.x, g.y);
      ctx.lineTo(tipX, tipY);
    }
    ctx.stroke();
  }

  _drawPlatforms(ctx, platforms, phase) {
    const accent = phase === PHASE.LUNAR ? '#4ae3ff' : '#ffba42';
    for (const p of platforms) {
      ctx.fillStyle = '#24273d';
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.w, p.h);
      ctx.fillStyle = '#5d658c';
      ctx.fillRect(Math.round(p.x) + 1, Math.round(p.y) + 1, p.w - 2, p.h - 2);
      ctx.fillStyle = accent;
      ctx.fillRect(Math.round(p.x) + 2, Math.round(p.y) + 1, p.w - 4, 2);
    }
  }

  _drawSprings(ctx, springs) {
    for (const s of springs) {
      const comp = s.compress * 5;
      // Base
      ctx.fillStyle = '#2c2f45';
      ctx.fillRect(s.x + 1, s.y + 7, 14, 3);
      // Coil
      ctx.fillStyle = '#9aa4c2';
      ctx.fillRect(s.x + 5, s.y + 3 + comp, 6, 4 - comp * 0.5);
      // Top pad
      ctx.fillStyle = '#ff4b5c';
      ctx.fillRect(s.x + 1, s.y + comp, 14, 4);
      ctx.fillStyle = '#ffd561';
      ctx.fillRect(s.x + 2, s.y + comp, 12, 1);
    }
  }

  _drawCheckpoints(ctx, checkpoints, time, phase) {
    for (const cp of checkpoints) {
      // Pole
      ctx.fillStyle = '#363b54';
      ctx.fillRect(cp.x + 7, cp.y + 6, 2, 18);
      ctx.fillStyle = '#5c638a';
      ctx.fillRect(cp.x + 4, cp.y + 21, 8, 3);
      // Lantern housing
      ctx.fillStyle = '#24273b';
      ctx.fillRect(cp.x + 4, cp.y + 2, 8, 8);
      if (cp.active) {
        const flicker = Math.sin(time * 14) > 0 ? '#fff4a3' : '#ffba42';
        ctx.fillStyle = phase === PHASE.LUNAR ? '#6ef3ff' : flicker;
        ctx.fillRect(cp.x + 5, cp.y + 3, 6, 6);
      } else {
        ctx.fillStyle = '#474c66';
        ctx.fillRect(cp.x + 5, cp.y + 3, 6, 6);
      }
    }
  }

  _drawPickups(ctx, coins, hearts, crystals, time) {
    for (const c of coins) {
      if (c.collected) continue;
      const spin = Math.abs(Math.cos(time * 5 + c.phase));
      const w = Math.max(2, Math.round(10 * spin));
      ctx.drawImage(this.atlas.items.coin, Math.round(c.x + (10 - w) * 0.5), Math.round(c.y), w, 10);
    }
    for (const h of hearts) {
      if (h.collected) continue;
      ctx.drawImage(this.atlas.items.heart, Math.round(h.x), Math.round(h.y));
    }
    for (const d of crystals) {
      if (d.cooldown > 0) {
        ctx.strokeStyle = 'rgba(74, 247, 200, 0.32)';
        ctx.strokeRect(Math.round(d.x + 2), Math.round(d.y + 2), 8, 8);
      } else {
        ctx.drawImage(this.atlas.items.dashCrystal, Math.round(d.x), Math.round(d.y));
      }
    }
  }

  _drawEnemies(ctx, enemies, phase, time) {
    const eAtlas = this.atlas.enemies;
    for (const e of enemies) {
      if (!e.alive) continue;
      if (e.type === 'slime') {
        const spr = Math.floor(time * 6) % 2 === 0 ? eAtlas.slime1 : eAtlas.slime2;
        ctx.drawImage(spr, Math.round(e.x - 1), Math.round(e.y - 2));
      } else if (e.type === 'beetle') {
        if (e.state === 'walk') {
          ctx.drawImage(e.vx >= 0 ? eAtlas.beetleR : eAtlas.beetleL, Math.round(e.x - 1), Math.round(e.y - 1));
        } else {
          ctx.drawImage(eAtlas.shell, Math.round(e.x - 1), Math.round(e.y - 2));
        }
      } else if (e.type === 'wisp') {
        const tangible = e.wispPhase === phase;
        ctx.save();
        ctx.globalAlpha = tangible ? 1 : 0.28;
        ctx.drawImage(e.wispPhase === PHASE.SOLAR ? eAtlas.wispSolar : eAtlas.wispLunar, Math.round(e.x - 2), Math.round(e.y));
        ctx.restore();
      }
    }
  }

  _drawBoss(ctx, boss, time) {
    const isSolar = boss.bossPhase === PHASE.SOLAR;
    const main = isSolar ? '#ff9d2e' : '#32c8ff';
    const core = isSolar ? '#fff4a3' : '#d8fcff';
    const dark = isSolar ? '#592014' : '#122854';

    const bx = Math.round(boss.x);
    const by = Math.round(boss.y);
    const flash = boss.hurtTimer > 0 && Math.floor(time * 24) % 2 === 0;

    // Outer armor body
    ctx.fillStyle = flash ? '#ffffff' : dark;
    ctx.fillRect(bx, by + 4, 32, 28);
    ctx.fillStyle = flash ? '#ffffff' : '#3a3f63';
    ctx.fillRect(bx + 2, by + 6, 28, 24);

    // Glowing Phase Crown (weak spot on top!)
    ctx.fillStyle = main;
    ctx.fillRect(bx + 8, by - 2, 16, 8);
    ctx.fillStyle = core;
    ctx.fillRect(bx + 12, by, 8, 4);

    // Glowing eyes & core
    ctx.fillStyle = main;
    ctx.fillRect(bx + 6, by + 12, 6, 5);
    ctx.fillRect(bx + 20, by + 12, 6, 5);
    ctx.fillStyle = core;
    ctx.fillRect(bx + 8, by + 13, 2, 3);
    ctx.fillRect(bx + 22, by + 13, 2, 3);

    // Chest Prism Core
    const pulse = 2 + Math.sin(time * 8) * 1.5;
    ctx.fillStyle = main;
    ctx.fillRect(bx + 11, by + 20, 10, 6);
    ctx.fillStyle = core;
    ctx.fillRect(bx + 14, by + 21, 4, Math.max(2, pulse));
  }

  _drawProjectiles(ctx, projectiles, phase, time) {
    for (const p of projectiles) {
      if (!p.alive) continue;
      const tangible = p.phase === phase;
      const col = p.phase === PHASE.SOLAR ? '#ffae38' : '#4ae3ff';
      ctx.save();
      ctx.globalAlpha = tangible ? 1 : 0.25;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(p.x + 4, p.y + 4, 4.5 + Math.sin(time * 16) * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(Math.round(p.x + 3), Math.round(p.y + 3), 2, 2);
      ctx.restore();
    }
  }

  _drawAfterimages(ctx, afterimages) {
    for (const a of afterimages) {
      ctx.save();
      ctx.globalAlpha = (a.life / a.maxLife) * 0.45;
      ctx.drawImage(a.sprite, Math.round(a.x), Math.round(a.y));
      ctx.restore();
    }
  }

  _drawCape(ctx, player, pal) {
    const pts = player.cape;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      ctx.strokeStyle = i >= pts.length - 2 ? pal.capeTip : pal.cape;
      ctx.lineWidth = Math.max(2, 5 - i * 0.6);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }

  _drawGhost(ctx, game, time) {
    const gf = game.ghost.getPlaybackFrame(game.stageTime);
    if (!gf) return;
    const set = this.atlas.player[gf.phase];
    const r = gf.facing >= 0;
    let spr = r ? set.idleR : set.idleL;
    if (gf.pose === 2) spr = r ? set.jumpR : set.jumpL;
    else if (gf.pose === 1) spr = Math.floor(time * 10) % 2 === 0 ? (r ? set.run1R : set.run1L) : (r ? set.run2R : set.run2L);

    ctx.save();
    ctx.globalAlpha = 0.42 + Math.sin(time * 8) * 0.08;
    ctx.drawImage(spr, Math.round(gf.x - 3), Math.round(gf.y - 3));
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = 'rgba(84, 240, 255, 0.22)';
    ctx.beginPath();
    ctx.arc(gf.x + 5, gf.y + 7, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawWaterReflections(ctx, game, camX, time) {
    const { level, player, enemies, phase } = game;
    const startTx = Math.max(0, Math.floor(camX / TILE_SIZE) - 1);
    const endTx = Math.min(level.width - 1, Math.ceil((camX + GAME_WIDTH) / TILE_SIZE) + 1);

    // Collect contiguous water surface spans
    const waterSpans = [];
    for (let ty = 0; ty < level.height; ty++) {
      let spanStart = -1;
      for (let tx = startTx; tx <= endTx + 1; tx++) {
        const isWater = tx <= endTx && level.getTile(tx, ty) === TILE.WATER && level.getTile(tx, ty - 1) !== TILE.WATER;
        if (isWater && spanStart === -1) spanStart = tx;
        else if (!isWater && spanStart !== -1) {
          waterSpans.push({ x: spanStart * TILE_SIZE, y: ty * TILE_SIZE + 3, w: (tx - spanStart) * TILE_SIZE, h: 13 });
          spanStart = -1;
        }
      }
    }
    if (!waterSpans.length) return;

    for (const sp of waterSpans) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(sp.x, sp.y, sp.w, sp.h);
      ctx.clip();

      const waveShift = Math.sin(time * 6 + sp.x * 0.1) * 1.4;
      ctx.globalAlpha = 0.36;

      // Mirror player if above this water span
      if (player && !player.dead && player.x + player.w > sp.x - 16 && player.x < sp.x + sp.w + 16) {
        const distAbove = sp.y - (player.y + player.h);
        if (distAbove >= -8 && distAbove < 48) {
          const spr = player.getSprite(this.atlas, phase);
          ctx.save();
          ctx.translate(Math.round(player.x + player.w * 0.5 + waveShift), Math.round(sp.y + distAbove));
          ctx.scale(1, -0.78);
          ctx.drawImage(spr, -8, -18);
          ctx.restore();
        }
      }

      // Mirror nearby enemies
      for (const e of enemies) {
        if (!e.alive || e.x + e.w < sp.x - 12 || e.x > sp.x + sp.w + 12) continue;
        const distAbove = sp.y - (e.y + e.h);
        if (distAbove >= -6 && distAbove < 40) {
          ctx.fillStyle = e.type === 'slime' ? '#6df07c' : '#ff7582';
          ctx.fillRect(Math.round(e.x + waveShift), Math.round(sp.y + distAbove * 0.6), e.w, 6);
        }
      }

      // Animated horizontal water shimmer ripples
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = phase === PHASE.LUNAR ? '#a6f9ff' : '#d6fbff';
      for (let rx = sp.x + 2; rx < sp.x + sp.w - 4; rx += 10) {
        const wy = sp.y + 3 + ((rx * 3) % 6);
        const shift = Math.sin(time * 5 + rx * 0.25) * 2;
        ctx.fillRect(Math.round(rx + shift), wy, 5, 1);
      }
      ctx.restore();
    }
  }

  _drawEditorOverlay(ctx, editor, camX) {
    const startTx = Math.max(0, Math.floor(camX / TILE_SIZE));
    const endTx = Math.min(this.gameWidth || 200, Math.ceil((camX + GAME_WIDTH) / TILE_SIZE) + 1);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let tx = startTx; tx <= endTx; tx++) {
      ctx.moveTo(tx * TILE_SIZE, 0);
      ctx.lineTo(tx * TILE_SIZE, 17 * TILE_SIZE);
    }
    for (let ty = 0; ty <= 17; ty++) {
      ctx.moveTo(startTx * TILE_SIZE, ty * TILE_SIZE);
      ctx.lineTo(endTx * TILE_SIZE, ty * TILE_SIZE);
    }
    ctx.stroke();

    if (editor.hoverTx >= 0 && editor.hoverTy >= 0) {
      ctx.strokeStyle = editor.selected.color || '#4af7c8';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(editor.hoverTx * TILE_SIZE + 0.5, editor.hoverTy * TILE_SIZE + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
    }
  }

  _drawPlayer(ctx, player, phase, time) {
    if (player.invulnTimer > 0 && Math.floor(time * 20) % 2 === 0) return;
    const spr = player.getSprite(this.atlas, phase);
    ctx.save();
    ctx.translate(Math.round(player.x + player.w * 0.5), Math.round(player.y + player.h));
    ctx.scale(player.scaleX, player.scaleY);
    ctx.drawImage(spr, -8, -18);
    ctx.restore();
  }

  _drawAmbient(ctx, ambient, phase, time) {
    const col = phase === PHASE.LUNAR ? '#80f4ff' : '#ffd573';
    for (const a of ambient) {
      const alpha = 0.28 + 0.45 * Math.sin(time * 3 + a.phase);
      ctx.fillStyle = col;
      ctx.globalAlpha = Math.max(0.08, alpha);
      ctx.fillRect(Math.round(a.x), Math.round(a.y), a.size, a.size);
    }
    ctx.globalAlpha = 1;
  }

  _drawParticles(ctx, list) {
    for (const p of list) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x - p.size * 0.5), Math.round(p.y - p.size * 0.5), p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  _drawRipples(ctx, ripples) {
    for (const r of ripples) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, (r.life / r.maxLife) * 0.72);
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  _drawTextsHD(ctx, texts, camX, camY) {
    ctx.font = '700 14px ui-monospace, "Noto Sans TC", "Microsoft JhengHei", sans-serif';
    ctx.textAlign = 'center';
    for (const t of texts) {
      const sx = (t.x - camX) * 2;
      const sy = (t.y - camY) * 2;
      ctx.globalAlpha = Math.min(1, (t.life / t.maxLife) * 1.4);
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(10, 10, 22, 0.9)';
      ctx.strokeText(t.text, sx, sy);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, sx, sy);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  }

  _drawDynamicLights(ctx, game, phase, time) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    const drawGlow = (x, y, radius, rgba) => {
      const g = ctx.createRadialGradient(x, y, 1, x, y, radius);
      g.addColorStop(0, rgba);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    };

    // Player aura
    if (game.player && !game.player.dead && game.state !== STATE.TITLE) {
      drawGlow(
        game.player.cx,
        game.player.cy,
        game.player.canDash ? 34 : 20,
        phase === PHASE.LUNAR ? 'rgba(64, 224, 255, 0.22)' : 'rgba(255, 190, 74, 0.2)'
      );
    }

    // Active checkpoints
    for (const cp of game.checkpoints) {
      if (cp.active) {
        drawGlow(cp.x + 8, cp.y + 6, 36 + Math.sin(time * 8) * 3, 'rgba(255, 210, 96, 0.28)');
      }
    }

    // Dash crystals
    for (const d of game.dashCrystals) {
      if (d.cooldown <= 0) {
        drawGlow(d.x + 6, d.y + 6, 20, 'rgba(74, 247, 200, 0.25)');
      }
    }

    // Goal portal glow
    if (game.level) {
      drawGlow(game.level.goal.x + 8, game.level.goal.y - 4, 48, 'rgba(180, 220, 255, 0.26)');
    }

    // Boss glow
    if (game.boss && game.boss.alive) {
      const col = game.boss.bossPhase === PHASE.SOLAR ? 'rgba(255, 168, 52, 0.3)' : 'rgba(66, 216, 255, 0.3)';
      drawGlow(game.boss.cx, game.boss.cy, 52, col);
    }

    ctx.restore();
  }

  _drawHUD(ctx, game, time) {
    const W = 960;
    const H = 540;
    const UI_FONT = '"Noto Sans TC", "Microsoft JhengHei", ui-monospace, sans-serif';

    // Top translucent bar
    ctx.fillStyle = 'rgba(8, 10, 20, 0.64)';
    ctx.fillRect(0, 0, W, 42);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(0, 42, W, 1);

    // Hearts (2x crisp pixel icons)
    for (let i = 0; i < game.player.maxHp; i++) {
      ctx.globalAlpha = i < game.player.hp ? 1 : 0.22;
      ctx.drawImage(this.atlas.items.heart, 14 + i * 24, 12, 20, 18);
    }
    ctx.globalAlpha = 1;

    // Phase Pill
    const isLunar = game.phase === PHASE.LUNAR;
    ctx.fillStyle = isLunar ? 'rgba(56, 212, 255, 0.22)' : 'rgba(255, 178, 56, 0.24)';
    ctx.fillRect(98, 9, 118, 24);
    ctx.strokeStyle = isLunar ? '#4ae3ff' : '#ffbe44';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(98.5, 9.5, 117, 23);
    ctx.font = `700 13px ${UI_FONT}`;
    ctx.fillStyle = isLunar ? '#9ef6ff' : '#ffe38a';
    ctx.fillText(isLunar ? 'LUNAR 星月' : 'SOLAR 熾陽', 109, 26);

    // Dash Ready indicator
    ctx.fillStyle = game.player.canDash ? '#4af7c8' : '#4a5068';
    ctx.fillRect(228, 15, 11, 11);
    ctx.fillStyle = game.player.canDash ? '#d8fff4' : '#7b849e';
    ctx.font = `700 13px ${UI_FONT}`;
    ctx.fillText('DASH', 245, 26);

    // Stage Name
    ctx.fillStyle = '#edf2ff';
    ctx.font = `700 15px ${UI_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(game.level.name, W * 0.5, 27);

    // Coins & Score & Timer
    ctx.textAlign = 'right';
    ctx.drawImage(this.atlas.items.coin, W - 266, 12, 18, 18);
    ctx.font = `700 14px ui-monospace, monospace`;
    ctx.fillStyle = '#ffe169';
    ctx.fillText(`${game.coins}`, W - 216, 26);

    ctx.fillStyle = '#ffffff';
    ctx.fillText(`SCORE ${String(game.score).padStart(6, '0')}`, W - 82, 26);

    ctx.fillStyle = '#a7bce8';
    ctx.fillText(`${game.stageTime.toFixed(1)}s`, W - 12, 26);
    if (game.ghost.bestRun) {
      const delta = game.stageTime - game.ghost.bestRun.time;
      ctx.font = '700 12px ui-monospace, monospace';
      ctx.fillStyle = delta <= 0 ? '#4af7c8' : '#ff8a9e';
      ctx.fillText(`BEST ${game.ghost.bestRun.time.toFixed(1)}s`, W - 12, 58);
    }
    ctx.textAlign = 'left';

    // Combo Badge
    if (game.combo > 1 && game.comboTimer > 0) {
      ctx.fillStyle = '#ffdf5c';
      ctx.font = `800 20px ui-monospace, sans-serif`;
      ctx.fillText(`${game.combo}x COMBO!`, 16, 74);
    }

    // Stage Hint (first 7.5 seconds)
    if (game.stageTime < 7.5 && game.level.hint) {
      const alpha = game.stageTime > 6 ? (7.5 - game.stageTime) / 1.5 : 1;
      ctx.save();
      ctx.globalAlpha = Math.max(0, alpha * 0.94);
      ctx.fillStyle = 'rgba(10, 14, 28, 0.78)';
      ctx.fillRect(72, H - 44, W - 144, 30);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
      ctx.strokeRect(72.5, H - 43.5, W - 145, 29);
      ctx.fillStyle = '#f0f5ff';
      ctx.font = `600 14px ${UI_FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText(game.level.hint, W * 0.5, H - 24);
      ctx.restore();
    }

    // Boss HP Bar
    if (game.boss && game.boss.alive && game.boss.active) {
      const barW = 360;
      const bx = (W - barW) * 0.5;
      const by = 60;
      ctx.fillStyle = 'rgba(10, 12, 24, 0.84)';
      ctx.fillRect(bx - 10, by - 20, barW + 20, 42);
      ctx.fillStyle = '#ff8a9e';
      ctx.font = `700 14px ${UI_FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('PRISM GOLEM — 稜鏡巨像', W * 0.5, by - 3);
      ctx.fillStyle = '#2a2238';
      ctx.fillRect(bx, by + 4, barW, 11);
      ctx.fillStyle = game.boss.bossPhase === PHASE.SOLAR ? '#ffae38' : '#4ae3ff';
      ctx.fillRect(bx, by + 4, barW * (game.boss.hp / game.boss.maxHp), 11);
      ctx.textAlign = 'left';
    }
  }

  _drawDebug(ctx, game) {
    const p = game.player;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
    ctx.fillRect(12, 80, 290, 108);
    ctx.fillStyle = '#7dffb2';
    ctx.font = '13px ui-monospace, monospace';
    ctx.fillText(`FPS: ${game.fps} | RES: ${this.canvas.width}x${this.canvas.height}`, 20, 100);
    ctx.fillText(`POS: ${p.x.toFixed(1)}, ${p.y.toFixed(1)}`, 20, 118);
    ctx.fillText(`VEL: ${p.vx.toFixed(0)}, ${p.vy.toFixed(0)} | GND:${p.onGround ? 1 : 0}`, 20, 136);
    ctx.fillText(`COYOTE:${p.coyoteTimer.toFixed(2)} BUF:${p.jumpBufferTimer.toFixed(2)}`, 20, 154);
    ctx.fillText(`PHASE:${game.phase.toUpperCase()} DASH:${p.canDash ? 'RDY' : 'CD'}`, 20, 172);
  }

  _drawTitleScreen(ctx, game, time) {
    const W = 960;
    const H = 540;
    const UI_FONT = '"Noto Sans TC", "Microsoft JhengHei", ui-monospace, sans-serif';

    ctx.fillStyle = 'rgba(7, 9, 20, 0.44)';
    ctx.fillRect(0, 0, W, H);

    const bob = Math.sin(time * 3) * 6;
    ctx.textAlign = 'center';

    // Title
    ctx.font = '900 58px ui-monospace, "Cascadia Mono", monospace';
    ctx.fillStyle = '#140c24';
    ctx.fillText('CHROMA KNIGHT', W * 0.5 + 4, 172 + bob + 4);
    ctx.fillStyle = game.phase === PHASE.LUNAR ? '#6ef3ff' : '#ffd561';
    ctx.fillText('CHROMA KNIGHT', W * 0.5, 172 + bob);

    ctx.font = `700 22px ${UI_FONT}`;
    ctx.fillStyle = '#edf3ff';
    ctx.fillText('— 稜 鏡 騎 士 ： 雙 相 冒 險 —', W * 0.5, 214 + bob);

    // Feature badges
    ctx.font = `600 15px ${UI_FONT}`;
    ctx.fillStyle = '#c4d3f5';
    ctx.fillText('熾陽 / 星月即時相位切換  •  8向衝刺  •  蹬牆跳  •  空中重擊  •  稜鏡巨像 BOSS', W * 0.5, 268);

    // Animated Start prompt
    const pulse = 0.65 + 0.35 * Math.sin(time * 5);
    ctx.fillStyle = `rgba(255, 240, 160, ${pulse.toFixed(2)})`;
    ctx.font = `700 22px ${UI_FONT}`;
    ctx.fillText('按 [ENTER] 或 [SPACE] 開始冒險', W * 0.5, 348);

    ctx.font = `500 14px ${UI_FONT}`;
    ctx.fillStyle = '#9db2de';
    ctx.fillText('快速選關：[1] 晨光遺跡  [2] 稜鏡峽谷  [3] 翡翠水殿  [4] 熾焰鍛爐  [5] 星月高塔  [6] 雙相聖殿(BOSS)', W * 0.5, 396);
    ctx.fillText('按 [Shift] 預覽雙相光影  •  [F2] 即時關卡編輯器  •  [G] WebGL Shader', W * 0.5, 428);
    ctx.textAlign = 'left';
  }

  _drawPauseOverlay(ctx) {
    const W = 960;
    const H = 540;
    const UI_FONT = '"Noto Sans TC", "Microsoft JhengHei", ui-monospace, sans-serif';
    ctx.fillStyle = 'rgba(6, 8, 18, 0.72)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = `800 36px ${UI_FONT}`;
    ctx.fillText('PAUSED 暫停中', W * 0.5, 244);
    ctx.font = `600 17px ${UI_FONT}`;
    ctx.fillStyle = '#b9c8eb';
    ctx.fillText('[ESC / P] 繼續遊戲    [R] 重玩本關    [1–6] 切換關卡    [F2] 關卡編輯', W * 0.5, 296);
    ctx.textAlign = 'left';
  }

  _drawStageClear(ctx, game) {
    const W = 960;
    const H = 540;
    const UI_FONT = '"Noto Sans TC", "Microsoft JhengHei", ui-monospace, sans-serif';
    ctx.fillStyle = 'rgba(6, 10, 22, 0.78)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffe066';
    ctx.font = '900 42px ui-monospace, monospace';
    ctx.fillText('STAGE CLEAR!', W * 0.5, 176);

    const rank = game.score >= 2200 ? 'S' : game.score >= 1200 ? 'A' : 'B';
    ctx.fillStyle = '#ffffff';
    ctx.font = `600 20px ${UI_FONT}`;
    ctx.fillText(`通關時間：${game.stageTime.toFixed(2)}s    金幣：${game.coins}    分數：${game.score}`, W * 0.5, 244);
    ctx.fillStyle = rank === 'S' ? '#4af7c8' : '#ffd561';
    ctx.font = `800 34px ${UI_FONT}`;
    ctx.fillText(`評價 RANK ${rank}`, W * 0.5, 308);

    ctx.fillStyle = '#c4d3f5';
    ctx.font = `600 18px ${UI_FONT}`;
    ctx.fillText('按 [ENTER] 或 [SPACE] 進入下一關', W * 0.5, 376);
    ctx.textAlign = 'left';
  }

  _drawVictory(ctx, game, time) {
    const W = 960;
    const H = 540;
    const UI_FONT = '"Noto Sans TC", "Microsoft JhengHei", ui-monospace, sans-serif';
    ctx.fillStyle = 'rgba(8, 10, 24, 0.82)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.fillStyle = Math.floor(time * 6) % 2 === 0 ? '#ffe066' : '#6ef3ff';
    ctx.font = '900 44px ui-monospace, monospace';
    ctx.fillText('ALL STAGES CLEARED!', W * 0.5, 172);
    ctx.fillStyle = '#ffffff';
    ctx.font = `700 22px ${UI_FONT}`;
    ctx.fillText('你征服了雙相聖殿並擊敗了稜鏡巨像！', W * 0.5, 228);
    ctx.font = `600 20px ${UI_FONT}`;
    ctx.fillStyle = '#d4e2ff';
    ctx.fillText(`最終總分：${game.score}    收集金幣：${game.coins}`, W * 0.5, 288);
    ctx.fillStyle = '#8effe0';
    ctx.font = `600 18px ${UI_FONT}`;
    ctx.fillText('按 [ENTER] 或 [SPACE] 返回主畫面再戰速通！', W * 0.5, 368);
    ctx.textAlign = 'left';
  }

  _drawGameOver(ctx, game) {
    const W = 960;
    const H = 540;
    const UI_FONT = '"Noto Sans TC", "Microsoft JhengHei", ui-monospace, sans-serif';
    ctx.fillStyle = 'rgba(18, 6, 12, 0.8)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff5978';
    ctx.font = '900 40px ui-monospace, monospace';
    ctx.fillText('FALLEN IN THE CHASM', W * 0.5, 220);
    ctx.fillStyle = '#e8ecf8';
    ctx.font = `600 20px ${UI_FONT}`;
    ctx.fillText(`目前分數：${game.score}`, W * 0.5, 276);
    ctx.fillStyle = '#ffe066';
    ctx.font = `600 18px ${UI_FONT}`;
    ctx.fillText('按 [SPACE / R] 從檢查點立即重生    [ESC] 回標題', W * 0.5, 336);
    ctx.textAlign = 'left';
  }
}
