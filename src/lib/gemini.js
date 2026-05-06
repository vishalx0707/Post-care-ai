import { GoogleGenerativeAI } from '@google/generative-ai';

const DEFAULT_MODEL = 'gemini-2.5-flash';

export function getGeminiModel(systemInstruction) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  return genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || DEFAULT_MODEL,
    systemInstruction,
  });
}

export function toGeminiRole(role) {
  return role === 'assistant' ? 'model' : 'user';
}

