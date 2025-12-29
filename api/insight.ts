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

function getTzOffsetMinutes(date: Date, timeZone: string): number {
  // Returns offset in minutes (e.g. Asia/Kolkata -> -330 for UTC+5:30)
  // We use the Intl API which is available in Edge Runtime
  try {
    const invDate = new Date(date.toLocaleString('en-US', { timeZone }));
    const diff = date.getTime() - invDate.getTime();
    return diff / 60000;
  } catch (e) {
    // Fallback for invalid timezone: try to guess or default to 0
    console.error("Timezone calc error:", e);
    return 0;
  }
}

function calculateVedicChart(dateWrapper: string, timeString: string, lat: number, lon: number, timeZone: string = "UTC") {
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

  // Construct "Local" date object (absolute time is wrong here, but components are right)
  const isoLocal = `${dateWrapper}T${paddedHour}:${paddedMinute}:00`;
  let localDateDummy = new Date(isoLocal + "Z"); // Treat as UTC just to get the components into a Date object

  if (isNaN(localDateDummy.getTime())) localDateDummy = new Date();

  // Calculate Offset
  // We want: Time_UTC = Time_Local - Offset
  // But Intl is tricky.
  // robust way:
  // 1. Create a date object that represents the instant in UTC that matches user's wall clock.
  // 2. Ask Intl "What time is it in Asia/Kolkata for this UTC instant?"
  // 3. The difference is the offset.

  // Actually, simple Vercel/Node way:
  // We have "2023-08-23T20:30:00" and "Asia/Kolkata".
  // We want the timestamp.

  // Let's use the 'toLocaleString' trick to compute offset:
  const now = new Date();
  const tzString = now.toLocaleString("en-US", { timeZone });
  // This confirms timezone is valid.

  // Hack: Create a UTC date with the user's components
  const utcTimeOfUserComponents = Date.UTC(
    localDateDummy.getUTCFullYear(),
    localDateDummy.getUTCMonth(),
    localDateDummy.getUTCDate(),
    localDateDummy.getUTCHours(),
    localDateDummy.getUTCMinutes()
  );

  // Now get the offset for this general area.
  // Since we don't have a library, we'll approximate offset using the Intl API on the current date,
  // or arguably the birth date if we can.

  const getDateInTz = (d: number, tz: string) => {
    return new Date(new Date(d).toLocaleString("en-US", { timeZone: tz }));
  }

  // Iterative approach to find UTC timestamp where Local Time matches User Input
  // Estimate: UTC = Local - 5.5h (approx)
  let guessUTC = utcTimeOfUserComponents - (5.5 * 3600 * 1000);

  // Refine
  // If we convert 'guessUTC' to 'timeZone', do we get 'utcTimeOfUserComponents'?
  const dGuess = new Date(guessUTC);
  const localGuess = getDateInTz(guessUTC, timeZone);
  // localGuess components vs desired components
  const diff = localGuess.getTime() - dGuess.getTime();
  // Actually simpler:
  // Offset = Local (as UTC) - UTC
  // We can't easily get this without a library like luxon.

  // SIMPLEST FIX FOR MVP:
  // Use the `timeZone` to adjust.
  // If timeZone is "Asia/Kolkata", we know it is roughly +5.5.
  // If we are in Edge Runtime, we rely on standard IANA offsets.

  // Let's deduce offset by formatting a reference date.
  const refDate = new Date(utcTimeOfUserComponents); // 20:30 UTC
  const refString = refDate.toLocaleString('en-US', { timeZone, hour12: false });
  // This gives us what 20:30 UTC is in Kolkata (likely 02:00 next day).
  // Compare 02:00 next day to 20:30.
  const refLocal = new Date(refString);
  const offsetMs = refLocal.getTime() - refDate.getTime(); // This is the TZ Offset!

  const trueUtcTimestamp = utcTimeOfUserComponents - offsetMs;
  const trueDate = new Date(trueUtcTimestamp);

  const jd = getJulianDay(trueDate);
  const ayanamsa = getLahiriAyanamsa(jd);
  const gmst = getGMST(jd);
  const lst = normalizeDegree(gmst + lon);
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

  // --- Planetary Calculation Helpers (Mean Elements) ---
  // Elements from Paul Schlyter (stjarnhimlen.se) - Low precision (1-2 deg error max, sufficient for Sign)

  function getMeanLongitude(jd: number, planet: string): number {
    const d = jd - 2451545.0; // Days from J2000
    let L = 0; // Mean Longitude
    let M = 0; // Mean Anomaly
    let C = 0; // Equation of Center

    switch (planet) {
      case 'Mercury':
        L = normalizeDegree(252.250906 + 4.0923344368 * d);
        M = normalizeDegree(174.794726 + 4.0923344368 * d); // Approx M ~ L for simplicty of arg? No.
        // Better Mean Anomaly:
        M = normalizeDegree(174.7948 + 4.09233445 * d);
        C = 23.44 * sind(M) + 2.98 * sind(2 * M); // Major terms
        break;
      case 'Venus':
        L = normalizeDegree(181.979801 + 1.6021307246 * d);
        M = normalizeDegree(50.4161 + 1.6021307 * d);
        C = 0.776 * sind(M) + 0.005 * sind(2 * M);
        break;
      case 'Mars':
        L = normalizeDegree(355.453388 + 0.5240207766 * d);
        M = normalizeDegree(19.3730 + 0.52402078 * d);
        C = 10.691 * sind(M) + 0.623 * sind(2 * M);
        break;
      case 'Jupiter':
        L = normalizeDegree(34.404381 + 0.0830853001 * d);
        M = normalizeDegree(19.8950 + 0.0830853 * d);
        C = 5.555 * sind(M) + 0.168 * sind(2 * M);
        break;
      case 'Saturn':
        L = normalizeDegree(49.944320 + 0.0334442282 * d);
        M = normalizeDegree(317.0207 + 0.0334442 * d);
        C = 6.358 * sind(M) + 0.22 * sind(2 * M);
        break;
      case 'Rahu': // Mean North Node
        // N = 125.04452 - 1934.136261 * T
        // d is days, T is cent.
        // Daily motion = -0.0529538 deg
        L = normalizeDegree(125.04452 - 0.0529537648 * d);
        return L; // Node has no Eq of Center in mean approx
      case 'Ketu':
        return normalizeDegree(getMeanLongitude(jd, 'Rahu') + 180);
    }

    return normalizeDegree(L + C);
  }

  const planetsData = [
    { name: "Sun", degree: sunSid, sign: ZODIAC[Math.floor(sunSid / 30)], nakshatra: NAKSHATRAS[Math.floor(sunSid / 13.33)] },
    { name: "Moon", degree: moonSid, sign: ZODIAC[Math.floor(moonSid / 30)], nakshatra: NAKSHATRAS[Math.floor(moonSid / 13.33)] },
  ];

  ['Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'].forEach(pName => {
    const tropDeg = getMeanLongitude(jd, pName);
    const sidDeg = normalizeDegree(tropDeg - ayanamsa);
    planetsData.push({
      name: pName,
      degree: sidDeg,
      sign: ZODIAC[Math.floor(sidDeg / 30)],
      nakshatra: NAKSHATRAS[Math.floor(sidDeg / 13.33)]
    });
  });

  const getSignName = (d: number) => ZODIAC[Math.floor(normalizeDegree(d) / 30)] || "Aries";
  const getNakshatraName = (d: number) => NAKSHATRAS[Math.floor(normalizeDegree(d) / 13.33333)] || "Ashwini";

  return {
    ascendant: { degree: siderealAsc, sign: getSignName(siderealAsc), nakshatra: getNakshatraName(siderealAsc) },
    planets: planetsData
  };
}
// --- ENGINE LOGIC END ---

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
      // Profile Insight with VEDIC CALCULATION ENGINE
      let calculatedChartFormatted = "No calculation available.";
      let chart: any; // Lifted Scope

      const { system, birthDate, birthTime, birthPlace, latitude, longitude, timezone } = userData;

      // Only run engine if coordinates exist
      if (latitude && longitude && system === 'Indian Vedic') {
        try {
          // Import dynamically or assume it's available if compilation succeeds
          // Since we are in the same project, we import from adjacent file
          // Note: In Vercel Edge, standard imports work if bundled.
          // Using .js extension for node16 resolution
          chart = calculateVedicChart(birthDate, birthTime, latitude, longitude, userData.timezone || "UTC");

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
            Rahu: ${chart.planets.find(p => p.name === 'Rahu')?.sign}
            Ketu: ${chart.planets.find(p => p.name === 'Ketu')?.sign}
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
         5. KEEP RESPONSES CONCISE (Max 2 sentences per summary). SPEED IS CRITICAL.
         6. NO empty strings.
         
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

      // Merge
      let finalJson = {};
      try {
        finalJson = JSON.parse(cleanedText);
      } catch (e) {
        finalJson = { headline: "Insight", summary: cleanedText.substring(0, 50) };
      }

      // Inject Raw Chart
      if (typeof chart !== 'undefined') {
        (finalJson as any).rawChart = chart;
      }

      return new Response(JSON.stringify(finalJson), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }


  } catch (error: any) {
    console.error("API Error In Insight:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
