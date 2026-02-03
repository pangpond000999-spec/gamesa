export type Position = {
  x: number;
  y: number;
};

export enum CellType {
  WALL = 'WALL',
  PATH = 'PATH',
  START = 'START',
  END = 'END',
  GATE = 'GATE',
}

export type LogicOperator = 'AND' | 'OR' | 'IMPLIES' | 'IFF' | 'NOT';

export interface LogicQuestion {
  id: string;
  question: string;
  variableValues: { [key: string]: boolean };
  expressionDisplay: string;
  answer: boolean;
  explanation?: string; // AI generated or static
}

export interface Cell {
  x: number;
  y: number;
  type: CellType;
  visited: boolean;
  question?: LogicQuestion; // Only for gates
  isOpen?: boolean; // Only for gates
}

export interface GameState {
  level: number;
  score: number;
  lives: number;
  playerPosition: Position;
  grid: Cell[][];
  isPlaying: boolean;
  isGameOver: boolean;
  isWon: boolean;
  currentGate: Cell | null; // The gate the player is currently interacting with
}
