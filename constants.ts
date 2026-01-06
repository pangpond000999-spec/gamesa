import { EntityType } from "./types";

export const GRID_WIDTH = 21; // Odd number for DFS maze generation
export const GRID_HEIGHT = 21; // Odd number
export const ENEMY_COUNT = 3;
export const MAX_LIVES = 3;

// Movement Constants
export const PLAYER_SPEED = 6; // Tiles per second
export const PLAYER_SIZE = 0.6; // Size relative to tile (0 to 1)
export const ENEMY_SPEED = 3.5; // Tiles per second
export const ENEMY_SIZE = 0.7;

export const COLORS = {
  [EntityType.EMPTY]: 'bg-white/10 backdrop-blur-sm', 
  [EntityType.WALL]: 'bg-indigo-600/90 rounded-sm shadow-sm border border-indigo-500/30',
  [EntityType.PLAYER]: 'z-30', 
  [EntityType.ENEMY]: 'z-20',
  [EntityType.GATE_T]: 'bg-green-500/80 border-2 border-white text-white font-black shadow-[0_0_15px_rgba(74,222,128,0.8)]',
  [EntityType.GATE_F]: 'bg-rose-500/80 border-2 border-white text-white font-black shadow-[0_0_15px_rgba(244,63,94,0.8)]',
  [EntityType.HEART]: 'text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]',
};