export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 270;
export const TILE_SIZE = 16;

export const PHASE = {
  SOLAR: 'solar',
  LUNAR: 'lunar',
};

export const STATE = {
  TITLE: 'title',
  PLAYING: 'playing',
  PAUSED: 'paused',
  STAGE_CLEAR: 'stage_clear',
  GAME_OVER: 'game_over',
  VICTORY: 'victory',
};

export const TILE = {
  EMPTY: 0,
  GROUND: 1,       // Grass-topped earth / stone
  DIRT: 2,         // Deep earth / stone fill
  BRICK: 3,        // Breakable brick
  QUESTION: 4,     // ? block (coin/item)
  USED: 5,         // Depleted ? block
  SOLAR_BLOCK: 6,  // Solid only in SOLAR phase
  LUNAR_BLOCK: 7,  // Solid only in LUNAR phase
  SPIKE: 8,        // Hazard spikes
  CRACKED: 9,      // Shatters on Ground Pound or Shell
  ONE_WAY: 10,     // Jump-through bridge platform
  CRUMBLE: 11,     // Breaks briefly after standing on it
  WATER: 12,       // Decorative/hazardous animated pool (shallow water or plasma)
  PILLAR: 13,      // Background decorative stone column (non-solid)
  LAVA: 14,        // Glowing hazard lava/abyss
  BOUNCE_PAD: 15,  // Embedded spring tile
  GOAL_GATE: 16,   // Stage exit portal
  ICE: 17,         // Low-friction slippery ice block
};

export const PHYSICS = {
  GRAVITY: 960,
  LUNAR_GRAVITY_MULT: 0.78,
  MAX_FALL: 370,
  WALL_SLIDE_MAX: 68,

  RUN_SPEED: 148,
  GROUND_ACCEL: 1550,
  GROUND_DECEL: 1650,
  AIR_ACCEL: 1080,
  AIR_DECEL: 540,

  JUMP_VEL: -312,
  JUMP_CUT_MULT: 0.48,
  WALL_JUMP_X: 168,
  WALL_JUMP_Y: -288,
  STOMP_BOUNCE: -265,
  STOMP_HIGH_BOUNCE: -348,
  SPRING_VEL: -425,
  SPRING_POUND_VEL: -505,

  DASH_SPEED: 345,
  DASH_TIME: 0.145,
  DASH_COOLDOWN: 0.14,

  GROUND_POUND_SPEED: 430,
  GROUND_POUND_WINDUP: 0.08,

  COYOTE_TIME: 0.105,
  JUMP_BUFFER: 0.125,
  WALL_COYOTE_TIME: 0.11,
  CORNER_CORRECT_PX: 5,
};

export const BIOME_THEMES = {
  ruins: {
    weather: 'fireflies',
    bgStyle: 'arches',
    solar: {
      skyTop: '#24143a', skyMid: '#7c2f4b', skyBot: '#f0944d',
      sunColor: '#fff2b0', sunGlow: 'rgba(255, 194, 88, 0.35)',
      mountainFar: '#3d1f44', mountainMid: '#582949', propColor: '#46223e',
      ambient: 'rgba(255, 174, 72, 0.05)', grass: '#74e86b',
      tileTop: '#44c767', tileTopDark: '#268a4d', tileTopHi: '#7ee872',
      tileDirt: '#7a4b38', tileDirtDark: '#522f26', tileDirtHi: '#9e674d',
    },
    lunar: {
      skyTop: '#070b1c', skyMid: '#13244b', skyBot: '#1d4c73',
      sunColor: '#d9f8ff', sunGlow: 'rgba(84, 218, 255, 0.34)',
      mountainFar: '#101d3b', mountainMid: '#162d54', propColor: '#122442',
      ambient: 'rgba(64, 200, 255, 0.07)', grass: '#6ef7e8',
      tileTop: '#39c9c4', tileTopDark: '#1d7588', tileTopHi: '#8cf7ee',
      tileDirt: '#3a355c', tileDirtDark: '#25213e', tileDirtHi: '#564f82',
    },
  },
  chasm: {
    weather: 'prism',
    bgStyle: 'crystals',
    solar: {
      skyTop: '#2a0f3b', skyMid: '#7a225c', skyBot: '#e86f7c',
      sunColor: '#ffe0b5', sunGlow: 'rgba(255, 140, 150, 0.38)',
      mountainFar: '#40174f', mountainMid: '#5e215e', propColor: '#8f3a84',
      ambient: 'rgba(255, 110, 140, 0.06)', grass: '#ff96b4',
      tileTop: '#d95b8b', tileTopDark: '#8f2d5e', tileTopHi: '#ffa6c6',
      tileDirt: '#59335c', tileDirtDark: '#381d3d', tileDirtHi: '#7d4d82',
    },
    lunar: {
      skyTop: '#0d0924', skyMid: '#241a59', skyBot: '#2d5b8f',
      sunColor: '#e2d9ff', sunGlow: 'rgba(154, 128, 255, 0.36)',
      mountainFar: '#191342', mountainMid: '#252163', propColor: '#4848a8',
      ambient: 'rgba(120, 110, 255, 0.07)', grass: '#9ef2ff',
      tileTop: '#6b7cff', tileTopDark: '#3c43a8', tileTopHi: '#b5c4ff',
      tileDirt: '#2c2754', tileDirtDark: '#1a1638', tileDirtHi: '#463f7d',
    },
  },
  aqueduct: {
    weather: 'rain',
    bgStyle: 'waterfalls',
    solar: {
      skyTop: '#0f2b38', skyMid: '#1f636e', skyBot: '#6dc4a6',
      sunColor: '#eaffc4', sunGlow: 'rgba(154, 245, 198, 0.34)',
      mountainFar: '#164552', mountainMid: '#1f5e66', propColor: '#297075',
      ambient: 'rgba(92, 224, 180, 0.06)', grass: '#84ffba',
      tileTop: '#36c98e', tileTopDark: '#1c7d64', tileTopHi: '#96ffd0',
      tileDirt: '#3d5e66', tileDirtDark: '#263d45', tileDirtHi: '#5a828c',
    },
    lunar: {
      skyTop: '#04141f', skyMid: '#0b2f45', skyBot: '#145e73',
      sunColor: '#c4ffff', sunGlow: 'rgba(64, 232, 232, 0.36)',
      mountainFar: '#0a2233', mountainMid: '#0e364d', propColor: '#164b63',
      ambient: 'rgba(48, 210, 224, 0.08)', grass: '#66f7ff',
      tileTop: '#24b8c9', tileTopDark: '#12647a', tileTopHi: '#8ef5ff',
      tileDirt: '#233b4d', tileDirtDark: '#152633', tileDirtHi: '#395b73',
    },
  },
  foundry: {
    weather: 'embers',
    bgStyle: 'gears',
    solar: {
      skyTop: '#1f090d', skyMid: '#5e1714', skyBot: '#c94c1a',
      sunColor: '#ffcf66', sunGlow: 'rgba(255, 120, 32, 0.42)',
      mountainFar: '#330e10', mountainMid: '#4d1714', propColor: '#66241c',
      ambient: 'rgba(255, 102, 34, 0.08)', grass: '#ff9447',
      tileTop: '#cc522b', tileTopDark: '#7d2416', tileTopHi: '#ff9654',
      tileDirt: '#3d2a2e', tileDirtDark: '#24181c', tileDirtHi: '#5c4147',
    },
    lunar: {
      skyTop: '#12081c', skyMid: '#2e1238', skyBot: '#611d4a',
      sunColor: '#ffd4e5', sunGlow: 'rgba(255, 88, 152, 0.36)',
      mountainFar: '#1f0d2b', mountainMid: '#331542', propColor: '#4c205e',
      ambient: 'rgba(200, 68, 160, 0.07)', grass: '#ff80c4',
      tileTop: '#9c4287', tileTopDark: '#591e52', tileTopHi: '#e080c8',
      tileDirt: '#291e36', tileDirtDark: '#181021', tileDirtHi: '#423154',
    },
  },
  spire: {
    weather: 'snow',
    bgStyle: 'aurora',
    solar: {
      skyTop: '#162044', skyMid: '#3c548c', skyBot: '#99c4e6',
      sunColor: '#ffffff', sunGlow: 'rgba(200, 232, 255, 0.4)',
      mountainFar: '#263866', mountainMid: '#3a548c', propColor: '#5674ad',
      ambient: 'rgba(180, 224, 255, 0.06)', grass: '#d4f7ff',
      tileTop: '#8cd4f5', tileTopDark: '#4786b8', tileTopHi: '#e6fbff',
      tileDirt: '#4d5d80', tileDirtDark: '#303b57', tileDirtHi: '#6f84b0',
    },
    lunar: {
      skyTop: '#050b1f', skyMid: '#0e244a', skyBot: '#1d546e',
      sunColor: '#e6fcff', sunGlow: 'rgba(92, 245, 218, 0.38)',
      mountainFar: '#0c1b38', mountainMid: '#153159', propColor: '#214d7a',
      ambient: 'rgba(84, 235, 210, 0.07)', grass: '#8effe8',
      tileTop: '#56d9d4', tileTopDark: '#26788a', tileTopHi: '#c4fff9',
      tileDirt: '#293857', tileDirtDark: '#182238', tileDirtHi: '#415780',
    },
  },
  sanctum: {
    weather: 'runes',
    bgStyle: 'cathedral',
    solar: {
      skyTop: '#1a0f2e', skyMid: '#4a2359', skyBot: '#c98838',
      sunColor: '#fff5ba', sunGlow: 'rgba(255, 210, 96, 0.42)',
      mountainFar: '#2b1842', mountainMid: '#422559', propColor: '#5c366b',
      ambient: 'rgba(255, 200, 88, 0.07)', grass: '#ffe078',
      tileTop: '#e0a938', tileTopDark: '#8f5916', tileTopHi: '#fff0a6',
      tileDirt: '#382c4a', tileDirtDark: '#221a30', tileDirtHi: '#574670',
    },
    lunar: {
      skyTop: '#06071a', skyMid: '#151842', skyBot: '#29387a',
      sunColor: '#d9f5ff', sunGlow: 'rgba(110, 210, 255, 0.4)',
      mountainFar: '#101233', mountainMid: '#1b2052', propColor: '#2c3575',
      ambient: 'rgba(100, 175, 255, 0.08)', grass: '#9ef2ff',
      tileTop: '#5ce0ff', tileTopDark: '#2472ad', tileTopHi: '#d4fcff',
      tileDirt: '#202242', tileDirtDark: '#121329', tileDirtHi: '#373b6b',
    },
  },
};

export const PALETTES = {
  solar: {
    ...BIOME_THEMES.ruins.solar,
    accent: '#ffbe44',
    accentBright: '#fff1a8',
    cape: '#ff5247',
    capeTip: '#ffcb47',
  },
  lunar: {
    ...BIOME_THEMES.ruins.lunar,
    accent: '#4ae3ff',
    accentBright: '#d4fcff',
    cape: '#35d0ff',
    capeTip: '#b57cff',
  },
};
