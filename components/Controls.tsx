import React from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

interface ControlsProps {
  onMove: (dx: number, dy: number) => void;
}

export const Controls: React.FC<ControlsProps> = ({ onMove }) => {
  return (
    <div className="grid grid-cols-3 gap-2 w-48 mx-auto mt-6 md:hidden">
      <div />
      <button 
        onClick={() => onMove(0, -1)}
        className="bg-slate-800 p-4 rounded-xl shadow-lg active:bg-cyan-600 active:scale-95 transition-all border border-slate-600"
      >
        <ArrowUp className="text-cyan-400 w-6 h-6" />
      </button>
      <div />
      <button 
        onClick={() => onMove(-1, 0)}
        className="bg-slate-800 p-4 rounded-xl shadow-lg active:bg-cyan-600 active:scale-95 transition-all border border-slate-600"
      >
        <ArrowLeft className="text-cyan-400 w-6 h-6" />
      </button>
      <button 
        onClick={() => onMove(0, 1)}
        className="bg-slate-800 p-4 rounded-xl shadow-lg active:bg-cyan-600 active:scale-95 transition-all border border-slate-600"
      >
        <ArrowDown className="text-cyan-400 w-6 h-6" />
      </button>
      <button 
        onClick={() => onMove(1, 0)}
        className="bg-slate-800 p-4 rounded-xl shadow-lg active:bg-cyan-600 active:scale-95 transition-all border border-slate-600"
      >
        <ArrowRight className="text-cyan-400 w-6 h-6" />
      </button>
    </div>
  );
};
