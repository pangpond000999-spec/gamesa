import React, { useMemo } from 'react';
import { EntityType, Position } from '../types';
import { COLORS, GRID_HEIGHT, GRID_WIDTH, PLAYER_SIZE, ENEMY_SIZE } from '../constants';
import { Heart } from 'lucide-react';

interface MazeGridProps {
  maze: EntityType[][];
  playerPos: Position;
  enemies: Position[];
  direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
}

const MazeGrid: React.FC<MazeGridProps> = ({ maze, playerPos, enemies, direction }) => {
  
  // Render the static grid map
  const gridCells = useMemo(() => {
    const grid: React.ReactNode[] = [];
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const cellType = maze[y][x];
        let className = `w-full h-full relative flex items-center justify-center ${COLORS[EntityType.EMPTY]}`;
        let content: React.ReactNode = null;

        if (cellType === EntityType.WALL) {
          className = `w-full h-full ${COLORS[EntityType.WALL]}`;
        } else if (cellType === EntityType.GATE_T) {
          className = `w-full h-full rounded-md flex items-center justify-center ${COLORS[EntityType.GATE_T]}`;
          content = "T";
        } else if (cellType === EntityType.GATE_F) {
          className = `w-full h-full rounded-md flex items-center justify-center ${COLORS[EntityType.GATE_F]}`;
          content = "F";
        } else if (cellType === EntityType.HEART) {
          content = (
             <div className="w-full h-full flex items-center justify-center animate-pulse">
                <Heart className={`w-[70%] h-[70%] fill-red-500 ${COLORS[EntityType.HEART]}`} />
             </div>
          );
        }

        grid.push(
          <div key={`${x}-${y}`} className="aspect-square p-[1px]">
            <div className={className}>{content}</div>
          </div>
        );
      }
    }
    return grid;
  }, [maze]);

  // Calculate percentage positions
  const getStyle = (pos: Position, size: number) => ({
    left: `${(pos.x / GRID_WIDTH) * 100}%`,
    top: `${(pos.y / GRID_HEIGHT) * 100}%`,
    width: `${(size / GRID_WIDTH) * 100}%`,
    height: `${(size / GRID_HEIGHT) * 100}%`,
  });

  return (
    <div className="relative max-w-[95vw] md:max-w-[600px] w-full aspect-square rounded-xl bg-white/5 backdrop-blur-md border border-white/20 shadow-2xl overflow-hidden">
      {/* Background Grid */}
      <div 
        className="w-full h-full grid"
        style={{ gridTemplateColumns: `repeat(${GRID_WIDTH}, minmax(0, 1fr))` }}
      >
        {gridCells}
      </div>

      {/* Player */}
      <div 
        className="absolute z-30 transition-transform"
        style={getStyle(playerPos, PLAYER_SIZE)}
      >
         <div className="w-full h-full bg-yellow-300 rounded-full border-2 border-yellow-500 shadow-lg flex items-center justify-center relative animate-pulse">
            {/* Hair */}
            <div className="absolute top-0 w-full h-[40%] bg-amber-900 rounded-t-full"></div>
            {/* Glasses Frame */}
            <div className="absolute top-[35%] w-[90%] flex justify-between px-1">
               <div className="w-[10px] h-[10px] md:w-[12px] md:h-[12px] rounded-full border-2 border-black bg-white/40 backdrop-blur-[1px]"></div>
               <div className="w-[4px] h-[2px] bg-black mt-[5px]"></div>
               <div className="w-[10px] h-[10px] md:w-[12px] md:h-[12px] rounded-full border-2 border-black bg-white/40 backdrop-blur-[1px]"></div>
            </div>
         </div>
      </div>

      {/* Enemies */}
      {enemies.map((enemy, index) => {
         const colors = ['bg-purple-500', 'bg-pink-500', 'bg-orange-500'];
         const color = colors[index % 3];
         return (
          <div 
            key={`enemy-${index}`}
            className="absolute z-20 transition-transform"
            style={getStyle(enemy, ENEMY_SIZE)}
          >
             <div className={`w-full h-full ${color} rounded-t-full rounded-b-lg shadow-lg flex justify-center pt-1`}>
                <div className="flex gap-1">
                   <div className="w-2 h-2 bg-white rounded-full flex items-center justify-center"><div className="w-1 h-1 bg-black rounded-full"></div></div>
                   <div className="w-2 h-2 bg-white rounded-full flex items-center justify-center"><div className="w-1 h-1 bg-black rounded-full"></div></div>
                </div>
                <div className="absolute bottom-[-2px] flex gap-1 w-full justify-center">
                   <div className={`w-1 h-1 ${color} rounded-full`}></div>
                   <div className={`w-1 h-1 ${color} rounded-full`}></div>
                   <div className={`w-1 h-1 ${color} rounded-full`}></div>
                </div>
             </div>
          </div>
         );
      })}
    </div>
  );
};

export default MazeGrid;