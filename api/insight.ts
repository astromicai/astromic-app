import { GoogleGenerativeAI } from '@google/generative-ai';
import Astronomy from 'astronomy-engine';

// --- ENGINE LOGIC START ---
const ZODIAC = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

const NAKSHATRAS = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
  "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
  "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
  "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta",
  "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
];

function getLahiriAyanamsa(date: Date): number {
  const year = date.getUTCFullYear() + (date.getUTCMonth() / 12) + (date.getUTCDate() / 365);
  return 23.8616 + 0.01396 * (year - 2000);
}

function normalizeDegree(deg: number): number {
  let d = deg % 360;
  while (d < 0) d += 360;
  return d;
}

function getSign(deg: number): string {
  return ZODIAC[Math.floor(normalizeDegree(deg) / 30)] || "Aries";
}

function getNakshatra(deg: number): string {
  return NAKSHATRAS[Math.floor(normalizeDegree(deg) / 13.33333)] || "Ashwini";
}

function getMeanObliquity(date: Date): number {
  const jd = date.getTime() / 86400000 + 2440587.5;
  const t = (jd - 2451545.0) / 36525.0;
  const eps = 23.4392911 - (46.8150 * t + 0.00059 * t * t - 0.001813 * t * t * t) / 3600.0;
  return eps;
}

function calculateVedicChart(dateWrapper: string, timeString: string, lat: number, lon: number) {
  let [hours, minutes] = timeString.split(':').map(part => part.trim());
  let isPM = false;
  let isAM = false;

  if (timeString.toUpperCase().includes('PM')) {
    isPM = true;
    minutes = minutes.replace(/PM/i, '').trim();
  } else if (timeString.toUpperCase().includes('AM')) {
    isAM = true;
    minutes = minutes.replace(/AM/i, '').trim();
  }

  let hourInt = parseInt(hours, 10);
  const minuteInt = parseInt(minutes, 10);

  if (isPM && hourInt < 12) hourInt += 12;
  if (isAM && hourInt === 12) hourInt = 0;

  const paddedHour = hourInt.toString().padStart(2, '0');
  const paddedMinute = minuteInt.toString().padStart(2, '0');
  const dateTimeStr = `${dateWrapper}T${paddedHour}:${paddedMinute}:00`;

  // Attempt to parse, or default to now if fail (fail-safe)
  let date = new Date(dateTimeStr);
  if (isNaN(date.getTime())) {
    console.error("Invalid Date parsed, using current time fallback");
    date = new Date();
  }

  const observer = new Astronomy.Observer(lat, lon, 0);
  const ayanamsa = getLahiriAyanamsa(date);
  const planetsList = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"];
  const results = [];

  for (const p of planetsList) {
    const eq = Astronomy.Equator(p as any, date, observer, false, true);
    const ecliptic = Astronomy.Ecliptic(eq.vec);
    const tropicalLon = ecliptic.elon;
    const siderealLon = normalizeDegree(tropicalLon - ayanamsa);
    results.push({ name: p, degree: siderealLon, sign: getSign(siderealLon), nakshatra: getNakshatra(siderealLon) });
  }

  const gst = Astronomy.SiderealTime(date);
  const lst = (gst + lon / 15.0) % 24;
  const ramc = lst * 15.0;
  const obliquity = getMeanObliquity(date);

  const rad = (d: number) => d * Math.PI / 180;
  const deg = (r: number) => r * 180 / Math.PI;
  const eps = rad(obliquity);
  const phi = rad(lat);
  const ramcRad = rad(ramc);

  let ascRad = Math.atan2(Math.cos(ramcRad), -Math.sin(ramcRad) * Math.cos(eps) - Math.tan(phi) * Math.sin(eps));
  let ascDeg = normalizeDegree(deg(ascRad));
  const siderealAsc = normalizeDegree(ascDeg - ayanamsa);

  return {
    ascendant: { degree: siderealAsc, sign: getSign(siderealAsc), nakshatra: getNakshatra(siderealAsc) },
    planets: results
  };
}
// --- ENGINE LOGIC END ---

export const config = {
  runtime: 'nodejs',
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
      // Profile Insight with VEDIC CALCULATION ENGINE
      let calculatedChartFormatted = "No calculation available.";

      const { system, birthDate, birthTime, birthPlace, latitude, longitude } = userData;

      // Only run engine if coordinates exist
      if (latitude && longitude && system === 'Indian Vedic') {
        try {
          // Import dynamically or assume it's available if compilation succeeds
          // Since we are in the same project, we import from adjacent file
          // Note: In Vercel Edge, standard imports work if bundled.
          // Using .js extension for node16 resolution
          const chart = calculateVedicChart(birthDate, birthTime, latitude, longitude);

          calculatedChartFormatted = `
            CALCULATED VEDIC DATA (Lahiri Ayanamsa):
            Ascendant (Lagnam): ${chart.ascendant.sign} (${chart.ascendant.nakshatra})
            Sun: ${chart.planets.find(p => p.name === 'Sun')?.sign}
            Moon: ${chart.planets.find(p => p.name === 'Moon')?.sign} (${chart.planets.find(p => p.name === 'Moon')?.nakshatra})
            Mars: ${chart.planets.find(p => p.name === 'Mars')?.sign}
            Mercury: ${chart.planets.find(p => p.name === 'Mercury')?.sign}
            Jupiter: ${chart.planets.find(p => p.name === 'Jupiter')?.sign}
            Venus: ${chart.planets.find(p => p.name === 'Venus')?.sign}
            Saturn: ${chart.planets.find(p => p.name === 'Saturn')?.sign}
            `;
        } catch (e) {
          console.error("Vedic Engine Calculation Failed:", e);
          calculatedChartFormatted = "Calculation Error. Proceed with estimation.";
        }
      }

      const prompt = `
         PERFORM ASTROLOGICAL INTERPRETATION.
         Role: Expert Vedic Astrologer.
         
         Input Data:
         Name: ${userData.name}
         Birth: ${userData.birthDate} ${userData.birthTime} in ${userData.birthPlace}
         System: ${userData.system}
         Language: ${userData.language}
         
         ${calculatedChartFormatted !== "No calculation available." ? `
         CRITICAL: USE THESE PRE-CALCULATED PLANETARY POSITIONS (DO NOT HALLUCINATE POSITIONS):
         ${calculatedChartFormatted}
         ` : `
         CRITICAL: Calculate planetary positions accurately for the date.
         `}
         
         MANDATORY INSTRUCTIONS:
         1. OUTPUT MUST BE IN ${userData.language} LANGUAGE (except JSON keys).
         2. KEEP ALL JSON KEYS IN ENGLISH.
         3. TRANSLATE ALL VALUES.
         4. If "Lagnam" is provided above, YOU MUST USE IT.
         5. NO empty strings.
         
         Return JSON:
         {
           "headline": "Translated Title",
           "archetype": "Translated Archetype",
           "summary": "Translated summary...",
           "technicalDetails": [
             { "label": "Lagnam (Ascendant)", "value": "Sign", "icon": "star" },
             { "label": "Rashi (Moon Sign)", "value": "Sign", "icon": "bedtime" },
             { "label": "Nakshatra", "value": "Star Name", "icon": "auto_awesome" },
             { "label": "Thithi", "value": "Lunar Day", "icon": "dark_mode" },
             { "label": "Yogam", "value": "Yoga Name", "icon": "join_inner" },
             { "label": "Karanam", "value": "Karana Name", "icon": "timeline" }
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
