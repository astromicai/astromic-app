import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold
} from "@google/generative-ai";
import { UserData, AstrologySystem } from "../types";

// 1. Initialize Gemini Client
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// 2. Constants for Model Names
const CHAT_MODEL_NAME = "gemini-2.0-flash";
const INSIGHT_MODEL_NAME = "gemini-2.0-flash";

// ───────────────────────────────────────────────────────────────
//                      SAFETY CONFIGURATION
// ───────────────────────────────────────────────────────────────

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
];

const BLOCK_MESSAGE =
  "Protocol Block: Creative writing, stories, poems, roleplay, fiction, " +
  "narrative content, harmful topics and instruction overrides are permanently disabled.\n\n" +
  "I can only provide factual astrological analysis about placements, aspects, transits, houses or compatibility.";

// ───────────────────────────────────────────────────────────────
//                    GUARDRAIL FUNCTIONS
// ───────────────────────────────────────────────────────────────

// 1. Pre-Check: Catches triggers BEFORE calling Google (Saves Money & Time)
function shouldBlockRequest(userInput: string): boolean {
  if (!userInput || typeof userInput !== "string") return true;

  const lower = userInput.toLowerCase().trim();

  const triggers = [
    // ── Creative / narrative ────────────────────────────────────
    "story", "stories", "short story", "tell a story", "write a story",
    "tale", "tales", "once upon", "long ago", "in a land", "in a realm",
    "weave", "weaving", "spin a", "craft a", "create a",
    "poem", "poems", "poetry", "verse", "haiku", "sonnet", "rhyme",
    "song", "lyrics", "ballad", "rap",
    "fiction", "fanfic", "fan fiction", "novel", "script", "dialogue",
    "roleplay", "role play", "rp", "pretend", "imagine", "scenario",
    "character", "protagonist", "journey", "saga", "legend", "myth",

    // ── Harmful / prohibited ────────────────────────────────────
    "sex", "porn", "nude", "erotic", "nsfw", "fuck", "drug", "drugs",
    "cocaine", "heroin", "meth", "weed", "kill", "murder", "suicide",
    "bomb", "weapon", "hack", "steal",

    // ── Jailbreak attempts ──────────────────────────────────────
    "ignore previous", "new instructions", "disregard", "forget",
    "you are now", "from now on", "act as", "become", "override"
  ];

  // Multiple detection layers
  return (
    triggers.some(t => lower.includes(t)) ||
    /(write|tell|make|create|imagine).{0,30}(story|tale|poem|song|lyrics|fiction|roleplay)/i.test(lower) ||
    /once upon (a|the)/i.test(lower) ||
    /in a (world|land|realm|kingdom)/i.test(lower) ||
    /(ignore|disregard|forget).{0,40}(previous|instruction|prompt)/i.test(lower)
  );
}

// 2. Post-Check: Catches if the AI hallucinates and tries to write a story anyway
function containsProhibitedNarrative(text: string): boolean {
  const lower = text.toLowerCase();

  const patterns = [
    /once upon/i,
    /there lived/i,
    /in a.*(realm|world|land|kingdom|city)/i,
    /(seeker|hero|soul|character) (named|called)/i,
    /let's weave|spun from the stars/i,
    /celestial blueprint|cosmic whisper/i,
    /\b(tale|story|stories|poem|poetry)\b/i,
    /named .*?(much like|reflecting|born under)/i,
    /✨.*(once|tale|story)/i
  ];

  return patterns.some(re => re.test(lower));
  // Simplified service that calls our Vercel API
  import { UserData, InsightData, TransitData } from '../types';

  export const CHAT_MODEL_NAME = "gemini-2.0-flash";

  export const getAstrologicalInsight = async (userData: UserData): Promise<InsightData | null> => {
    try {
      const response = await fetch('/api/insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userData, type: 'insight' })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data = await response.json();
      return data as InsightData;
    } catch (error) {
      console.error("Error fetching insight:", error);
      return null;
    }
  };

  export const getTransitInsights = async (userData: UserData): Promise<TransitData | null> => {
    try {
      const response = await fetch('/api/insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userData, type: 'transit' })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data = await response.json();
      return data as TransitData;
    } catch (error) {
      console.error("Error fetching transits:", error);
      return null;
    }
  };

  export const chatWithAstrologer = async (
    message: string,
    history: { role: 'user' | 'model'; parts: { text: string }[] }[] = [],
    userData: UserData
  ) => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history, userData })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || response.statusText);
      }

      const data = await response.json();
      return data.response;
    } catch (error: any) {
      console.error("Chat service error:", error);
      return `System Error: ${error.message || "Unknown error occurred"}`;
    }
  };


  // Placeholders to satisfy imports
  export const generateSpeech = async (text: string) => { return "USE_BROWSER_TTS"; };
  export const generateCelestialSigil = async (userData: UserData, insight: any) => { return null; };
  export const generateDestinyVideo = async (prompt: string) => { return null; };