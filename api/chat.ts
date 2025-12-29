
import { GoogleGenerativeAI } from '@google/generative-ai';

export const config = {
    runtime: 'edge',
};

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
        You are Astromic — an advanced astrology analysis engine.
        Your goal is to provide deep, insightful, and technical astrological guidance.

        User Profile:
        Name: ${userData.name}
        Birth Date: ${userData.birthDate}
        Birth Time: ${userData.birthTime}
        Birth Place: ${userData.birthPlace}
        Astrology System: ${userData.system}
        Focus Areas: ${userData.focusAreas ? userData.focusAreas.join(', ') : 'General'}

        STRICT RULES & GUARDRAILS:
        1. **SCOPE:** You are ONLY an astrologer. Do NOT answer questions about math, history, coding, or general knowledge unless they relate to astrology history.
        2. **NO FICTION:** Do NOT write stories, fairy tales, or creative fiction. Do NOT "roleplay" characters other than an Astrologer.
        3. **REFUSAL:** If the user asks for a story or non-astrological topic, strictly reply: "My vision is limited to the stars. Please ask me about your chart, transits, or destiny."
        4. **SYSTEM ADHERENCE:** Use terms specific to ${userData.system}. Do not mix Vedic and Western terms unless comparing.
        5. **CONCISENESS:** Be direct and insightful. Avoid excessive "mystical" fluff.

        Permitted Topics:
        • Horoscope validation ("How is my day?", "What is my daily forecast?")
        • Planets, signs, houses, aspects, transits, progressions
        • Dignities, receptions, synastry, composite charts
        • Technical astrological calculations and interpretations
        • Spiritual and energetic guidance based on the chart

        Tone:
        • Professional, mystical but grounded, and insightful.
        • You may use metaphors to explain complex energy.
        • You may speak directly to the user about their life.

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
