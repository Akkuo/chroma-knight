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

export const PALETTES = {
  solar: {
    skyTop: '#24143a',
    skyMid: '#7c2f4b',
    skyBot: '#f0944d',
    sunColor: '#fff2b0',
    sunGlow: 'rgba(255, 194, 88, 0.35)',
    mountainFar: '#3d1f44',
    mountainMid: '#582949',
    ruinsFar: '#46223e',
    ambient: 'rgba(255, 174, 72, 0.06)',
    accent: '#ffbe44',
    accentBright: '#fff1a8',
    cape: '#ff5247',
    capeTip: '#ffcb47',
  },
  lunar: {
    skyTop: '#070b1c',
    skyMid: '#13244b',
    skyBot: '#1d4c73',
    sunColor: '#d9f8ff',
    sunGlow: 'rgba(84, 218, 255, 0.34)',
    mountainFar: '#101d3b',
    mountainMid: '#162d54',
    ruinsFar: '#122442',
    ambient: 'rgba(64, 200, 255, 0.08)',
    accent: '#4ae3ff',
    accentBright: '#d4fcff',
    cape: '#35d0ff',
    capeTip: '#b57cff',
  },
};
