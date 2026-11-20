import { TILE, TILE_SIZE, PHASE } from './constants.js';

/*
  ASCII Map Legend:
  . = Empty
  # = Ground (grass top)
  d = Dirt / Stone fill
  B = Breakable Brick
  ? = Question Block (coins / powerup)
  S = Solar Phase Block (solid in SOLAR)
  L = Lunar Phase Block (solid in LUNAR)
  ^ = Spikes
  X = Cracked Stone (shatter via Ground Pound or Shell)
  - = One-way wooden bridge
  C = Crumbling platform
  ~ = Water pool (with real-time reflection)
  ! = Glowing lava hazard
  | = Background decorative pillar

  Entities:
  P = Player spawn
  G = Goal Portal
  c = Coin
  D = Dash-Reset Crystal
  U = Springboard
  K = Checkpoint Lantern
  e = Slime Hopper
  t = Shell Beetle
  w = Solar Wisp
  v = Lunar Wisp
  H = Heart Pickup
  @ = Boss Spawn (Prism Golem)
*/

const STAGE_1_MAP = [
  '....................................................................................................',
  '....................................................................................................',
  '....................................................................................................',
  '....................................................................................................',
  '........................................................c.c.c.......................................',
  '.......................................................-------......................c.c.c...........',
  '..................c.c..............................................................B?B?B............',
  '.................B?B?B.......................c.c.c..................................................',
  '............................................LLLLLLL...................c.c.c.........................',
  '..........?.........................................................SSSSSSS...............D.........',
  '..................................c.c.....................................................c.........',
  '.................................SSSSS................c.c.c.........................LLLL............',
  '.....P.......c.c.....e.........|.......|....t....K....XXXXX....e.....|.....t.......c....c......G....',
  '###########..####..######....#############..########..#####..#####..###########..########..#########',
  'ddddddddddd~~dddd~~dddddd~~~~ddddddddddddd!!dddddddd!!ddddd!!ddddd~~ddddddddddd!!dddddddd!!ddddddddd',
  'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
  'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
];

const STAGE_2_MAP = [
  '..............................................................................................................',
  '..............................................................................................................',
  '..............................................................................................................',
  '.....................................................c.c.c....................................................',
  '....................................................-------...................................................',
  '.............................................................................c.c.c............................',
  '.......................................c.c.................................#.......#..........................',
  '......................................SSSSS...........D....................#...c...#..........................',
  '...........................c.c.............................................#..LLL..#...........c.c.c..........',
  '..........................LLLLL..............c.c...........c.c.............#.......#..........SSSSSSS.........',
  '..............c.c...........................CCCCC.........SSSSS............#..SSS..#..........................',
  '............B?B?B.....D.............U......................................#...D...#....D.....................',
  '.....P...c..........c...e..........###.............t..K....w....v.....U....#.......#........t.....e.......G...',
  '##########....SSSS....######..LLL..###....LLLL....######........####..###..#..SSS..#..LLLL..#########..#######',
  'dddddddddd!!!!....!!!!dddddd!!...!!ddd!!!!....!!!!dddddd!!!!!!!!dddd!!ddd!!d!!...!!d!!....!!ddddddddd!!ddddddd',
  'dddddddddd!!!!!!!!!!!!dddddd!!!!!!!ddd!!!!!!!!!!!!dddddd!!!!!!!!dddd!!ddd!!d!!!!!!!d!!!!!!!!ddddddddd!!ddddddd',
  'dddddddddd!!!!!!!!!!!!dddddd!!!!!!!ddd!!!!!!!!!!!!dddddd!!!!!!!!dddd!!ddd!!d!!!!!!!d!!!!!!!!ddddddddd!!ddddddd',
];

const STAGE_3_MAP = [
  '....................................................................................................................',
  '....................................................................................................................',
  '....................................................................................................................',
  '..........................................c.c.c.c...................................................................',
  '.........................................---------....................................c.c.c.........................',
  '......................c.c.c..........................................................B?B?B?B........................',
  '.....................B?B?B......................................c.c.................................................',
  '...............................................................LLLLL................................................',
  '....................................c.c.c.........................................c.c.c..........c.c.c..............',
  '.............c.c...................SSSSSSS..............D........................SSSSSSS........LLLLLLL.............',
  '............-----...............................................w.......v...........................................',
  '.........................U......................c.c.......................................U.........................',
  '.....P.....c.....t......###..c.c..........t....XXXXX....K....|.....e.....|....t....e.....###.....c...c.........G....',
  '##########....######....###..----..#############...########..#############..###########..###...#########....########',
  'dddddddddd~~~~dddddd~~~~ddd~~~~~~~~ddddddddddddd~~~dddddddd~~ddddddddddddd~~ddddddddddd~~ddd~~~ddddddddd~~~~dddddddd',
  'dddddddddd~~~~dddddd~~~~ddd~~~~~~~~ddddddddddddd~~~dddddddd~~ddddddddddddd~~ddddddddddd~~ddd~~~ddddddddd~~~~dddddddd',
  'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
];

const STAGE_4_MAP = [
  '........................................................................................................................',
  '........................................................................................................................',
  '........................................................................................................................',
  '....................................................................c.c.c...............................................',
  '...................................................................-------..............................................',
  '........................................c.c.c........................................................c.c.c..............',
  '.......................................B?B?B........................................................B?B?B...............',
  '........................................................c.c.............................................................',
  '...................c.c.................................SSSSS................c.c..........c.c............................',
  '..................SSSSS......D...........c.c.......................D.......CCCCC........LLLLL......D....................',
  '........................................CCCCC...........................................................................',
  '..........c.c......................................U......................................................U.............',
  '.....P...LLLLL.....e.....t.......w......c...c.....###.....K....v.....t.....XXXXX....H.....e.....w........###........G...',
  '#########.....#############.....####....#####.....###..########....#####...#####..#####..######....LLLL..###..##########',
  'ddddddddd!!!!!ddddddddddddd!!!!!dddd!!!!ddddd!!!!!ddd!!dddddddd!!!!ddddd!!!ddddd!!ddddd!!dddddd!!!!....!!ddd!!dddddddddd',
  'ddddddddd!!!!!ddddddddddddd!!!!!dddd!!!!ddddd!!!!!ddd!!dddddddd!!!!ddddd!!!ddddd!!ddddd!!dddddd!!!!!!!!!!ddd!!dddddddddd',
  'ddddddddd!!!!!ddddddddddddd!!!!!dddd!!!!ddddd!!!!!ddd!!dddddddd!!!!ddddd!!!ddddd!!ddddd!!dddddd!!!!!!!!!!ddd!!dddddddddd',
];

const STAGE_5_MAP = [
  '........................................................................................................................',
  '........................................................................................................................',
  '........................................#........#......................................................................',
  '........................................#..c..c..#.................................c.c.c................................',
  '........................................#..LLLL..#................................-------...............................',
  '......................c.c.c.............#........#...............................................#.......#..............',
  '.....................-------............#..SSSS..#.............c.c...............................#..c.c..#..............',
  '........................................#...D....#............LLLLL.........D....................#..SSS..#..............',
  '.............c.c........................#........#....................................c.c........#.......#..............',
  '............LLLLL.........D.............#..LLLL..#.....w................v............CCCCC.......#..LLL..#....D.........',
  '........................................#........#...............................................#...D...#..............',
  '.......................U................#..SSSS..#..........U....................................#.......#..............',
  '.....P....c.....e.....###.....t.........#........#...K.....###....c...c.....t.....H.....e.....U..#.......#..........G...',
  '#########...LLLL...######..######..SSS..#........#..#####..###..SSSS..LLLL..##########..####..##.#..SSS..#..LLL..#######',
  'ddddddddd!!!....!!!dddddd!!dddddd!!...!!d!!!!!!!!d!!ddddd!!ddd!!....!!....!!dddddddddd!!dddd!!dd!d!!...!!d!!...!!ddddddd',
  'ddddddddd!!!!!!!!!!dddddd!!dddddd!!!!!!!d!!!!!!!!d!!ddddd!!ddd!!!!!!!!!!!!!!dddddddddd!!dddd!!dd!d!!!!!!!d!!!!!!!ddddddd',
  'ddddddddd!!!!!!!!!!dddddd!!dddddd!!!!!!!d!!!!!!!!d!!ddddd!!ddd!!!!!!!!!!!!!!dddddddddd!!dddd!!dd!d!!!!!!!d!!!!!!!ddddddd',
];

const STAGE_6_MAP = [
  '...............................................................................................................',
  '...............................................................................................................',
  '...............................................................................................................',
  '...............................................................................................................',
  '............................................................................................|.............|....',
  '............................................................................................|.............|....',
  '............................................................................................|.............|....',
  '...........................................c.c.c............................................|...c.....c...|....',
  '..........................................B?B?B?B...........................................|..SSS...LLL..|....',
  '...................c.c.............................................c.c......................|.............|....',
  '..................SSSSS......D............LLLLLLL......D..........CCCCC.........H...........|......D......|....',
  '..........c.c...............................................................................|.............|....',
  '.....P...LLLLL....e....t.....w.............XXXXX.......v....U.......t.......K...............|......@......|..G.',
  '#########.....#############.....####..###############.....#####...#####..###########........###################',
  'ddddddddd!!!!!ddddddddddddd!!!!!dddd!!ddddddddddddddd!!!!!ddddd!!!ddddd!!ddddddddddd!!!!!!!!ddddddddddddddddddd',
  'ddddddddd!!!!!ddddddddddddd!!!!!dddd!!ddddddddddddddd!!!!!ddddd!!!ddddd!!ddddddddddd!!!!!!!!ddddddddddddddddddd',
  'ddddddddd!!!!!ddddddddddddd!!!!!dddd!!ddddddddddddddd!!!!!ddddd!!!ddddd!!ddddddddddd!!!!!!!!ddddddddddddddddddd',
];

export const STAGE_DEFS = [
  {
    id: 1,
    biome: 'ruins',
    name: 'STAGE 1/6 — 晨光遺跡',
    subtitle: 'Sunlit Ruins',
    startPhase: PHASE.SOLAR,
    map: STAGE_1_MAP,
    hint: '按 [Shift / E / K] 切換 熾陽/星月 相位！空中按 [↓] 重擊可擊碎裂石！',
    hasBoss: false,
  },
  {
    id: 2,
    biome: 'chasm',
    name: 'STAGE 2/6 — 稜鏡峽谷',
    subtitle: 'Prism Chasm',
    startPhase: PHASE.LUNAR,
    map: STAGE_2_MAP,
    hint: '紫晶峽谷！星月相位擁有低重力浮空，善用衝刺水晶與蹬牆跳穿越裂谷！',
    hasBoss: false,
  },
  {
    id: 3,
    biome: 'aqueduct',
    name: 'STAGE 3/6 — 翡翠水殿',
    subtitle: 'Emerald Aqueduct',
    startPhase: PHASE.SOLAR,
    map: STAGE_3_MAP,
    hint: '雨幕瀑布水殿！踢出甲殼甲蟲撞飛敵人與裂石，彈簧直衝高空隱藏寶庫！',
    hasBoss: false,
  },
  {
    id: 4,
    biome: 'foundry',
    name: 'STAGE 4/6 — 熾焰鍛爐',
    subtitle: 'Solar Foundry',
    startPhase: PHASE.SOLAR,
    map: STAGE_4_MAP,
    hint: '火山齒輪鍛爐！精準把握崩塌磚節奏與空中衝刺水晶連跳！',
    hasBoss: false,
  },
  {
    id: 5,
    biome: 'spire',
    name: 'STAGE 5/6 — 星月高塔',
    subtitle: 'Lunar Spire',
    startPhase: PHASE.LUNAR,
    map: STAGE_5_MAP,
    hint: '極光雪峰雙塔！在垂直井道中交替切換熾陽/星月相位並配合蹬牆跳登頂！',
    hasBoss: false,
  },
  {
    id: 6,
    biome: 'sanctum',
    name: 'STAGE 6/6 — 雙相聖殿',
    subtitle: 'Twin-Phase Sanctum',
    startPhase: PHASE.SOLAR,
    map: STAGE_6_MAP,
    hint: '聖殿最終決戰：擊敗【稜鏡巨像】！踩踏頭頂核心或踢龜殼造成雙倍暴擊！',
    hasBoss: true,
  },
];

export class Level {
  constructor(def) {
    this.def = def;
    this.id = def.id;
    this.biome = def.biome || 'ruins';
    this.name = def.name;
    this.subtitle = def.subtitle;
    this.hint = def.hint;
    this.hasBoss = def.hasBoss;

    const rows = def.map;
    this.height = rows.length;
    this.width = rows[0].length;
    this.widthPx = this.width * TILE_SIZE;
    this.heightPx = this.height * TILE_SIZE;

    this.tiles = new Uint8Array(this.width * this.height);
    this.bumpOffsets = new Float32Array(this.width * this.height);
    this.crumbleTimers = new Map(); // tileIndex -> { state: 'shaking'|'gone', timer }

    this.spawn = { x: 48, y: 160 };
    this.goal = { x: (this.width - 4) * TILE_SIZE, y: 12 * TILE_SIZE };
    this.entitySpawns = [];
    this.bossArenaX = null;

    for (let y = 0; y < this.height; y++) {
      const row = rows[y];
      for (let x = 0; x < this.width; x++) {
        const ch = row[x] || '.';
        let t = TILE.EMPTY;
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;

        switch (ch) {
          case '#': t = TILE.GROUND; break;
          case 'd': t = TILE.DIRT; break;
          case 'B': t = TILE.BRICK; break;
          case '?': t = TILE.QUESTION; break;
          case 'S': t = TILE.SOLAR_BLOCK; break;
          case 'L': t = TILE.LUNAR_BLOCK; break;
          case '^': t = TILE.SPIKE; break;
          case 'X': t = TILE.CRACKED; break;
          case '-': t = TILE.ONE_WAY; break;
          case 'C': t = TILE.CRUMBLE; break;
          case '~': t = TILE.WATER; break;
          case '!': t = TILE.LAVA; break;
          case '|': t = TILE.PILLAR; break;
          case 'P': this.spawn = { x: px, y: py - 2 }; break;
          case 'G':
            t = TILE.GOAL_GATE;
            this.goal = { x: px, y: py };
            break;
          case 'c': this.entitySpawns.push({ type: 'coin', x: px + 3, y: py + 3 }); break;
          case 'D': this.entitySpawns.push({ type: 'dash_crystal', x: px + 2, y: py + 2 }); break;
          case 'U': this.entitySpawns.push({ type: 'spring', x: px, y: py }); break;
          case 'K': this.entitySpawns.push({ type: 'checkpoint', x: px, y: py - 8 }); break;
          case 'e': this.entitySpawns.push({ type: 'slime', x: px, y: py + 2 }); break;
          case 't': this.entitySpawns.push({ type: 'beetle', x: px, y: py + 2 }); break;
          case 'w': this.entitySpawns.push({ type: 'wisp', x: px, y: py, phase: PHASE.SOLAR }); break;
          case 'v': this.entitySpawns.push({ type: 'wisp', x: px, y: py, phase: PHASE.LUNAR }); break;
          case 'H': this.entitySpawns.push({ type: 'heart', x: px + 3, y: py + 3 }); break;
          case '@':
            this.bossArenaX = (x - 10) * TILE_SIZE;
            this.entitySpawns.push({ type: 'boss', x: px - 8, y: py - 16 });
            break;
          default: break;
        }
        this.tiles[y * this.width + x] = t;
      }
    }

    // Add moving platforms tailored to each stage
    if (this.id === 1) {
      this.entitySpawns.push({ type: 'platform', x: 28 * 16, y: 11 * 16, w: 48, rangeX: 56, rangeY: 0, speed: 1.5 });
    } else if (this.id === 2) {
      this.entitySpawns.push({ type: 'platform', x: 16 * 16, y: 12 * 16, w: 48, rangeX: 48, rangeY: 0, speed: 1.7 });
      this.entitySpawns.push({ type: 'platform', x: 56 * 16, y: 11 * 16, w: 48, rangeX: 0, rangeY: 42, speed: 1.6 });
    } else if (this.id === 3) {
      this.entitySpawns.push({ type: 'platform', x: 27 * 16, y: 11 * 16, w: 48, rangeX: 52, rangeY: 0, speed: 1.5 });
      this.entitySpawns.push({ type: 'platform', x: 74 * 16, y: 10 * 16, w: 48, rangeX: 0, rangeY: 38, speed: 1.7 });
    } else if (this.id === 4) {
      this.entitySpawns.push({ type: 'platform', x: 28 * 16, y: 12 * 16, w: 44, rangeX: 54, rangeY: 0, speed: 1.9 });
      this.entitySpawns.push({ type: 'platform', x: 63 * 16, y: 11 * 16, w: 44, rangeX: 46, rangeY: 0, speed: 2.0 });
      this.entitySpawns.push({ type: 'platform', x: 96 * 16, y: 11 * 16, w: 44, rangeX: 0, rangeY: 44, speed: 1.8 });
    } else if (this.id === 5) {
      this.entitySpawns.push({ type: 'platform', x: 43 * 16, y: 10 * 16, w: 40, rangeX: 0, rangeY: 54, speed: 1.8 });
      this.entitySpawns.push({ type: 'platform', x: 76 * 16, y: 11 * 16, w: 44, rangeX: 46, rangeY: 0, speed: 1.9 });
    } else if (this.id === 6) {
      this.entitySpawns.push({ type: 'platform', x: 70 * 16, y: 11 * 16, w: 48, rangeX: 48, rangeY: 0, speed: 1.9 });
    }
  }

  getTile(tx, ty) {
    if (tx < 0 || tx >= this.width) return TILE.DIRT;
    if (ty < 0) return TILE.EMPTY;
    if (ty >= this.height) return TILE.EMPTY;
    return this.tiles[ty * this.width + tx];
  }

  setTile(tx, ty, val) {
    if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height) return;
    this.tiles[ty * this.width + tx] = val;
  }

  bumpTile(tx, ty) {
    if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height) return;
    this.bumpOffsets[ty * this.width + tx] = -5;
  }

  triggerCrumble(tx, ty) {
    const idx = ty * this.width + tx;
    if (!this.crumbleTimers.has(idx)) {
      this.crumbleTimers.set(idx, { state: 'shaking', timer: 0.52, tx, ty });
    }
  }

  isSolid(tx, ty, phase) {
    const t = this.getTile(tx, ty);
    if (t === TILE.GROUND || t === TILE.DIRT || t === TILE.BRICK || t === TILE.QUESTION || t === TILE.USED || t === TILE.CRACKED) {
      return true;
    }
    if (t === TILE.SOLAR_BLOCK) return phase === PHASE.SOLAR;
    if (t === TILE.LUNAR_BLOCK) return phase === PHASE.LUNAR;
    if (t === TILE.CRUMBLE) {
      const c = this.crumbleTimers.get(ty * this.width + tx);
      return !c || c.state !== 'gone';
    }
    return false;
  }

  isOneWay(tx, ty) {
    return this.getTile(tx, ty) === TILE.ONE_WAY;
  }

  isHazard(tx, ty) {
    const t = this.getTile(tx, ty);
    return t === TILE.SPIKE || t === TILE.LAVA;
  }

  update(dt, particles) {
    for (let i = 0; i < this.bumpOffsets.length; i++) {
      if (this.bumpOffsets[i] < 0) {
        this.bumpOffsets[i] = Math.min(0, this.bumpOffsets[i] + 38 * dt);
      }
    }

    for (const [idx, c] of this.crumbleTimers.entries()) {
      c.timer -= dt;
      if (c.state === 'shaking' && c.timer <= 0) {
        c.state = 'gone';
        c.timer = 2.6;
        particles.spawnDebris(c.tx * 16 + 8, c.ty * 16 + 8, '#a6876f', '#61493c');
      } else if (c.state === 'gone' && c.timer <= 0) {
        this.crumbleTimers.delete(idx);
        particles.burst(c.tx * 16 + 8, c.ty * 16 + 8, 6, '#f2d9b8', { speedMax: 45, gravity: 0 });
      }
    }
  }
}
