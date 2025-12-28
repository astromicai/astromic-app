
import { GoogleGenerativeAI } from '@google/generative-ai';

export const config = {
    runtime: 'edge',
};

export default async function handler(req: Request) {
    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    try {
        const { userData, type } = await req.json(); // type: 'insight' or 'transit'
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return new Response(JSON.stringify({ error: "Server misconfiguration: API key missing" }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        if (type === 'transit') {
            const prompt = `
        Generates daily transit data for:
        User: ${userData.name}, ${userData.birthDate}, ${userData.birthTime}, ${userData.birthPlace}.
        System: ${userData.system}.
        Date: ${new Date().toISOString()}.
        
        Return JSON structure matching TransitData interface:
        {
          "dailyHeadline": "Short punchy cosmic headline",
          "dailyHoroscope": "2-3 sentences of guidance",
          "mood": "Word",
          "luckyNumber": 0,
          "luckyColor": "Color name",
          "dailyAdvice": ["Tip 1", "Tip 2", "Tip 3"],
          "transits": [
            { "planet": "Mars", "sign": "Aries", "aspect": "Conjunction", "description": "...", "intensity": "High", "icon": "bolt" }
          ],
          "progressions": [
            { "title": "Progression Name", "insight": "Start date..." }
          ]
        }
      `;
            const result = await model.generateContent(prompt);
            return new Response(result.response.text(), { status: 200, headers: { 'Content-Type': 'application/json' } });

        } else {
            // Profile Insight
            const prompt = `
         Generate a detailed astrological profile for:
         Name: ${userData.name}
         Birth: ${userData.birthDate} at ${userData.birthTime} in ${userData.birthPlace}
         System: ${userData.system}
         Focus: ${userData.focusAreas.join(', ')}
         Language: ${userData.language}

         IMPORTANT: Also generate a 'Celestial Sigil' for this user. 
         This should be a unique SVG XML string. 
         The SVG should be abstract, geometric, and mystical. 
         Use paths, circles, and lines. 
         Stroke color should be predominantly white or magenta (#f20db9). 
         Background transparent.
         Size 512x512. 
         NO TEXT inside the SVG.
         
         Return JSON:
         {
           "headline": "Cosmic Title",
           "archetype": "The Archetype Name",
           "summary": "2 paragraph summary...",
           "technicalDetails": [
             { "label": "Sun", "value": "Aries", "icon": "sunny" },
             { "label": "Moon", "value": "Pisces", "icon": "bedtime" },
             { "label": "Ascendant", "value": "Leo", "icon": "star" }
             // ... include others relevant to system (e.g. Nakshatra for Vedic)
           ],
           "chartData": {
             "planets": [
               { "name": "Sun", "degree": 45, "sign": "Taurus", "house": 10 }
               // ... full planetary positions
             ]
           },
           "navamsaInsight": "Optional insight string if Vedic...",
           "activeSefirotOrNodes": [
             // Optional for Kabbalah
           ],
           "sigilUrl": "<svg ...>...</svg>" 
         }
      `;

            const result = await model.generateContent(prompt);
            return new Response(result.response.text(), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

    } catch (error: any) {
        console.error("API Error In Insight:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}
