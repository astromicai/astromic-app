import React from 'react';
import { InsightData } from '../../types';

interface ChartProps {
    data: InsightData;
}

const SouthIndianChart: React.FC<ChartProps & { language?: string }> = ({ data, language = 'English' }) => {

    const TRANSLATIONS: any = {
        'Tamil': {
            signs: {
                "Aries": "மேஷம்", "Taurus": "ரிஷபம்", "Gemini": "மிதுனம்", "Cancer": "கடகம்",
                "Leo": "சிம்மம்", "Virgo": "கன்னி", "Libra": "துலாம்", "Scorpio": "விருச்சிகம்",
                "Sagittarius": "தனுசு", "Capricorn": "மகரம்", "Aquarius": "கும்பம்", "Pisces": "மீனம்"
            },
            planets: {
                "Sun": "சூ", "Moon": "சந்", "Mars": "செ", "Mercury": "பு",
                "Jupiter": "குரு", "Venus": "சுக்", "Saturn": "சனி", "Rahu": "ராகு", "Ketu": "கேது", "Asc": "ல"
            }
        }
    };

    const getTranslatedLabel = (sign: string) => {
        if (TRANSLATIONS[language]?.signs[sign]) return TRANSLATIONS[language].signs[sign];
        return sign; // Fallback to English
    };

    const getTranslatedPlanet = (planet: string) => {
        // Input is full English name e.g. "Sun" or "Asc"
        if (TRANSLATIONS[language]?.planets[planet]) return TRANSLATIONS[language].planets[planet];
        return planet.substring(0, 2); // Fallback to 2-char
    };

    const getPointsInSign = (signName: string) => {
        const points: string[] = [];

        // Check Ascendant
        const ascSignRaw = data.rawChart?.ascendant?.sign;
        if (ascSignRaw && ascSignRaw.includes(signName)) points.push(getTranslatedPlanet("Asc"));

        else if (!ascSignRaw) {
            const ascSign = data.technicalDetails?.find(d => d.label.includes('Ascendant') || d.label.includes('Lagnam'))?.value;
            if (ascSign?.includes(signName)) points.push(getTranslatedPlanet("Asc"));
        }

        // Check Planets
        if (data.rawChart?.planets) {
            data.rawChart.planets.forEach(p => {
                if (p.sign === signName) {
                    points.push(getTranslatedPlanet(p.name));
                }
            });
        } else {
            data.chartData?.planets.forEach(p => {
                if (p.sign.includes(signName)) {
                    points.push(getTranslatedPlanet(p.name));
                }
            });
        }

        return points;
    };

    const renderCell = (sign: string) => {
        const label = getTranslatedLabel(sign);
        const points = getPointsInSign(sign);
        return (
            <div className="relative border border-white/20 p-1 min-h-[80px] flex flex-col items-center justify-center bg-white/5 data-[filled=true]:bg-white/10 transition-colors" data-filled={points.length > 0}>
                <span className="absolute top-1 left-1 text-[8px] text-white/40 uppercase font-medium">{label}</span>
                <div className="flex flex-wrap gap-1 justify-center mt-3">
                    {points.map((pt, i) => (
                        <span key={i} className={`text-[10px] font-bold ${pt.includes('ல') || pt === 'Asc' ? 'text-red-400' : 'text-primary'}`}>
                            {pt}
                        </span>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="w-full max-w-md mx-auto aspect-square border-2 border-primary/30 bg-black/40 rounded-lg overflow-hidden grid grid-cols-4 grid-rows-4 text-white select-none shadow-2xl">
            {/* Row 1 */}
            {renderCell("Pisces")}
            {renderCell("Aries")}
            {renderCell("Taurus")}
            {renderCell("Gemini")}

            {/* Row 2 */}
            {renderCell("Aquarius")}
            <div className="col-span-2 row-span-2 border border-white/5 flex items-center justify-center relative">
                <div className="text-center opacity-40">
                    <span className="block text-xs font-bold tracking-widest text-primary uppercase">{language === 'Tamil' ? 'தென்னிந்திய' : 'SOUTH'}</span>
                </div>
            </div>
            {renderCell("Cancer")}

            {/* Row 3 */}
            {renderCell("Capricorn")}
            {/* Middle is spanned */}
            {renderCell("Leo")}

            {/* Row 4 */}
            {renderCell("Sagittarius")}
            {renderCell("Scorpio")}
            {renderCell("Libra")}
            {renderCell("Virgo")}
        </div>
    );
};

export default SouthIndianChart;
