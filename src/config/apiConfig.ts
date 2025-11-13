import Constants from "expo-constants";

/**
 * API Configuration
 * 
 * Uses OpenAI Whisper API for transcription.
 * Set OPENAI_API_KEY in .env.local file.
 */
export const API_CONFIG = {
  OPENAI_API_KEY: Constants.expoConfig?.extra?.openaiApiKey as string | undefined,
  OPENAI_API_URL: "https://api.openai.com/v1/audio/transcriptions",
  WHISPER_MODEL: "whisper-1", // OpenAI Whisper model
};

