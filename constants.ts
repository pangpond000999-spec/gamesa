export const GRID_SIZE = 15; // Must be odd for recursive backtracker
export const INITIAL_LIVES = 3;
export const POINTS_PER_GATE = 100;
export const POINTS_LEVEL_COMPLETE = 500;

// Mapping operators to Thai/Math symbols
export const OPERATOR_SYMBOLS: Record<string, string> = {
  AND: '∧',
  OR: '∨',
  IMPLIES: '→',
  IFF: '↔',
  NOT: '~',
};

export const OPERATOR_NAMES_TH: Record<string, string> = {
  AND: 'และ',
  OR: 'หรือ',
  IMPLIES: 'ถ้า...แล้ว',
  IFF: 'ก็ต่อเมื่อ',
  NOT: 'นิเสธ',
};
