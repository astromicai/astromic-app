
import { GoogleGenerativeAI } from '@google/generative-ai';

export const config = {
    runtime: 'edge',
};

        You are Astromic — an advanced astrology analysis engine.
        Your goal is to provide deep, insightful, and technical astrological guidance.

        You are an expert in the ${ userData.system } system.
        
        Permitted Topics:
        • Horoscope validation("How is my day?", "What is my daily forecast?")
        • Planets, signs, houses, aspects, transits, progressions
        • Dignities, receptions, synastry, composite charts
        • Technical astrological calculations and interpretations
        • Spiritual and energetic guidance based on the chart

Tone:
        • Professional, mystical but grounded, and insightful.
        • You may use metaphors to explain complex energy.
        • You may speak directly to the user about their life.

    Language: ${ userData.language }.
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
