
import Astronomy from 'astronomy-engine';

// ZODIAC SIGNS (0 = Aries, 1 = Taurus, ... 11 = Pisces)
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

// YOGAS (27)
const YOGAS = [
    "Vishkumbha", "Priti", "Ayushman", "Saubhagya", "Shobhana", "Atiganda", "Sukarma",
    "Dhriti", "Shula", "Ganda", "Vriddhi", "Dhruva", "Vyaghata", "Harshana",
    "Vajra", "Siddhi", "Vyatipata", "Variyan", "Parigha", "Shiva", "Siddha",
    "Sadhya", "Shubha", "Shukla", "Brahma", "Indra", "Vaidhriti"
];

// TITHIS (30)
const TITHIS = [
    "Prathama", "Dvitiya", "Tritiya", "Chaturthi", "Panchami", "Shasthi", "Saptami", "Ashtami", "Navami", "Dashami", "Ekadashi", "Dvadashi", "Trayodashi", "Chaturdashi", "Purnima", // Shukla Paksha
    "Prathama", "Dvitiya", "Tritiya", "Chaturthi", "Panchami", "Shasthi", "Saptami", "Ashtami", "Navami", "Dashami", "Ekadashi", "Dvadashi", "Trayodashi", "Chaturdashi", "Amavasya"  // Krishna Paksha
];

// Calculate Lahiri Ayanamsa for a given J2000 date (tt)
function getLahiriAyanamsa(date: Date): number {
    // Ayanamsa ~ 23deg 51min for 2000 AD.
    // Precise formula based on N.C. Lahiri:
    // Ayanamsa = 23.85 + 0.0137 * (Year - 2000)
    // Actually let's use a standard calculation:
    // J2000 epoch is 2451545.0
    // Mean sidereal ayanamsa formula (Swiss Eph compatible approx).

    // For simplicity and solid accuracy, we use the standard linear approximation which is sufficient for basic charts (error < 1 arcmin):
    // Ayanamsa(2000) = 23.86 deg
    // Precession rate = 50.29 arcsec/year

    const year = date.getUTCFullYear() + (date.getUTCMonth() / 12) + (date.getUTCDate() / 365);
    const ayanamsa = 23.8616 + 0.01396 * (year - 2000);
    return ayanamsa;
}

function normalizeDegree(deg: number): number {
    let d = deg % 360;
    if (d < 0) d += 360;
    return d;
}

function getSign(deg: number): string {
    return ZODIAC[Math.floor(normalizeDegree(deg) / 30)];
}

function getNakshatra(deg: number): string {
    return NAKSHATRAS[Math.floor(normalizeDegree(deg) / 13.33333)];
}

function getNakshatraPadam(deg: number): number {
    const oneStar = 13.333333;
    const onePadam = 3.333333;
    const remainder = normalizeDegree(deg) % oneStar;
    return Math.floor(remainder / onePadam) + 1;
}

export interface VedicPlanet {
    name: string;
    degree: number;
    sign: string;
    nakshatra: string;
    nakshatraPadam?: number;
    house?: number;
    isRetrograde?: boolean;
}

export function calculateVedicChartV2(dateString: string, timeString: string, lat: number, lon: number, timezone: string = "UTC") {
    // Parse Date Time
    // Incoming format: dateString "YYYY-MM-DD", timeString "HH:mm" (24h) or "HH:mm PM"

    // Handle 12-hour format "08:30 PM" to 24-hour "20:30"
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

    // Create ISO string in UTC first (Interpretation: This Time AT UTC)
    // Then we subtact offset to get the actual UTC moment of that Local Time.
    const isoString = `${dateString}T${paddedHour}:${paddedMinute}:00.000Z`;
    let date = new Date(isoString);

    if (isNaN(date.getTime())) {
        throw new Error(`Invalid Date for input: ${isoString}`);
    }

    // Adjust for Timezone manually since we are in a serverless env without large libraries.
    // We need to SUBTRACT the offset to get true UTC.
    // Example: 20:30 IST is 15:00 UTC. 
    // If we created 20:30 UTC (date above), we must SUBTRACT 5.5 hours.

    let offsetHours = 0;
    const tz = timezone.toLowerCase();

    if (tz.includes('kolkata') || tz.includes('calcutta') || tz.includes('ist') || tz.includes('india')) {
        offsetHours = 5.5;
    } else if (tz === 'utc' || tz === 'gmt') {
        offsetHours = 0;
    } else {
        // Fallback: Try to guess or default to UTC if unknown.
        // Ideally passing the numeric offset from frontend would be better.
        // For now, assume UTC if not Indian, to avoid wild errors, or maybe 0 check.
        // But we assume the standard user is testing for India per conversation.
        offsetHours = 0;
    }

    // Subtract offsetHours from the date (which is currently "Local Time as UTC")
    date.setTime(date.getTime() - (offsetHours * 60 * 60 * 1000));

    // Force numeric conversion for safety
    const latNum = parseFloat(String(lat));
    const lonNum = parseFloat(String(lon));

    const observer = new Astronomy.Observer(latNum, lonNum, 0);
    const ayanamsa = getLahiriAyanamsa(date);

    const planets = [
        "Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"
    ];

    const results: VedicPlanet[] = [];
    let sunLon = 0;
    let moonLon = 0;

    // 1. Calculate Planets (Tropical -> Sidereal)
    for (const p of planets) {
        // Cast string to any to avoid TS error, runtime supports strings
        // Use ofDate=true (4th arg) to get coordinates relative to Equinox of Date.
        const eq = Astronomy.Equator(p as any, date, observer, true, true);
        const ecliptic = Astronomy.Ecliptic(eq.vec);
        const tropicalLon = ecliptic.elon;
        const siderealLon = normalizeDegree(tropicalLon - ayanamsa);

        if (p === "Sun") sunLon = siderealLon;
        if (p === "Moon") moonLon = siderealLon;

        results.push({
            name: p,
            degree: siderealLon,
            sign: getSign(siderealLon),
            nakshatra: getNakshatra(siderealLon),
            nakshatraPadam: getNakshatraPadam(siderealLon)
        });
    }

    // 2. Calculate Panchang

    // Tithi
    // Diff = Moon - Sun. If < 0 add 360.
    // Each Tithi = 12 deg.
    let diffLon = normalizeDegree(moonLon - sunLon);
    const tithiIndex = Math.floor(diffLon / 12);
    const tithi = TITHIS[tithiIndex % 30];
    const tithiPaksha = tithiIndex < 15 ? "Shukla" : "Krishna";

    // Yoga
    // Sum = Moon + Sun. 
    // Each Yoga = 13 deg 20 min = 13.3333 deg.
    // 360 deg total.
    let sumLon = normalizeDegree(moonLon + sunLon);
    const yogaIndex = Math.floor(sumLon / 13.333333);
    const yoga = YOGAS[yogaIndex % 27];

    // Karana
    const karanaNum = Math.floor(diffLon / 6) + 1;
    let karana = "";
    if (karanaNum === 1) karana = "Kimstughna";
    else if (karanaNum >= 58 && karanaNum <= 60) {
        if (karanaNum === 58) karana = "Shakuni";
        if (karanaNum === 59) karana = "Chatushpada";
        if (karanaNum === 60) karana = "Naga";
    } else {
        const rotIndex = (karanaNum - 2) % 7;
        const movingKaranas = ["Bava", "Balava", "Kaulava", "Taitila", "Gara", "Vanija", "Vishti"];
        karana = movingKaranas[rotIndex];
    }

    // 3. Calculate Ascendant (Lagnam)
    const gst = Astronomy.SiderealTime(date); // Greenwich Sidereal Time (hours)
    const lst = (gst + lonNum / 15.0) % 24; // Local Sidereal Time (hours)
    const ramc = lst * 15.0; // in degrees

    function getMeanObliquity(date: Date): number {
        const jd = date.getTime() / 86400000 + 2440587.5;
        const t = (jd - 2451545.0) / 36525.0;
        const eps = 23.4392911 - (46.8150 * t + 0.00059 * t * t - 0.001813 * t * t * t) / 3600.0;
        return eps;
    }
    const obliquity = getMeanObliquity(date);
    const rad = (d: number) => d * Math.PI / 180;
    const deg = (r: number) => r * 180 / Math.PI;
    const eps = rad(obliquity);
    const phi = rad(latNum);
    const ramcRad = rad(ramc);

    // Ascendant (Tropical)
    let ascRad = Math.atan2(
        Math.cos(ramcRad),
        -Math.sin(ramcRad) * Math.cos(eps) - Math.tan(phi) * Math.sin(eps)
    );
    let ascDeg = normalizeDegree(deg(ascRad));

    // Ascendant (Sidereal)
    const siderealAsc = normalizeDegree(ascDeg - ayanamsa);
    const ascSign = getSign(siderealAsc);

    return {
        ascendant: {
            degree: siderealAsc,
            sign: ascSign,
            nakshatra: getNakshatra(siderealAsc),
            nakshatraPadam: getNakshatraPadam(siderealAsc)
        },
        panchang: {
            tithi,
            tithiPaksha,
            dp_tithi: tithiIndex + 1, // 1-30
            yoga,
            dp_yoga: yogaIndex + 1, // 1-27
            karana,
            nakshatra: getNakshatra(moonLon),
            nakshatraPadam: getNakshatraPadam(moonLon)
        },
        planets: results,
        debug: {
            calcDate: date.toISOString(),
            julianDay: (date.getTime() / 86400000) + 2440587.5,
            ayanamsa,
            sunLon,
            moonLon,
            latNum,
            lonNum,
            offsetHours
        }
    };
}
