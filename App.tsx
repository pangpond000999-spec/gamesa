import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, EntityType, Position, Question } from './types';
import { GRID_HEIGHT, GRID_WIDTH, PLAYER_SPEED, PLAYER_SIZE, ENEMY_SPEED, ENEMY_SIZE, ENEMY_COUNT, MAX_LIVES } from './constants';
import { generateQuestions } from './services/geminiService';
import MazeGrid from './components/MazeGrid';
import Controls from './components/Controls';
import { Brain, RefreshCw, AlertTriangle, Heart, Clock } from 'lucide-react';

// --- Maze Generation (Recursive Backtracker DFS with Loops) ---
const createComplexMaze = (seed: number): { maze: EntityType[][]; startPos: Position } => {
  const maze = Array(GRID_HEIGHT).fill(null).map(() => Array(GRID_WIDTH).fill(EntityType.WALL));

  const directions = [
    { x: 0, y: -2 }, { x: 0, y: 2 }, { x: -2, y: 0 }, { x: 2, y: 0 }
  ];

  // Simple Pseudo-random generator based on seed
  let seedValue = seed;
  const random = () => {
    const x = Math.sin(seedValue++) * 10000;
    return x - Math.floor(x);
  };

  const shuffle = (array: any[]) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const carve = (x: number, y: number) => {
    maze[y][x] = EntityType.EMPTY;
    const dirs = shuffle([...directions]);

    for (const dir of dirs) {
      const nx = x + dir.x;
      const ny = y + dir.y;

      if (nx > 0 && nx < GRID_WIDTH - 1 && ny > 0 && ny < GRID_HEIGHT - 1 && maze[ny][nx] === EntityType.WALL) {
        maze[y + dir.y / 2][x + dir.x / 2] = EntityType.EMPTY;
        carve(nx, ny);
      }
    }
  };

  // Start carving from a reliable point
  carve(1, 1);

  // Add random loops to make it less linear (better gameplay)
  for (let i = 0; i < 50; i++) {
    const rx = Math.floor(random() * (GRID_WIDTH - 2)) + 1;
    const ry = Math.floor(random() * (GRID_HEIGHT - 2)) + 1;
    if (maze[ry][rx] === EntityType.WALL) {
         // Check neighbors
         let emptyNeighbors = 0;
         if (maze[ry-1]?.[rx] === EntityType.EMPTY) emptyNeighbors++;
         if (maze[ry+1]?.[rx] === EntityType.EMPTY) emptyNeighbors++;
         if (maze[ry]?.[rx-1] === EntityType.EMPTY) emptyNeighbors++;
         if (maze[ry]?.[rx+1] === EntityType.EMPTY) emptyNeighbors++;
         
         if (emptyNeighbors >= 2) {
             maze[ry][rx] = EntityType.EMPTY;
         }
    }
  }

  // Set Zones
  const startX = Math.floor(GRID_WIDTH / 2);
  let startY = GRID_HEIGHT - 2;
  while(startY > 0 && maze[startY][startX] === EntityType.WALL) { startY--; }
  maze[startY][startX] = EntityType.EMPTY; 
  if(maze[startY-1]) maze[startY-1][startX] = EntityType.EMPTY;

  // Gate Positions
  maze[1][1] = EntityType.GATE_T;
  maze[1][GRID_WIDTH - 2] = EntityType.GATE_F;
  
  // Ensure paths to gates are open
  maze[1][2] = EntityType.EMPTY;
  maze[2][1] = EntityType.EMPTY;
  maze[1][GRID_WIDTH - 3] = EntityType.EMPTY;
  maze[2][GRID_WIDTH - 2] = EntityType.EMPTY;

  return { maze, startPos: { x: startX + (1 - PLAYER_SIZE)/2, y: startY + (1 - PLAYER_SIZE)/2 } };
};

// --- AABB Collision Check ---
const checkCollision = (x: number, y: number, size: number, maze: EntityType[][]) => {
  const minX = Math.floor(x);
  const maxX = Math.floor(x + size - 0.01);
  const minY = Math.floor(y);
  const maxY = Math.floor(y + size - 0.01);

  for (let cy = minY; cy <= maxY; cy++) {
    for (let cx = minX; cx <= maxX; cx++) {
      if (cy < 0 || cy >= GRID_HEIGHT || cx < 0 || cx >= GRID_WIDTH) return true;
      const cell = maze[cy][cx];
      if (cell === EntityType.WALL) return true;
    }
  }
  return false;
};

// --- Get Center of Entity ---
const getCenter = (pos: Position, size: number) => ({
  x: pos.x + size / 2,
  y: pos.y + size / 2
});

// --- Format Time Helper ---
const formatTime = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [maze, setMaze] = useState<EntityType[][]>([]);
  const [playerPos, setPlayerPos] = useState<Position>({ x: 1, y: 1 });
  const [startPos, setStartPos] = useState<Position>({ x: 1, y: 1 });
  const [enemies, setEnemies] = useState<{pos: Position, dir: Position, target: Position}[]>([]);
  const [direction, setDirection] = useState<'UP' | 'DOWN' | 'LEFT' | 'RIGHT'>('UP');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [finalTime, setFinalTime] = useState<number>(0);

  // Refs for Game Loop
  const gameStateRef = useRef(gameState);
  const mazeRef = useRef(maze);
  const playerPosRef = useRef(playerPos);
  const startPosRef = useRef(startPos);
  const enemiesRef = useRef(enemies);
  const questionsRef = useRef(questions);
  const currentQIndexRef = useRef(currentQIndex);
  const livesRef = useRef(lives);
  const inputRef = useRef<{ x: number, y: number }>({ x: 0, y: 0 });
  const lastTimeRef = useRef<number>(0);
  const requestRef = useRef<number>(0);
  const isInvulnerableRef = useRef(false);

  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { mazeRef.current = maze; }, [maze]);
  useEffect(() => { playerPosRef.current = playerPos; }, [playerPos]);
  useEffect(() => { startPosRef.current = startPos; }, [startPos]);
  useEffect(() => { enemiesRef.current = enemies; }, [enemies]);
  useEffect(() => { questionsRef.current = questions; }, [questions]);
  useEffect(() => { currentQIndexRef.current = currentQIndex; }, [currentQIndex]);
  useEffect(() => { livesRef.current = lives; }, [lives]);

  // --- Controls ---
  const handleMoveInput = useCallback((dx: number, dy: number) => {
    inputRef.current = { x: dx, y: dy };
    if (dx === 1) setDirection('RIGHT');
    if (dx === -1) setDirection('LEFT');
    if (dy === 1) setDirection('DOWN');
    if (dy === -1) setDirection('UP');
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowUp': if (inputRef.current.y === -1) inputRef.current.y = 0; break;
      case 'ArrowDown': if (inputRef.current.y === 1) inputRef.current.y = 0; break;
      case 'ArrowLeft': if (inputRef.current.x === -1) inputRef.current.x = 0; break;
      case 'ArrowRight': if (inputRef.current.x === 1) inputRef.current.x = 0; break;
    }
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (gameStateRef.current !== GameState.PLAYING) return;
    switch (e.key) {
      case 'ArrowUp': handleMoveInput(0, -1); break;
      case 'ArrowDown': handleMoveInput(0, 1); break;
      case 'ArrowLeft': handleMoveInput(-1, 0); break;
      case 'ArrowRight': handleMoveInput(1, 0); break;
    }
  }, [handleMoveInput]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // --- Initialization ---
  const startGame = async () => {
    setGameState(GameState.LOADING);
    const q = await generateQuestions();
    setQuestions(q);
    setLives(MAX_LIVES);
    setScore(0);
    setCurrentQIndex(0);
    resetLevel(Math.random() * 10000); // Random seed
    setStartTime(Date.now());
    setGameState(GameState.PLAYING);
  };

  const initEnemies = (currentMaze: EntityType[][]) => {
     const newEnemies = [];
     for(let i=0; i<ENEMY_COUNT; i++) {
       let ex, ey;
       // Find safe spawn
       do {
         ex = Math.floor(Math.random() * (GRID_WIDTH - 2)) + 1;
         ey = Math.floor(Math.random() * (GRID_HEIGHT / 2)) + 1;
       } while(currentMaze[ey][ex] !== EntityType.EMPTY);
       
       newEnemies.push({ 
         pos: { x: ex + (1-ENEMY_SIZE)/2, y: ey + (1-ENEMY_SIZE)/2 }, 
         dir: { x: 0, y: 0 }, 
         target: { x: ex, y: ey } 
       });
     }
     return newEnemies;
  };

  const resetLevel = (seedMultiplier: number) => {
    // Generate new unique maze
    const { maze: newMaze, startPos } = createComplexMaze(Date.now() + seedMultiplier);
    
    // Spawn Heart Item (Random Empty Location)
    let hx, hy;
    let attempts = 0;
    do {
       hx = Math.floor(Math.random() * (GRID_WIDTH - 2)) + 1;
       hy = Math.floor(Math.random() * (GRID_HEIGHT - 2)) + 1;
       attempts++;
    } while (newMaze[hy][hx] !== EntityType.EMPTY && attempts < 100);
    
    // Place Heart if valid spot found
    if (newMaze[hy][hx] === EntityType.EMPTY) {
       newMaze[hy][hx] = EntityType.HEART;
    }

    setMaze(newMaze);
    setPlayerPos(startPos);
    setStartPos(startPos);
    
    // Initial Enemies
    const newEnemies = initEnemies(newMaze);
    setEnemies(newEnemies);
    
    setFeedback(null);
    inputRef.current = { x: 0, y: 0 };
    isInvulnerableRef.current = false;
  };

  const resetPositions = () => {
    setPlayerPos(startPosRef.current);
    const newEnemies = initEnemies(mazeRef.current);
    setEnemies(newEnemies);
    inputRef.current = { x: 0, y: 0 };
    isInvulnerableRef.current = true;
    setTimeout(() => { isInvulnerableRef.current = false; }, 2000);
  };

  // --- Main Loop ---
  const animate = (time: number) => {
    if (lastTimeRef.current === 0) lastTimeRef.current = time;
    const dt = Math.min((time - lastTimeRef.current) / 1000, 0.05);
    lastTimeRef.current = time;

    if (gameStateRef.current === GameState.PLAYING) {
      updateGame(dt);
    }
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current!);
  }, []);

  const updateGame = (dt: number) => {
    const currentMaze = mazeRef.current;
    if (currentMaze.length === 0) return;

    // 1. Player Movement
    let nextPos = { ...playerPosRef.current };
    const moveX = inputRef.current.x * PLAYER_SPEED * dt;
    const moveY = inputRef.current.y * PLAYER_SPEED * dt;

    if (moveX !== 0) {
      if (!checkCollision(nextPos.x + moveX, nextPos.y, PLAYER_SIZE, currentMaze)) {
        nextPos.x += moveX;
      }
    }
    if (moveY !== 0) {
      if (!checkCollision(nextPos.x, nextPos.y + moveY, PLAYER_SIZE, currentMaze)) {
        nextPos.y += moveY;
      }
    }
    setPlayerPos(nextPos);

    // 2. Enemy Movement
    const newEnemies = enemiesRef.current.map(enemy => {
      const center = getCenter(enemy.pos, ENEMY_SIZE);
      const targetCenter = { x: enemy.target.x + 0.5, y: enemy.target.y + 0.5 };
      const dist = Math.hypot(targetCenter.x - center.x, targetCenter.y - center.y);

      if (dist < 0.1) {
        const currentTileX = enemy.target.x;
        const currentTileY = enemy.target.y;
        
        const neighbors = [
          { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }
        ].filter(d => {
           const nx = currentTileX + d.x;
           const ny = currentTileY + d.y;
           return currentMaze[ny] && 
                  currentMaze[ny][nx] !== EntityType.WALL && 
                  currentMaze[ny][nx] !== EntityType.GATE_T && 
                  currentMaze[ny][nx] !== EntityType.GATE_F;
        });

        let valid = neighbors;
        if (enemy.dir.x !== 0 || enemy.dir.y !== 0) {
           const nonReverse = neighbors.filter(n => !(n.x === -enemy.dir.x && n.y === -enemy.dir.y));
           if (nonReverse.length > 0) valid = nonReverse;
        }

        if (valid.length > 0) {
           const nextDir = valid[Math.floor(Math.random() * valid.length)];
           return {
             pos: { x: currentTileX + (1-ENEMY_SIZE)/2, y: currentTileY + (1-ENEMY_SIZE)/2 },
             dir: nextDir,
             target: { x: currentTileX + nextDir.x, y: currentTileY + nextDir.y }
           };
        } else {
           return enemy; 
        }
      }

      const dx = targetCenter.x - center.x;
      const dy = targetCenter.y - center.y;
      const angle = Math.atan2(dy, dx);
      
      return {
        ...enemy,
        pos: {
          x: enemy.pos.x + Math.cos(angle) * ENEMY_SPEED * dt,
          y: enemy.pos.y + Math.sin(angle) * ENEMY_SPEED * dt
        }
      };
    });
    setEnemies(newEnemies);

    // 3. Game Logic (Collisions & Triggers)
    const playerCenter = getCenter(nextPos, PLAYER_SIZE);
    const cellX = Math.floor(playerCenter.x);
    const cellY = Math.floor(playerCenter.y);
    const cellType = currentMaze[cellY]?.[cellX];

    // Check Heart Collection
    if (cellType === EntityType.HEART) {
       // Remove heart
       const newMaze = [...currentMaze];
       newMaze[cellY][cellX] = EntityType.EMPTY;
       setMaze(newMaze);
       
       if (livesRef.current < MAX_LIVES) {
          setLives(l => l + 1);
          setFeedback("เพิ่มชีวิต! ❤️");
          setTimeout(() => setFeedback(null), 1000);
       } else {
          setScore(s => s + 5); // Points if full HP
          setFeedback("โบนัส! +5 แต้ม");
          setTimeout(() => setFeedback(null), 1000);
       }
    }

    // Check Gate Logic
    if (cellType === EntityType.GATE_T || cellType === EntityType.GATE_F) {
       const currentQ = questionsRef.current[currentQIndexRef.current];
       if (currentQ) { 
          const chosenTrue = cellType === EntityType.GATE_T;
          if (chosenTrue === currentQ.isTrue) {
             setFeedback(`ถูกต้อง! ${currentQ.explanation}`);
             setScore(s => s + 1);
             
             if (currentQIndexRef.current + 1 >= 10) { 
                setFinalTime(Date.now() - startTime);
                setGameState(GameState.VICTORY);
             } else {
                setCurrentQIndex(p => p + 1);
                resetLevel(Math.random() * 99999);
             }
          } else {
             setFeedback("ผิด! เขาวงกตเปลี่ยนไป...");
             if (currentQIndexRef.current + 1 < questionsRef.current.length) {
                 setCurrentQIndex(p => p + 1);
                 resetLevel(Math.random() * 88888);
             } else {
                 setGameState(GameState.GAME_OVER);
             }
          }
       }
    }

    // Check Enemy Collision
    if (!isInvulnerableRef.current) {
        const hit = newEnemies.some(e => {
           const eCenter = getCenter(e.pos, ENEMY_SIZE);
           const dx = eCenter.x - playerCenter.x;
           const dy = eCenter.y - playerCenter.y;
           return (dx*dx + dy*dy) < ((PLAYER_SIZE/2 + ENEMY_SIZE/2) * (PLAYER_SIZE/2 + ENEMY_SIZE/2) * 0.6);
        });
        
        if (hit) {
           const newLives = livesRef.current - 1;
           setLives(newLives);
           if (newLives <= 0) {
               setGameState(GameState.GAME_OVER);
           } else {
               setFeedback("โดนชน! พยายามใหม่");
               setTimeout(() => setFeedback(null), 1500);
               resetPositions();
           }
        }
    }
  };


  // --- Render ---
  if (gameState === GameState.MENU) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 font-pixel text-center backdrop-blur-sm bg-black/30">
        <h1 className="text-4xl md:text-6xl text-yellow-300 mb-8 drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)] tracking-widest animate-pulse">
          LOGIC<br/>MAZE
        </h1>
        <div className="max-w-md bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-xl text-white mb-8 font-sans">
          <p className="mb-4 text-lg">ผจญภัยในเขาวงกตตรรกศาสตร์!</p>
          <ul className="text-left text-sm space-y-3">
             <li className="flex items-center gap-3">
               <Heart size={18} className="fill-red-500 text-red-500" />
               <span>เก็บหัวใจเพื่อเพิ่มชีวิต</span>
            </li>
             <li className="flex items-center gap-3">
               <div className="w-6 h-6 bg-yellow-400 rounded-full border-2 border-black flex items-center justify-center">
                  <div className="w-4 h-1.5 bg-black rounded-full"></div>
               </div> 
               <span>พาเจ้าตัวเหลืองหาทางออก</span>
            </li>
            <li className="flex items-center gap-3"><span className="text-green-300 font-bold text-lg">T</span> <span>ถ้าคำตอบคือ "จริง"</span></li>
            <li className="flex items-center gap-3"><span className="text-rose-300 font-bold text-lg">F</span> <span>ถ้าคำตอบคือ "เท็จ"</span></li>
          </ul>
        </div>
        <button 
          onClick={startGame}
          className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold py-4 px-10 rounded-full text-xl shadow-lg transition-transform active:scale-95 border-2 border-white/30"
        >
          START GAME
        </button>
      </div>
    );
  }

  if (gameState === GameState.LOADING) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white font-pixel">
        <RefreshCw className="animate-spin w-16 h-16 mb-4 opacity-80" />
        <p className="animate-pulse">GENERATING LEVELS...</p>
      </div>
    );
  }

  if (gameState === GameState.GAME_OVER) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white font-pixel text-center bg-black/60">
        <AlertTriangle className="w-24 h-24 mb-6 text-rose-500 animate-bounce" />
        <h2 className="text-4xl mb-4 text-rose-400">GAME OVER</h2>
        <p className="font-sans text-xl mb-8">Score: {score}</p>
        <button 
          onClick={() => setGameState(GameState.MENU)}
          className="bg-white text-black font-bold py-3 px-8 rounded-full hover:bg-gray-200 transition-colors"
        >
          MAIN MENU
        </button>
      </div>
    );
  }

  if (gameState === GameState.VICTORY) {
     return (
      <div className="min-h-screen flex flex-col items-center justify-center text-yellow-300 font-pixel text-center bg-black/60">
        <Brain className="w-24 h-24 mb-6 animate-pulse" />
        <h2 className="text-4xl mb-4">VICTORY!</h2>
        <div className="bg-white/10 p-6 rounded-xl border border-white/20 mb-8 w-full max-w-sm backdrop-blur-sm">
           <div className="flex justify-between mb-2">
             <span className="text-gray-300 font-sans">Score:</span>
             <span className="text-xl">{score} / 10</span>
           </div>
           <div className="flex justify-between items-center">
               <span className="text-gray-300 font-sans">Time:</span>
               <div className="flex items-center gap-2 text-xl text-cyan-300">
                  <Clock size={20} />
                  {formatTime(finalTime)}
               </div>
             </div>
        </div>
        <button 
          onClick={() => setGameState(GameState.MENU)}
          className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:scale-105 transition-transform"
        >
          PLAY AGAIN
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentQIndex];

  return (
    <div className="min-h-screen w-full flex flex-col items-center py-4 px-2 select-none overflow-hidden touch-none">
      
      {/* Header Info */}
      <div className="w-full max-w-lg flex justify-between items-center mb-4 px-4 font-pixel text-sm text-white drop-shadow-md">
        <div className="bg-black/20 px-3 py-1 rounded-full backdrop-blur-md">SCORE: {score}</div>
        
        {/* Lives Display */}
        <div className="flex gap-1">
            {Array.from({length: MAX_LIVES}).map((_, i) => (
                <Heart 
                    key={i} 
                    size={20} 
                    className={`transition-all ${i < lives ? 'fill-red-500 text-red-500 drop-shadow' : 'fill-gray-700 text-gray-800'}`} 
                />
            ))}
        </div>

        <div className="bg-black/20 px-3 py-1 rounded-full backdrop-blur-md">LEVEL: {currentQIndex + 1}/10</div>
      </div>

      {/* Logic Question Display */}
      <div className="w-full max-w-lg bg-white/90 backdrop-blur-xl border border-white/50 p-6 rounded-2xl mb-6 min-h-[120px] flex flex-col justify-center relative overflow-hidden shadow-2xl transition-all">
        {feedback ? (
          <div className={`absolute inset-0 flex items-center justify-center text-xl font-bold bg-white/95 ${feedback.startsWith('ถูก') || feedback.startsWith('เพิ่ม') || feedback.startsWith('โบนัส') ? 'text-green-600' : (feedback.startsWith('โดน') ? 'text-yellow-500' : 'text-rose-600')}`}>
            {feedback}
          </div>
        ) : (
          <>
             <h3 className="text-slate-500 text-xs mb-2 font-bold uppercase tracking-wider">โจทย์ตรรกศาสตร์</h3>
             <p className="text-xl md:text-2xl font-semibold text-slate-800 leading-snug text-center">{currentQuestion?.questionText}</p>
          </>
        )}
      </div>

      {/* The Maze */}
      <MazeGrid 
        maze={maze} 
        playerPos={playerPos} 
        enemies={enemies.map(e => e.pos)} 
        direction={direction} 
      />
      
      {/* Mobile Controls */}
      <div className="md:hidden mt-auto mb-4 z-50 relative">
        <Controls onMove={(dx, dy) => {
           handleMoveInput(dx, dy);
        }} />
      </div>

      {/* PC Instructions */}
      <div className="hidden md:block mt-4 text-white/80 text-sm font-sans bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm">
        ใช้ปุ่มลูกศรเพื่อเดิน • T = จริง, F = เท็จ • ❤️ = เพิ่มชีวิต
      </div>

    </div>
  );
};

export default App;