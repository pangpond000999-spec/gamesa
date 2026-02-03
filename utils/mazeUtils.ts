import { Cell, CellType, Position } from '../types';
import { GRID_SIZE } from '../constants';
import { generateLogicQuestion } from './logicGenerator';

export const generateMaze = (level: number, playerPos?: Position): { grid: Cell[][], start: Position, end: Position } => {
  // Initialize grid with walls
  const grid: Cell[][] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    const row: Cell[] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      row.push({
        x,
        y,
        type: CellType.WALL,
        visited: false,
      });
    }
    grid.push(row);
  }

  const start: Position = { x: 1, y: 1 };
  const end: Position = { x: GRID_SIZE - 2, y: GRID_SIZE - 2 };

  // Recursive Backtracker
  const stack: Position[] = [start];
  grid[start.y][start.x].type = CellType.PATH;

  const directions = [
    { x: 0, y: -2 }, // Up
    { x: 2, y: 0 },  // Right
    { x: 0, y: 2 },  // Down
    { x: -2, y: 0 }, // Left
  ];

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors: Position[] = [];

    // Find unvisited neighbors
    for (const dir of directions) {
      const nx = current.x + dir.x;
      const ny = current.y + dir.y;

      if (nx > 0 && nx < GRID_SIZE - 1 && ny > 0 && ny < GRID_SIZE - 1) {
        if (grid[ny][nx].type === CellType.WALL) {
             neighbors.push({ x: nx, y: ny });
        }
      }
    }

    if (neighbors.length > 0) {
      const next = neighbors[Math.floor(Math.random() * neighbors.length)];
      
      // Carve path
      grid[next.y][next.x].type = CellType.PATH;
      grid[current.y + (next.y - current.y) / 2][current.x + (next.x - current.x) / 2].type = CellType.PATH;
      
      stack.push(next);
    } else {
      stack.pop();
    }
  }

  // Ensure start and end are open
  grid[start.y][start.x].type = CellType.START;
  grid[end.y][end.x].type = CellType.END;

  // Preserve Player Position if Regenerating
  if (playerPos) {
      // Force player position to be a path
      grid[playerPos.y][playerPos.x].type = CellType.PATH;
      
      // Safety check: ensure the player isn't trapped in a single cell
      // If the player was on an "even" coordinate (wall connector), they might be isolated.
      // Force at least one neighbor to be open.
      const neighbors = [
          {x:0, y:1}, {x:0, y:-1}, {x:1, y:0}, {x:-1, y:0}
      ];
      let hasPathNeighbor = false;
      for (const n of neighbors) {
          const nx = playerPos.x + n.x;
          const ny = playerPos.y + n.y;
          if (grid[ny]?.[nx]?.type !== CellType.WALL) {
              hasPathNeighbor = true;
              break;
          }
      }
      
      if (!hasPathNeighbor) {
          // Force carve a path to a valid neighbor (prefer towards center)
          const dirX = playerPos.x > GRID_SIZE / 2 ? -1 : 1;
          const dirY = playerPos.y > GRID_SIZE / 2 ? -1 : 1;
          if (grid[playerPos.y + dirY]) {
               grid[playerPos.y + dirY][playerPos.x].type = CellType.PATH;
          } else {
               grid[playerPos.y][playerPos.x + dirX].type = CellType.PATH;
          }
      }
  }

  // Add Logic Gates
  // INCREASED DENSITY: More questions per path, but not annoying.
  // Formula: Base 6 + level (capped at reasonable max)
  const numberOfGates = Math.min(25, 6 + level + Math.floor(Math.random() * 3));
  let gatesPlaced = 0;
  let attempts = 0;

  while (gatesPlaced < numberOfGates && attempts < 100) {
    attempts++;
    const gx = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;
    const gy = Math.floor(Math.random() * (GRID_SIZE - 2)) + 1;

    // Check strict conditions to place gate
    const cell = grid[gy][gx];
    const isStart = gx === start.x && gy === start.y;
    const isEnd = gx === end.x && gy === end.y;
    const isPlayer = playerPos && gx === playerPos.x && gy === playerPos.y;

    if (cell.type === CellType.PATH && !isStart && !isEnd && !isPlayer) {
      grid[gy][gx].type = CellType.GATE;
      grid[gy][gx].isOpen = false;
      grid[gy][gx].question = generateLogicQuestion(Math.min(level, 3));
      gatesPlaced++;
    }
  }

  return { grid, start, end };
};