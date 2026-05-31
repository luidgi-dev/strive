import { google } from "@ai-sdk/google";

/**
 * Shared, typed Gemini model instance reused across the app.
 *
 * Reads the API key from the `GOOGLE_GENERATIVE_AI_API_KEY` environment
 * variable (loaded automatically by Next.js from `.env.local`).
 */
export const striveAIModel = google("gemini-2.5-flash");
