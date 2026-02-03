import { GoogleGenAI } from "@google/genai";
import { LogicQuestion } from '../types';

let aiClient: GoogleGenAI | null = null;

if (process.env.API_KEY) {
  aiClient = new GoogleGenAI({ apiKey: process.env.API_KEY });
}

export const getAIExplanation = async (question: LogicQuestion): Promise<string> => {
  if (!aiClient) {
    return "API Key not configured. Unable to fetch AI explanation. (Tip: T -> F is False, everything else for implies is True!)";
  }

  try {
    const prompt = `
      Explain briefly in Thai why the following mathematical logic statement is ${question.answer ? 'True (จริง)' : 'False (เท็จ)'}.
      Variables: ${JSON.stringify(question.variableValues)}
      Expression: ${question.expressionDisplay}
      Keep it simple and educational for a student.
    `;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "No explanation available.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error connecting to AI Tutor. Please try again.";
  }
};
