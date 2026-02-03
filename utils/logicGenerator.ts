import { LogicQuestion, LogicOperator } from '../types';
import { OPERATOR_SYMBOLS, OPERATOR_NAMES_TH } from '../constants';

const getRandomBool = () => Math.random() < 0.5;

const evaluate = (op: LogicOperator, a: boolean, b?: boolean): boolean => {
  switch (op) {
    case 'AND': return a && (b ?? false);
    case 'OR': return a || (b ?? false);
    case 'IMPLIES': return !a || (b ?? false); // T->F is False, others True
    case 'IFF': return a === (b ?? false);
    case 'NOT': return !a;
    default: return false;
  }
};

const getExplanation = (op: LogicOperator, a: boolean, b: boolean, result: boolean): string => {
    const t = 'จริง (True)';
    const f = 'เท็จ (False)';
    const va = a ? t : f;
    const vb = b ? t : f;
    const res = result ? t : f;

    switch (op) {
        case 'AND':
            return `เพราะ ${OPERATOR_NAMES_TH['AND']} (AND) จะเป็นจริงเมื่อทั้งสองข้างเป็นจริงเท่านั้น\nในที่นี้ ${va} AND ${vb} จึงได้ ${res}`;
        case 'OR':
            return `เพราะ ${OPERATOR_NAMES_TH['OR']} (OR) จะเป็นเท็จเมื่อทั้งสองข้างเป็นเท็จเท่านั้น\nในที่นี้ ${va} OR ${vb} จึงได้ ${res}`;
        case 'IMPLIES':
            return `เพราะ ${OPERATOR_NAMES_TH['IMPLIES']} (IMPLIES) จะเป็นเท็จกรณีเดียวคือ หน้าจริง->หลังเท็จ\nในที่นี้ ${va} -> ${vb} จึงได้ ${res}`;
        case 'IFF':
            return `เพราะ ${OPERATOR_NAMES_TH['IFF']} (IFF) จะเป็นจริงเมื่อค่าความจริงเหมือนกัน\nในที่นี้ ${va} <-> ${vb} จึงได้ ${res}`;
        case 'NOT':
            return `เพราะ ${OPERATOR_NAMES_TH['NOT']} (NOT) จะกลับค่าความจริง\nจาก ${va} จึงกลายเป็น ${res}`;
        default:
            return '';
    }
};

export const generateLogicQuestion = (difficulty: number): LogicQuestion => {
  const vars = ['p', 'q', 'r'];
  const ops: LogicOperator[] = ['AND', 'OR', 'IMPLIES', 'IFF'];
  
  // Assign random truth values
  const varValues: { [key: string]: boolean } = {
    p: getRandomBool(),
    q: getRandomBool(),
    r: getRandomBool(),
  };

  let expressionDisplay = '';
  let answer = false;
  let questionText = '';
  let explanation = '';

  // Difficulty 1: Simple P op Q
  if (difficulty === 1) {
    const op = ops[Math.floor(Math.random() * 2)]; // AND, OR
    const v1 = 'p';
    const v2 = 'q';
    expressionDisplay = `${v1} ${OPERATOR_SYMBOLS[op]} ${v2}`;
    answer = evaluate(op, varValues[v1], varValues[v2]);
    questionText = `กำหนดให้ p เป็น${varValues.p ? 'จริง' : 'เท็จ'} และ q เป็น${varValues.q ? 'จริง' : 'เท็จ'}`;
    explanation = getExplanation(op, varValues.p, varValues.q, answer);
  } 
  // Difficulty 2: Includes Implies/Iff or Negation
  else if (difficulty === 2) {
    const useNot = Math.random() < 0.4;
    const op = ops[Math.floor(Math.random() * ops.length)];
    const v1 = 'p';
    const v2 = 'q';
    
    let val1 = varValues[v1];
    let val2 = varValues[v2];
    let disp1 = v1;
    let disp2 = v2;

    if (useNot) {
        // Negate the first variable visually and logically
        val1 = !val1;
        disp1 = `~${v1}`;
    }

    expressionDisplay = `${disp1} ${OPERATOR_SYMBOLS[op]} ${disp2}`;
    answer = evaluate(op, val1, val2);
    questionText = `กำหนดให้ p เป็น${varValues.p ? 'จริง' : 'เท็จ'}, q เป็น${varValues.q ? 'จริง' : 'เท็จ'}`;
    
    const baseExpl = getExplanation(op, val1, val2, answer);
    explanation = useNot ? `~${v1} มีค่าเป็น ${val1 ? 'จริง' : 'เท็จ'}\n${baseExpl}` : baseExpl;
  }
  // Difficulty 3+: Compound (p op q) op r
  else {
     const op1 = ops[Math.floor(Math.random() * ops.length)];
     const op2 = ops[Math.floor(Math.random() * ops.length)];
     
     // (p op1 q) op2 r
     const innerRes = evaluate(op1, varValues.p, varValues.q);
     const finalRes = evaluate(op2, innerRes, varValues.r);
     
     expressionDisplay = `(${vars[0]} ${OPERATOR_SYMBOLS[op1]} ${vars[1]}) ${OPERATOR_SYMBOLS[op2]} ${vars[2]}`;
     answer = finalRes;
     questionText = `p=${varValues.p?'T':'F'}, q=${varValues.q?'T':'F'}, r=${varValues.r?'T':'F'}`;
     
     const expl1 = getExplanation(op1, varValues.p, varValues.q, innerRes);
     explanation = `ขั้นที่ 1: (${vars[0]} ${OPERATOR_SYMBOLS[op1]} ${vars[1]}) ได้ค่า ${innerRes ? 'จริง' : 'เท็จ'}\n(${expl1})\n\nขั้นที่ 2: นำผลลัพธ์มาเชื่อมกับ ${vars[2]}\n${getExplanation(op2, innerRes, varValues.r, answer)}`;
  }

  return {
    id: Math.random().toString(36).substr(2, 9),
    question: questionText,
    variableValues: varValues,
    expressionDisplay,
    answer,
    explanation
  };
};