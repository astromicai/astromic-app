
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
      systemInstruction: "You are Astromic, an expert astrologer engine. Your purpose is to generate deep, accurate, and mystical astrological insights in strict JSON format. Never return empty strings or null values. Always provide rich, descriptive content.",
      generationConfig: { responseMimeType: "application/json" }
    });

    // Helper to clean JSON string
    const cleanJson = (text: string) => {
      let clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
      // Sometimes the model adds text before or after the JSON
      const firstBrace = clean.indexOf('{');
      const lastBrace = clean.lastIndexOf('}');
      if (firstBrace >= 0 && lastBrace >= 0) {
        clean = clean.substring(firstBrace, lastBrace + 1);
      }
      return clean;
    };

    if (type === 'transit') {
      const prompt = `
        Generates daily transit data for:
        User: ${userData.name}, ${userData.birthDate}, ${userData.birthTime}, ${userData.birthPlace}.
        System: ${userData.system}.
        Date: ${new Date().toISOString()}.
        Language: ${userData.language}.
        
        MANDATORY INSTRUCTIONS:
        1. OUTPUT MUST BE IN ${userData.language} LANGUAGE (except JSON keys).
        2. KEEP ALL JSON KEYS IN ENGLISH (e.g. "dailyHeadline", "transits").
        3. TRANSLATE ALL VALUES to ${userData.language}.
        4. "dailyAdvice" MUST contain at least 3 distinct strings.
        5. "transits" MUST contain at least 4 distinct planetary transits.
        6. NO empty strings. NO null values.
        
        Return JSON structure matching TransitData interface:
        {
          "dailyHeadline": "Translated Headline",
          "dailyHoroscope": "Translated horoscope text...",
          "mood": "Translated Word",
          "luckyNumber": 0,
          "luckyColor": "Translated Color",
          "dailyAdvice": ["Translated Advice 1", "Translated Advice 2", "Translated Advice 3"],
          "transits": [
            { "planet": "Planet Name", "sign": "Translated Sign", "aspect": "Translated Aspect", "description": "Translated description", "intensity": "High", "icon": "bolt" }
          ],
          "progressions": [
            { "title": "Translated Title", "insight": "Translated insight..." }
          ]
        }
      `;
      const result = await model.generateContent(prompt);
      const cleanedText = cleanJson(result.response.text());
      return new Response(cleanedText, { status: 200, headers: { 'Content-Type': 'application/json' } });

    } else {
      // Profile Insight
      const prompt = `
         Generate a detailed astrological profile for:
         Name: ${userData.name}
         Birth: ${userData.birthDate} at ${userData.birthTime} in ${userData.birthPlace}
         System: ${userData.system}
         Focus: ${userData.focusAreas.join(', ')}
         Language: ${userData.language}
         
         MANDATORY INSTRUCTIONS:
         1. OUTPUT MUST BE IN ${userData.language} LANGUAGE (except JSON keys).
         2. KEEP ALL JSON KEYS IN ENGLISH (e.g. "headline", "summary").
         3. TRANSLATE ALL VALUES to ${userData.language}.
         4. "technicalDetails" MUST contain at least 8 items.
         5. NO empty strings.
         
         Return JSON:
         {
           "headline": "Translated Title",
           "archetype": "Translated Archetype",
           "summary": "Translated summary...",
           "technicalDetails": [
             { "label": "Translated Label (Sun)", "value": "Translated Sign", "icon": "sunny" },
             { "label": "Translated Label (Moon)", "value": "Translated Sign", "icon": "bedtime" }
           ],
           "chartData": {
             "planets": [
               { "name": "Sun", "degree": 45, "sign": "Translated Sign", "house": 10 }
             ]
           },
           "navamsaInsight": "Translated insight...",
           "activeSefirotOrNodes": []
         }
      `;

      const result = await model.generateContent(prompt);
      const cleanedText = cleanJson(result.response.text());
      return new Response(cleanedText, { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

  } catch (error: any) {
    console.error("API Error In Insight:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
