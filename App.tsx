import React, { useState, useCallback, useRef } from 'react';
import { generateMaze } from './utils/mazeUtils';
import { LogicModal } from './components/LogicModal';
import { Controls } from './components/Controls';
import { GameState, CellType } from './types';
import { GRID_SIZE, POINTS_PER_GATE, POINTS_LEVEL_COMPLETE } from './constants';
import { Trophy, Play, Zap } from 'lucide-react';

const App: React.FC = () => {
  const [showStartScreen, setShowStartScreen] = useState(true);
  const [gameState, setGameState] = useState<GameState>({
    level: 1,
    score: 0,
    lives: 999,
    playerPosition: { x: 1, y: 1 },
    grid: [],
    isPlaying: false,
    isGameOver: false,
    isWon: false,
    currentGate: null,
  });

  const mazeRef = useRef<HTMLDivElement>(null);

  // Initialize Level
  const startLevel = useCallback((level: number, currentScore: number) => {
    const { grid, start } = generateMaze(level);
    setGameState({
      level,
      score: currentScore,
      lives: 999,
      playerPosition: start,
      grid,
      isPlaying: true,
      isGameOver: false,
      isWon: false,
      currentGate: null,
    });
  }, []);

  const handleStartGame = () => {
    setShowStartScreen(false);
    startLevel(1, 0);
  };

  // Handle Movement
  const movePlayer = useCallback((dx: number, dy: number) => {
    if (!gameState.isPlaying || gameState.currentGate || gameState.isGameOver) return;

    const newX = gameState.playerPosition.x + dx;
    const newY = gameState.playerPosition.y + dy;

    // Check Bounds
    if (newX < 0 || newX >= GRID_SIZE || newY < 0 || newY >= GRID_SIZE) return;

    const targetCell = gameState.grid[newY][newX];

    // Check Wall
    if (targetCell.type === CellType.WALL) return;

    // Check Gate
    if (targetCell.type === CellType.GATE && !targetCell.isOpen) {
      setGameState(prev => ({ ...prev, currentGate: targetCell }));
      return;
    }

    // Check End
    if (targetCell.type === CellType.END) {
        // Level Complete
        const bonus = POINTS_LEVEL_COMPLETE * gameState.level;
        setGameState(prev => ({
            ...prev,
            isPlaying: false,
            isWon: true,
            score: prev.score + bonus
        }));
        return;
    }

    // Move
    setGameState(prev => {
        const newGrid = [...prev.grid];
        // Clean up previous visited state if needed, but keeping trail is fine
        newGrid[newY][newX] = { ...newGrid[newY][newX], visited: true };
        return {
            ...prev,
            playerPosition: { x: newX, y: newY },
            grid: newGrid
        };
    });
  }, [gameState]);

  // Handle Keyboard Input
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': movePlayer(0, -1); break;
        case 'ArrowDown': movePlayer(0, 1); break;
        case 'ArrowLeft': movePlayer(-1, 0); break;
        case 'ArrowRight': movePlayer(1, 0); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [movePlayer]);

  // Handle Logic Gate Result
  const handleGateResult = (success: boolean) => {
    if (success) {
      setGameState(prev => {
        if (!prev.currentGate) return prev;
        const newGrid = [...prev.grid];
        // Open the gate
        newGrid[prev.currentGate.y][prev.currentGate.x] = {
            ...prev.currentGate,
            isOpen: true,
            type: CellType.PATH 
        };
        
        return {
          ...prev,
          currentGate: null,
          score: prev.score + POINTS_PER_GATE,
          grid: newGrid,
          playerPosition: { x: prev.currentGate.x, y: prev.currentGate.y }
        };
      });
    } else {
      // WRONG ANSWER LOGIC: Regenerate Maze
      setGameState(prev => {
          const { grid: newGrid } = generateMaze(prev.level, prev.playerPosition);
          return {
              ...prev,
              grid: newGrid,
              currentGate: null,
          };
      });
      
      // Visual feedback
      if (mazeRef.current) {
          mazeRef.current.animate([
              { filter: 'hue-rotate(0deg) blur(0px)' },
              { filter: 'hue-rotate(180deg) blur(2px)' },
              { filter: 'hue-rotate(0deg) blur(0px)' }
          ], { duration: 600 });
      }
    }
  };

  const nextLevel = () => {
      startLevel(gameState.level + 1, gameState.score);
  };

  // Rendering Helpers
  const getCellClass = (cell: GameState['grid'][0][0]) => {
    const base = "w-full h-full flex items-center justify-center relative ";
    
    switch (cell.type) {
        // Walls: Lighter, raised look
        case CellType.WALL: return base + "bg-slate-700 shadow-[inset_0_0_5px_rgba(0,0,0,0.5)] border-t border-slate-600";
        
        // Start: Green tint
        case CellType.START: return base + "bg-green-900/30";
        
        // End: Cyan pulse
        case CellType.END: return base + "bg-cyan-900/50 animate-pulse ring-inset ring-2 ring-cyan-500";
        
        // Gate: Question mark or open
        case CellType.GATE: 
            return cell.isOpen 
                ? base + "bg-slate-900/50 border border-dashed border-green-500/30" 
                : base + "bg-slate-800 border border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.4)] z-10";
        
        // Path: Darker, recessed
        default: return base + "bg-slate-950 shadow-inner";
    }
  };

  if (showStartScreen) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
             <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
             <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>

        <div className="z-10 bg-slate-900/50 p-8 rounded-3xl border border-slate-700 shadow-2xl backdrop-blur-md max-w-lg w-full">
            <div className="mb-8">
                <Zap className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 font-mono leading-tight">
                    เกมเขาวงกตคณิตศาสตร์
                </h1>
                <h2 className="text-xl md:text-2xl text-cyan-400 font-semibold mb-6">
                    เรื่อง ตรรกศาสตร์
                </h2>
                <div className="h-px w-24 bg-slate-600 mx-auto my-6"></div>
                <p className="text-slate-400 font-light">
                    จัดทำโดย <span className="text-slate-200 font-medium">หม่องเอ</span>
                </p>
            </div>

            <button 
                onClick={handleStartGame}
                className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-cyan-600 font-lg rounded-full hover:bg-cyan-500 hover:scale-105 hover:shadow-[0_0_20px_rgba(6,182,212,0.6)] focus:outline-none ring-offset-2 focus:ring-2 ring-cyan-400"
            >
                <span className="mr-2">เริ่มเกม (Start Game)</span>
                <Play className="w-5 h-5 fill-current" />
            </button>
        </div>
        
        <div className="absolute bottom-4 text-slate-600 text-xs">
            Logic Labyrinth: The Truth Seeker
        </div>
      </div>
    );
  }

  if (!gameState.grid.length) return <div className="text-white flex h-screen items-center justify-center">Generating Maze...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
      
      {/* HUD */}
      <div className="w-full max-w-2xl flex justify-between items-center mb-6 bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md sticky top-4 z-40">
        <div className="flex flex-col">
            <h1 className="text-xl font-bold text-cyan-400 font-mono tracking-tighter flex items-center gap-2">
                <Zap className="w-5 h-5"/> LOGIC LABYRINTH
            </h1>
            <span className="text-xs text-slate-500">Level {gameState.level}</span>
        </div>
        
        <div className="flex gap-6">
            <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <span className="font-mono text-xl">{gameState.score}</span>
            </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="relative p-2 bg-slate-800 rounded-xl shadow-2xl border border-slate-700">
        
        {/* The Grid */}
        <div 
            ref={mazeRef}
            className="grid gap-0 relative bg-slate-900"
            style={{ 
                gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
                width: 'min(90vw, 90vh, 600px)',
                aspectRatio: '1/1'
            }}
        >
            {gameState.grid.map((row, y) => (
                row.map((cell, x) => (
                    <div key={`${x}-${y}`} className={getCellClass(cell)}>
                        {/* Player */}
                        {gameState.playerPosition.x === x && gameState.playerPosition.y === y && (
                             <div className="z-30 w-3/4 h-3/4 bg-yellow-400 rounded-full shadow-[0_0_15px_rgba(250,204,21,0.6)] relative animate-bounce-short">
                                <div className="absolute top-1/4 left-1/4 w-1/4 h-1/4 bg-white/80 rounded-full"></div>
                             </div>
                        )}

                        {/* Gate Icon */}
                        {cell.type === CellType.GATE && !cell.isOpen && (
                            <div className="w-3/4 h-3/4 bg-cyan-900/50 rounded flex items-center justify-center border border-cyan-500/50">
                                <span className="font-mono text-cyan-400 font-bold">?</span>
                            </div>
                        )}
                        
                        {/* End Icon */}
                        {cell.type === CellType.END && (
                             <div className="w-full h-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping"/>
                             </div>
                        )}
                    </div>
                ))
            ))}
        </div>

        {/* Victory Overlay */}
        {gameState.isWon && (
            <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-50 rounded-xl backdrop-blur-sm">
                <h2 className="text-4xl font-bold text-green-500 mb-4 font-mono">LEVEL COMPLETE</h2>
                <p className="text-slate-300 mb-6">Logic verified. Proceeding...</p>
                <button 
                    onClick={nextLevel}
                    className="flex items-center gap-2 bg-cyan-500 text-white px-8 py-3 rounded-full font-bold hover:bg-cyan-400 hover:scale-105 transition-all shadow-[0_0_20px_rgba(6,182,212,0.5)]"
                >
                    <Play className="w-5 h-5 fill-current"/> Next Level
                </button>
            </div>
        )}
      </div>

      {/* Controls */}
      <Controls onMove={movePlayer} />

      {/* Logic Modal */}
      {gameState.currentGate && gameState.currentGate.question && (
        <LogicModal 
            question={gameState.currentGate.question} 
            onSolve={handleGateResult} 
        />
      )}
      
      <div className="mt-8 text-slate-500 text-xs text-center max-w-md font-mono space-y-1">
        <p>Use Arrow Keys to move.</p>
        <p>Solve logic gates to clear the path.</p>
        <p className="text-orange-400">Warning: Wrong answers shift reality (Regenerate Maze)!</p>
      </div>
    </div>
  );
};

export default App;