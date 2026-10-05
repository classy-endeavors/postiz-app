import OpenAI from 'openai';

// Any OpenAI-compatible endpoint works, e.g. Gemini:
// OPENAI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
export const aiConfig = {
  apiKey: process.env.OPENAI_API_KEY || 'sk-proj-',
  baseURL: process.env.OPENAI_BASE_URL || undefined,
  textModel: process.env.AI_TEXT_MODEL || 'gpt-4.1',
  agentModel: process.env.AI_AGENT_MODEL || 'gpt-5.2',
  imageModel: process.env.AI_IMAGE_MODEL || 'chatgpt-image-latest',
};

export const isCustomAiEndpoint = !!aiConfig.baseURL;

// Gemini's OpenAI-compatible streaming omits tool call indexes and drops thought signatures,
// so the agent talks to Gemini through its native API instead
export const isGeminiEndpoint = !!aiConfig.baseURL?.includes(
  'generativelanguage.googleapis.com'
);

export const createOpenAIClient = () =>
  new OpenAI({ apiKey: aiConfig.apiKey, baseURL: aiConfig.baseURL });

export const chatOpenAIConfig = {
  apiKey: aiConfig.apiKey,
  model: aiConfig.textModel,
  configuration: { baseURL: aiConfig.baseURL },
};

export const dalleConfig = {
  apiKey: aiConfig.apiKey,
  model: aiConfig.imageModel,
  ...(aiConfig.baseURL ? { baseUrl: aiConfig.baseURL } : {}),
};
