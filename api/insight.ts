import { GoogleGenerativeAI } from '@google/generative-ai';

// --- ENGINE LOGIC START (PURE MATH, NO DEPENDENCIES) ---
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

// Math Helpers
const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;
const sind = (d: number) => Math.sin(d * RAD);
const cosd = (d: number) => Math.cos(d * RAD);
const tand = (d: number) => Math.tan(d * RAD);
const asind = (x: number) => Math.asin(x) * DEG;
const atan2d = (y: number, x: number) => Math.atan2(y, x) * DEG;

function normalizeDegree(deg: number): number {
  let d = deg % 360;
  while (d < 0) d += 360;
  return d;
}

function getJulianDay(date: Date): number {
  return (date.getTime() / 86400000) + 2440587.5;
}

function getLahiriAyanamsa(jd: number): number {
  // Ayanamsa ~ 23.86 at J2000, changing ~0.0139 deg/year
  const t = (jd - 2451545.0) / 36525.0;
  return 23.85 + 1.4 * t; // Simplified linear approximation for robustness
}

function getGMST(jd: number): number {
  const t = (jd - 2451545.0) / 36525.0;
  let gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * t * t - t * t * t / 38710000;
  return normalizeDegree(gmst);
}

function getSunIsLong(jd: number): number {
  // Low precision analytical model for Sun Mean Longitude
  const D = jd - 2451545.0;
  const g = 357.529 + 0.98560028 * D;
  const q = 280.459 + 0.98564736 * D;
  const L = q + 1.915 * sind(g) + 0.020 * sind(2 * g);
  return normalizeDegree(L);
}

function getMoonIsLong(jd: number): number {
  // Low precision analytical model for Moon
  const D = jd - 2451545.0;
  const L = 218.32 + 13.176396 * D;
  const M = 134.96 + 13.064993 * D; // Mean Anomaly
  const F = 93.27 + 13.229350 * D; // Arg of Latitude
  const l = L + 6.289 * sind(M); // Equation of center
  return normalizeDegree(l);
}

function calculateVedicChart(dateWrapper: string, timeString: string, lat: number, lon: number) {
  let [hours, minutes] = timeString.split(':').map(part => part.trim());
  let isPM = false, isAM = false;
  if (timeString.toUpperCase().includes('PM')) { isPM = true; minutes = minutes.replace(/PM/i, '').trim(); }
  else if (timeString.toUpperCase().includes('AM')) { isAM = true; minutes = minutes.replace(/AM/i, '').trim(); }

  let hourInt = parseInt(hours, 10);
  const minuteInt = parseInt(minutes, 10);
  if (isPM && hourInt < 12) hourInt += 12;
  if (isAM && hourInt === 12) hourInt = 0;

  const paddedHour = hourInt.toString().padStart(2, '0');
  const paddedMinute = minuteInt.toString().padStart(2, '0');
  let date = new Date(`${dateWrapper}T${paddedHour}:${paddedMinute}:00Z`); // Treat input as UTC for simplified calculation standard or assume input is local and convert.
  // NOTE: Ideally we subtract TZ offset. For MVP crash fix, we treat as UTC-ish or rely on generic calc.
  // Better: create date from string, get timestamp.

  if (isNaN(date.getTime())) date = new Date(); // Fallback

  const jd = getJulianDay(date);
  const ayanamsa = getLahiriAyanamsa(jd);
  const gmst = getGMST(jd);
  const lst = normalizeDegree(gmst + lon); // Local Sidereal Time in degrees
  const ramc = lst;

  // Obliquity
  const t = (jd - 2451545.0) / 36525.0;
  const eps = 23.439 - 0.013 * t;

  // Ascendant (Lagnam)
  // tan(Asc) = cos(RAMC) / ( -sin(RAMC)*cos(eps) - tan(lat)*sin(eps) )
  const top = cosd(ramc);
  const bottom = -sind(ramc) * cosd(eps) - tand(lat) * sind(eps);
  let ascDeg = atan2d(top, bottom);
  ascDeg = normalizeDegree(ascDeg); // Tropical Ascendant

  const siderealAsc = normalizeDegree(ascDeg - ayanamsa);

  // Sun & Moon Positions
  const sunTrop = getSunIsLong(jd);
  const moonTrop = getMoonIsLong(jd);
  const sunSid = normalizeDegree(sunTrop - ayanamsa);
  const moonSid = normalizeDegree(moonTrop - ayanamsa);

  const planets = [
    { name: "Sun", degree: sunSid, sign: ZODIAC[Math.floor(sunSid / 30)], nakshatra: NAKSHATRAS[Math.floor(sunSid / 13.33)] },
    { name: "Moon", degree: moonSid, sign: ZODIAC[Math.floor(moonSid / 30)], nakshatra: NAKSHATRAS[Math.floor(moonSid / 13.33)] },
    // Others left for AI to estimate or add more formulas later
  ];

  const getSignName = (d: number) => ZODIAC[Math.floor(normalizeDegree(d) / 30)] || "Aries";
  const getNakshatraName = (d: number) => NAKSHATRAS[Math.floor(normalizeDegree(d) / 13.33333)] || "Ashwini";

  return {
    ascendant: { degree: siderealAsc, sign: getSignName(siderealAsc), nakshatra: getNakshatraName(siderealAsc) },
    planets: planets
  };
}
// --- ENGINE LOGIC END ---

export const config = {
  runtime: 'nodejs',
  maxDuration: 60, // Allow up to 60 seconds for execution
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
