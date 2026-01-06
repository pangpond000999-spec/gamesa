import { Question } from "../types";

// Helper types for Logic Generation
type VarName = 'p' | 'q' | 'r';
type Operator = '∧' | '∨' | '→' | '↔';

interface LogicVar {
  name: VarName;
  value: boolean;
}

const OPERATORS: Operator[] = ['∧', '∨', '→', '↔'];

// Helper: Random boolean
const randBool = () => Math.random() > 0.5;

// Helper: Random item from array
const randItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Helper: Format boolean to Thai
const boolToThai = (b: boolean) => (b ? "จริง (T)" : "เท็จ (F)");
const boolToChar = (b: boolean) => (b ? "T" : "F");

// Evaluate basic logic operations
const evaluate = (a: boolean, op: Operator, b: boolean): boolean => {
  switch (op) {
    case '∧': return a && b;
    case '∨': return a || b;
    case '→': return !a || b; // False only if T -> F
    case '↔': return a === b;
    default: return false;
  }
};

// Generate a random question
const generateSingleQuestion = (id: string): Question => {
  // 1. Setup Variables
  const p: LogicVar = { name: 'p', value: randBool() };
  const q: LogicVar = { name: 'q', value: randBool() };
  const r: LogicVar = { name: 'r', value: randBool() };
  
  // Decide difficulty / complexity (0: simple, 1: compound, 2: negation)
  const complexity = Math.floor(Math.random() * 3);
  
  let questionText = "";
  let isTrue = false;
  let explanation = "";

  if (complexity === 0) {
    // Type 1: Simple Operation (p op q)
    // "Given p is ..., q is ..., find p op q"
    const op = randItem(OPERATORS);
    isTrue = evaluate(p.value, op, q.value);
    
    questionText = `กำหนดให้ p เป็น${boolToThai(p.value)} และ q เป็น${boolToThai(q.value)}\nจงหาค่าความจริงของประพจน์ (${p.name} ${op} ${q.name})`;
    explanation = `แทนค่า: ${boolToChar(p.value)} ${op} ${boolToChar(q.value)} ได้ผลลัพธ์เป็น ${boolToChar(isTrue)}`;

  } else if (complexity === 1) {
    // Type 2: Negation or complex (p op ~q)
    const op = randItem(OPERATORS);
    const negateSecond = randBool(); // ~q
    
    const val1 = p.value;
    const val2Raw = q.value;
    const val2 = negateSecond ? !val2Raw : val2Raw;
    
    isTrue = evaluate(val1, op, val2);
    
    const expr = `(${p.name} ${op} ${negateSecond ? '~' : ''}${q.name})`;
    questionText = `กำหนดให้ p เป็น${boolToThai(p.value)} และ q เป็น${boolToThai(q.value)}\nจงหาค่าความจริงของ ${expr}`;
    
    let step2 = negateSecond ? `เนื่องจาก q=${boolToChar(val2Raw)} ดังนั้น ~q=${boolToChar(val2)}` : "";
    explanation = `${step2}\nจะได้ ${boolToChar(val1)} ${op} ${boolToChar(val2)} = ${boolToChar(isTrue)}`;

  } else {
    // Type 3: 3 Variables or Grouping ((p op q) op r)
    // To keep text short for mobile, we might use direct T/F values mixed with vars
    // e.g. (T -> p) v q
    
    const op1 = randItem(OPERATORS);
    const op2 = randItem(OPERATORS);
    
    // Calculate inner first: (p op1 q)
    const innerVal = evaluate(p.value, op1, q.value);
    // Calculate outer: inner op2 r
    isTrue = evaluate(innerVal, op2, r.value);
    
    questionText = `กำหนด p=${boolToChar(p.value)}, q=${boolToChar(q.value)}, r=${boolToChar(r.value)}\nหาค่าความจริงของ (${p.name} ${op1} ${q.name}) ${op2} ${r.name}`;
    
    explanation = `ทำในวงเล็บก่อน: ${boolToChar(p.value)} ${op1} ${boolToChar(q.value)} = ${boolToChar(innerVal)}\nจากนั้น: ${boolToChar(innerVal)} ${op2} ${boolToChar(r.value)} = ${boolToChar(isTrue)}`;
  }

  return {
    id,
    questionText,
    isTrue,
    explanation
  };
};

export const generateQuestions = async (): Promise<Question[]> => {
  // Simulate async to keep interface compatible
  return new Promise((resolve) => {
    const questions: Question[] = [];
    // Generate 50 unique questions locally
    for (let i = 0; i < 50; i++) {
      questions.push(generateSingleQuestion(i.toString()));
    }
    resolve(questions);
  });
};
