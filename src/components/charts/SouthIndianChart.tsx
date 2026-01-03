import React from 'react';
import { InsightData } from '../../types';

interface ChartProps {
    data: InsightData;
}

const SouthIndianChart: React.FC<ChartProps & { language?: string }> = ({ data, language = 'English' }) => {

    const TRANSLATIONS: any = {
        'Tamil': {
            // Just planet abbreviations needed now
            planets: {
                "Sun": "சூ", "Moon": "சந்", "Mars": "செ", "Mercury": "பு",
                "Jupiter": "குரு", "Venus": "சுக்", "Saturn": "சனி", "Rahu": "ரா", "Ketu": "கே", "Asc": "ல",
                "Uranus": "யுரே", "Neptune": "நெப்", "Pluto": "புளூ"
            }
        }
    };

    const getTranslatedPlanet = (planet: string) => {
        if (language === 'Tamil' && TRANSLATIONS['Tamil'].planets[planet]) {
            return TRANSLATIONS['Tamil'].planets[planet];
        }
        // Default English 2-char
        return planet.substring(0, 2);
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

    const renderCell = (signName: string, signNumber: number) => {
        const points = getPointsInSign(signName);
        return (
            <div className="relative border border-white/20 p-1 min-h-[80px] flex flex-col items-center justify-center bg-white/5 data-[filled=true]:bg-white/10 transition-colors" data-filled={points.length > 0}>
                {/* Sign Number in Top Left */}
                <span className="absolute top-1 left-1.5 text-[10px] text-red-400/70 font-bold">{signNumber}</span>

                <div className="flex flex-wrap gap-1 justify-center mt-2">
                    {points.map((pt, i) => (
                        <span key={i} className={`text-[11px] font-bold ${pt.includes('ல') || pt === 'Asc' ? 'text-red-400' : 'text-primary'}`}>
                            {pt}
                        </span>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="w-full max-w-md mx-auto aspect-square border-2 border-primary/30 bg-black/40 rounded-lg overflow-hidden grid grid-cols-4 grid-rows-4 text-white select-none shadow-2xl font-sans">
            {/* South Indian Chart: Fixed Sign Positions */}
            {/* Row 1: Pisces(12), Aries(1), Taurus(2), Gemini(3) */}
            {renderCell("Pisces", 12)}
            {renderCell("Aries", 1)}
            {renderCell("Taurus", 2)}
            {renderCell("Gemini", 3)}

            {/* Row 2: Aquarius(11), Center, Cancer(4) */}
            {renderCell("Aquarius", 11)}
            <div className="col-span-2 row-span-2 border border-white/5 flex flex-col items-center justify-center relative">
                <img src="/assets/mandala-bg.png" className="absolute inset-0 w-full h-full object-contain opacity-10 p-4" alt="" />
                <div className="text-center z-10">
                    <h3 className="text-primary font-bold text-lg">{language === 'Tamil' ? 'ராசி கட்டம்' : 'Rasi Chart'}</h3>
                    <p className="text-[10px] text-white/50">{data.technicalDetails?.find(d => d.label.includes('Nakshatra'))?.value}</p>
                </div>
            </div>
            {renderCell("Cancer", 4)}

            {/* Row 3: Capricorn(10), Leo(5) */}
            {renderCell("Capricorn", 10)}
            {renderCell("Leo", 5)}

            {/* Row 4: Sagittarius(9), Scorpio(8), Libra(7), Virgo(6) */}
            {renderCell("Sagittarius", 9)}
            {renderCell("Scorpio", 8)}
            {renderCell("Libra", 7)}
            {renderCell("Virgo", 6)}
        </div>
    );
};

export default SouthIndianChart;
