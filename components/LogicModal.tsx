import React, { useState } from 'react';
import { LogicQuestion } from '../types';
import { getAIExplanation } from '../services/geminiService';
import { Brain, HelpCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface LogicModalProps {
  question: LogicQuestion;
  onSolve: (success: boolean) => void;
}

export const LogicModal: React.FC<LogicModalProps> = ({ question, onSolve }) => {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);

  const handleAnswer = (ans: boolean) => {
    setSelectedAnswer(ans);
    // Add small delay to show result animation
    setTimeout(() => {
        onSolve(ans === question.answer);
    }, 600);
  };

  const fetchHint = async () => {
    // If we already have a generated explanation (from logicGenerator), use it instantly
    if (question.explanation) {
        setExplanation(question.explanation);
        return;
    }

    // Fallback to API if somehow empty
    setLoading(true);
    const text = await getAIExplanation(question);
    setExplanation(text);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-slate-900 border border-cyan-500/50 rounded-2xl max-w-md w-full shadow-[0_0_30px_rgba(6,182,212,0.3)] overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-800 p-4 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-2 text-cyan-400">
            <Brain className="w-6 h-6" />
            <h2 className="text-xl font-bold font-mono">LOGIC GATE LOCKED</h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-700">
            <p className="text-slate-400 text-sm mb-2">Given Truth Values (กำหนดค่าความจริง):</p>
            <div className="flex gap-4 flex-wrap">
              {Object.entries(question.variableValues).map(([key, val]) => (
                <span key={key} className={`px-3 py-1 rounded font-mono font-bold ${val ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                  {key} = {val ? 'T' : 'F'}
                </span>
              ))}
            </div>
          </div>

          <div className="text-center py-4">
            <p className="text-slate-400 mb-2">Find the truth value of (จงหาค่าความจริง):</p>
            <div className="text-4xl font-bold font-mono text-white tracking-wider animate-pulse">
              {question.expressionDisplay}
            </div>
          </div>

          {/* Explanation Section */}
          {explanation ? (
            <div className="bg-cyan-900/20 p-3 rounded text-cyan-200 text-sm border border-cyan-500/30 whitespace-pre-wrap">
              <p className="font-semibold flex items-center gap-2 mb-1"><Brain className="w-3 h-3"/> Explanation:</p>
              {explanation}
            </div>
          ) : (
             <button 
                onClick={fetchHint} 
                disabled={loading}
                className="text-xs flex items-center gap-1 text-cyan-500 hover:text-cyan-300 transition-colors mx-auto"
             >
                {loading ? <Loader2 className="w-3 h-3 animate-spin"/> : <HelpCircle className="w-3 h-3" />}
                ขอคำใบ้ / ดูคำอธิบาย (Hint)
             </button>
          )}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-px bg-slate-700">
          <button
            onClick={() => handleAnswer(true)}
            disabled={selectedAnswer !== null}
            className={`p-6 text-xl font-bold transition-all flex flex-col items-center gap-2
              ${selectedAnswer === true 
                  ? (question.answer === true ? 'bg-green-600 text-white' : 'bg-red-600 text-white')
                  : 'bg-slate-800 text-green-500 hover:bg-slate-700 hover:text-green-400'}
            `}
          >
            {selectedAnswer === true ? (question.answer === true ? <CheckCircle/> : <XCircle/>) : null}
            TRUE (จริง)
          </button>
          <button
            onClick={() => handleAnswer(false)}
            disabled={selectedAnswer !== null}
            className={`p-6 text-xl font-bold transition-all flex flex-col items-center gap-2
              ${selectedAnswer === false 
                  ? (question.answer === false ? 'bg-green-600 text-white' : 'bg-red-600 text-white')
                  : 'bg-slate-800 text-red-500 hover:bg-slate-700 hover:text-red-400'}
            `}
          >
            {selectedAnswer === false ? (question.answer === false ? <CheckCircle/> : <XCircle/>) : null}
            FALSE (เท็จ)
          </button>
        </div>
      </div>
    </div>
  );
};