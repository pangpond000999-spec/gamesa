import React from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

interface ControlsProps {
  onMove: (dx: number, dy: number) => void;
}

const Controls: React.FC<ControlsProps> = ({ onMove }) => {
  const btnClass = "w-16 h-16 bg-gray-800/80 active:bg-blue-600 rounded-lg flex items-center justify-center border-2 border-gray-600 text-white shadow-lg touch-manipulation backdrop-blur-sm";

  return (
    <div className="grid grid-cols-3 gap-2 mt-4 select-none">
      <div></div>
      <button 
        className={btnClass} 
        onPointerDown={(e) => { e.preventDefault(); onMove(0, -1); }}
      >
        <ArrowUp size={32} />
      </button>
      <div></div>
      
      <button 
        className={btnClass} 
        onPointerDown={(e) => { e.preventDefault(); onMove(-1, 0); }}
      >
        <ArrowLeft size={32} />
      </button>
      <button 
        className={btnClass} 
        onPointerDown={(e) => { e.preventDefault(); onMove(0, 1); }}
      >
        <ArrowDown size={32} />
      </button>
      <button 
        className={btnClass} 
        onPointerDown={(e) => { e.preventDefault(); onMove(1, 0); }}
      >
        <ArrowRight size={32} />
      </button>
    </div>
  );
};

export default Controls;
