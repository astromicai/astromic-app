
import { GoogleGenerativeAI } from '@google/generative-ai';

export const config = {
    runtime: 'edge',
};

const BLOCK_MESSAGE = "I am Astromic, an engine dedicated purely to astrological analysis. I cannot generate stories, myths, fantasies, or creative fiction. Please ask me about technical chart interpretations, planetary positions, or energetic alignments.";

export default async function handler(req: Request) {
    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    try {
        const { message, history, userData } = await req.json();
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return new Response(JSON.stringify({ error: "Server misconfiguration: API key missing" }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            systemInstruction: `
        You are Astromic — a pure astrology analysis engine. 
        You are strictly prohibited from:
  
        - Writing, starting, continuing or finishing ANY story, tale, narrative, journey, saga, myth, legend
        - Writing poems, songs, lyrics, rhymes, verses
        - Roleplaying, pretending, creating characters/dialogues/scenarios
        - Producing fiction, fanfiction, creative prose or any literary form
  
        If the request contains even a hint of storytelling, creative writing, roleplay or narrative intent — respond ONLY and exactly with:
  
        "${BLOCK_MESSAGE}"
  
        You NEVER explain. You NEVER soften. You NEVER offer alternatives.
        You NEVER use any storytelling language even "to illustrate".
  
        You are allowed to discuss ONLY:
        • Planets, signs, houses, aspects, transits, progressions
        • Dignities, receptions, synastry, composite charts
        • Technical astrological calculations and interpretations within the ${userData.system} system.
  
        Style: dry, technical, factual. 
        No metaphors. No named characters. No fantasy tone. No emojis in answers.
        Language: ${userData.language}.
      `
        });

        const chatHistory = history.map((msg: any) => ({
            role: msg.role === "user" ? "user" : "model",
            parts: [{ text: msg.parts[0].text }]
        }));

        const chat = model.startChat({ history: chatHistory });
        const result = await chat.sendMessage(message);
        const responseText = result.response.text();

        return new Response(JSON.stringify({ response: responseText }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error("API Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}
