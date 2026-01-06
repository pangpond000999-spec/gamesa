export interface Position {
  x: number;
  y: number;
}

export interface Question {
  id: string;
  questionText: string;
  isTrue: boolean;
  explanation: string;
}

export enum GameState {
  MENU = 'MENU',
  LOADING = 'LOADING',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY'
}

export enum EntityType {
  EMPTY = 0,
  WALL = 1,
  PLAYER = 2,
  ENEMY = 3,
  GATE_T = 4, // True Gate
  GATE_F = 5, // False Gate
  HEART = 6   // Extra Life
}

export interface GridCell {
  x: number;
  y: number;
  type: EntityType;
}