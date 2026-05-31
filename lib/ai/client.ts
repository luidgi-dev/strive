import { google } from "@ai-sdk/google";

/**
 * Shared, typed Gemini model instance reused across the app.
 *
 * Reads the API key from the `GOOGLE_GENERATIVE_AI_API_KEY` environment
 * variable (loaded automatically by Next.js from `.env.local`).
 */
// Overridable via env (e.g. a cheaper model in dev); falls back to the default.
const STRIVE_AI_MODEL_ID = process.env.STRIVE_AI_MODEL ?? "gemini-2.5-flash";

export const striveAIModel = google(STRIVE_AI_MODEL_ID);
